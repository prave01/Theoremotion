import { Hono } from "hono";
import { tmpdir } from "node:os";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { cors } from "hono/cors";
import { upgradeWebSocket, websocket } from "hono/bun";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: "https://theoremotion.vercel.app", // allow all (or set "http://localhost:3001" for stricter)
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

const port = Number(process.env.PORT) || 4000;

export default {
  port,
  fetch: app.fetch,
  websocket,
};
