import { Hono } from "hono";
import { $ } from "bun";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "*", // allow all (or set "http://localhost:3001" for stricter)
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

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
    await $`manim -ql ${tempScriptPath}`.cwd(tempDirPath);

    let media_dir = join(tempDirPath, "/media/videos/script/480p15");

    const files = await readdir(media_dir);

    const checkMp4 = files.filter((file) => path.extname(file) === ".mp4");

    const finalPath = join(media_dir, checkMp4[0]);

    const video = await readFile(finalPath);
    return new Response(new Uint8Array(video), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": "inline; filename=output.mp4",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err) {
    return c.json({ code: code, error: err }, 500);
  }
});

export default app;
