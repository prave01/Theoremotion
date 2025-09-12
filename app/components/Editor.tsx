"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { toast } from "sonner";
import axios from "axios";

export const Editor = (props: {}) => {
  const [prompt, setPrompt] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [currentCode, setCurrCode] = useState<string | undefined>(undefined);

  const [copied, setCopied] = useState<[]>();

  const [logs, setLogs] = useState<string[]>([]);

  const [error, setError] = useState<"retry" | "error" | null>(null);

  const handleSubmit = async () => {
    if (prompt == "" || prompt == null) {
      toast.message("Invalid Input");
      return;
    }
    let retry = true;
    setLoading(true);

    let codeToRun = currentCode;

    await fetch("/api/ollama/getOllama", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: prompt,
      }),
    })
      .then(async (data) => {
        const parsed = await data.json();
        const script = await JSON.parse(parsed.llm_output).script;
        codeToRun = script;
        setCurrCode(codeToRun);
        toast.message("Script generated successfully", {
          description: "By Openai/gpt-oss-120B",
        });
      })
      .catch((e) => {
        setError(null);
        toast.error(e as string);
        return;
      });

    while (retry) {
      retry = false;
      try {
        console.log(retry);
        setError("retry");

        const socket = new WebSocket("ws://localhost:4000/ws/run-stream");

        socket.onopen = () => {
          console.log("Connected to backend ");
          socket.send(JSON.stringify({ code: codeToRun }));
        };

        socket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.video) {
              // Convert base64 back to blob
              const byteArray = Uint8Array.from(atob(data.video), (c) =>
                c.charCodeAt(0),
              );
              const blob = new Blob([byteArray], { type: "video/mp4" });
              const url = URL.createObjectURL(blob);
              setVideoUrl(url);
              setLoading(false);
              toast.success("Rendered successfully");
              return;
            } else if (data.error) {
              setLogs((prev) => [...prev, `[error] ${data.error}`]);
              const debug_response = await fetch("/api/ollama/debug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code: data.code || codeToRun,
                  error: data.error,
                }),
              });

              if (debug_response.ok) {
                await debug_response
                  .json()
                  .then((data) => {
                    toast("Retrying with modified code");
                    setError("retry");
                    codeToRun = JSON.parse(data?.llm_output).script;
                    setCurrCode(codeToRun);
                    retry = true;
                  })
                  .catch((e) => {
                    setError("error");
                    toast.error("Internal Error, pls try after sometime");
                    console.error(e);
                  });
                socket.close();
                retry = true;
              } else {
                setLoading(false);
                setError(null);
                setCurrCode(undefined);
                toast.message("Internal server error", {
                  description: "Retry later",
                });
                socket.close();
                return;
              }
            }
          } catch {
            // Plain text logs
            setLogs((prev) => [...prev, event.data]);
            console.log("Logs: ", event.data);
          }
        };
      } catch (err: any) {
        retry = true;
        console.error(err);
      }
    }
  };

  return (
    <div
      id="editor"
      className="flex h-screen w-full items-center justify-center bg-black"
    >
      <div className="flex h-[400px] w-5xl flex-col items-center justify-center gap-y-4 text-sm">
        {" "}
        <div className="relative flex h-full w-full items-start gap-2 transition-all duration-75 ease-in-out">
          <video
            loop
            autoPlay={videoUrl != undefined ? true : false}
            controls
            className="h-full w-full max-w-[80%] rounded-lg"
            src={videoUrl || undefined}
          />{" "}
          <CodeBlock
            isError={error}
            language="python"
            filename=""
            highlightLines={[9, 13, 14, 18]}
            code={currentCode || ""}
          />
        </div>
        <div className="h-auto rounded-2xl border-1 border-zinc-800 p-0.5">
          <Textarea
            value={prompt || ""}
            onChange={(e) => {
              e.preventDefault();
              setPrompt(e.target.value);
            }}
            placeholder="Prompts goes here ..."
            className="relative z-10 flex min-h-13 w-3xl items-center justify-start rounded-xl border-zinc-200 bg-gradient-to-tl from-black via-black to-black pt-4 pl-5 text-lg font-normal shadow-amber-50 placeholder:text-purple-300"
          />
        </div>
        <Button
          disabled={loading || prompt == "" || prompt == null ? true : false}
          onClick={handleSubmit}
          className="text-whit cursor-pointer bg-zinc-500 text-sm hover:bg-purple-200 hover:text-black"
        >
          {loading ? "Loading.." : "Start animate"}
        </Button>
      </div>
    </div>
  );
};
