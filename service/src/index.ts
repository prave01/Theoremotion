import { Hono } from "hono";
import { $ } from "bun";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readdir } from "node:fs";

const app = new Hono();

app.post("/run-stream", async (c) => {
  const { code } = await c.req.json();
  if (!code) {
    return c.json({ message: "No valid Code" }, 400);
  }

  try {
    // Create temporary directory for holding script and genreated video
    const tempDirPath = await mkdtemp(join(tmpdir(), "-works"));
    console.log("Temp folder has been created at", tempDirPath);

    // Create tmp script file
    const tempScriptPath = join(tempDirPath, "script.py");
    // Write code into the script file
    await writeFile(tempScriptPath, code.toString());
    console.log("Script file created at", tempScriptPath);

    const fileContent = await readFile(tempScriptPath, "utf8");

    console.log("Content\n", fileContent);

    // const cliResponse = await $`python3 ${tempScriptPath}`;
    const cliResponse = await $`manim -pql ${tempScriptPath}`.cwd(tempDirPath);

    let media_dir = join(tempDirPath, "/media/videos");
    let mp4_path = null;

    readdir(media_dir, (err, files) => {
      if (err) {
        console.error(err);
        return c.json({ message: err }, 500);
      }

      console.log("Contents in", media_dir, "\n", files);
    });

    return c.json({
      data: await cliResponse.json(),
    });
  } catch (err) {
    return c.json({ message: err }, 500);
  }
});

export default app;
