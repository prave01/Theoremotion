import { Hono } from "hono";
import { $ } from "bun";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { cors } from "hono/cors";
import { upgradeWebSocket, websocket } from "hono/bun";
import { config } from "dotenv";

config();

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "https://theoremotion.vercel.app",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get(
  "/ws/run-stream",
  upgradeWebSocket((c) => {
    return {
      onOpen: (event, ws) => {
        console.log("connected successfully");
        ws.send("[server] Client connected successfully");
      },
      onMessage: async (event, ws) => {
        const { code } = JSON.parse(event.data as string);

        try {
          // Expect JSON with { code }
          if (!code) {
            ws.send(JSON.stringify({ error: "No valid Code" }));
            return;
          }

          // Create temporary dir + script file
          const tempDirPath = await mkdtemp(join(tmpdir(), "-works"));
          const tempScriptPath = join(tempDirPath, "script.py");
          await writeFile(tempScriptPath, code.toString());
          ws.send(`[server] Script written to ${tempScriptPath}`);

          // Spawn manim process with streaming stdout/stderr
          const proc = Bun.spawn({
            cmd: ["manim", "-ql", tempScriptPath],
            cwd: tempDirPath,
            stdout: "pipe",
            stderr: "pipe",
          });

          const dec = new TextDecoder();
          let errorBuffer: string | undefined;
          // Stream stdout
          (async () => {
            const reader = proc.stdout.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  console.log("Logs: \n", dec.decode(value));
                  ws.send(dec.decode(value));
                }
              }
            } finally {
              reader.releaseLock();
            }
          })();

          // Stream stderr
          (async () => {
            const reader = proc.stderr.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  const chunk = dec.decode(value);
                  console.log("Error Logs: \n", dec.decode(value));
                  errorBuffer += chunk;
                  ws.send(chunk);
                }
              }
            } finally {
              reader.releaseLock();
            }
          })();

          // Wait for process completion (single point of truth)
          const exitCode = await proc.exited;

          ws.send(`[server] Manim exited with code ${exitCode}`);

          if (exitCode == 0) {
            // Locate generated mp4 file
            const media_dir = join(tempDirPath, "media/videos/script/480p15");
            const files = await readdir(media_dir);
            const mp4 = files.find((f) => path.extname(f) === ".mp4");

            if (mp4) {
              const finalPath = join(media_dir, mp4);
              const video = await readFile(finalPath);

              // Send base64-encoded video
              const base64 = Buffer.from(video).toString("base64");
              ws.send(JSON.stringify({ video: base64 }));
              ws.send("[server] Video sent as base64");
            } else {
              ws.send(JSON.stringify({ error: "No video file found" }));
            }
          } else {
            // Send final error only when something went wrong
            console.log("Error catched here and the error is \n", errorBuffer);
            ws.send(
              JSON.stringify({
                code: code,
                error: errorBuffer,
              }),
            );
            ws.close();
          }
        } catch (err: any) {
          ws.send(JSON.stringify({ code: code, error: err }));
          ws.close();
        }
      },
    };
  }),
);

app.get(
  "/ws/console_logs",
  upgradeWebSocket((c) => {
    return {
      onOpen: (evt, ws) => {
        console.log("Client connected");
        ws.send("Hi from server");
      },
      onMessage: (event, ws) => {
        console.log("message from client:", event.data);
        ws.send(`client saying: ${event.data}`);
      },
    };
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
    const output = await $`manim -ql ${tempScriptPath}`.cwd(tempDirPath);

    output.stdout;

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

const port = Number(process.env.PORT) || 4000;

export default {
  port,
  fetch: app.fetch,
  websocket,
};
