"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Editor = () => {
  const [prompt, setPrompt] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [currentCode, setCurrCode] = useState<string | undefined>(undefined);

  const [logs, setLogs] = useState<string[]>([]);

  const [error, setError] = useState<"retry" | "error" | null>(null);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const typingRef = useRef<number | null>(null);

  const [model, setModel] = useState<string>("openai/gpt-oss-120b");

  useEffect(() => {
    if (logs.length === 0) return;

    if (logs.length - displayedLogs.length > 1) {
      setDisplayedLogs(logs.slice(0, logs.length - 1));
      setCurrentLine("");
    }

    if (logs.length > displayedLogs.length && typingRef.current === null) {
      const nextLine = logs[logs.length - 1];
      let i = 0;

      const step = () => {
        if (i < nextLine.length) {
          setCurrentLine((prev) => prev + nextLine[i]);
          i++;
          typingRef.current = requestAnimationFrame(step);
        } else {
          cancelAnimationFrame(typingRef.current!);
          typingRef.current = null;

          setDisplayedLogs((prev) => [...prev, nextLine]);
          setCurrentLine("");

          logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      };

      typingRef.current = requestAnimationFrame(step);
    }
  }, [logs, displayedLogs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedLogs, currentLine]);

  const handleSubmit = async () => {
    if (!prompt) {
      toast.message("Invalid Input");
      return;
    }

    setLoading(true);
    let codeToRun = currentCode;

    try {
      console.log("Started :D");
      setLogs(["Animation started :)"]);
      toast.success(`${model} selected`);
      const genScript = await fetch("/api/ollama/getOllama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt, model: model }),
      });

      if (!genScript.ok) {
        throw new Error("Script generation failed");
      }

      const data = await genScript.json();
      codeToRun = JSON.parse(data.llm_output).script;
      setCurrCode(codeToRun);

      toast.message("Script generated successfully", {
        description: `By ${model}`,
      });

      const connect = (script: string, attempt = 1) => {
        const socket = new WebSocket(
          "ws:theoremotion.onrender.com/ws/run-stream",
        );

        socket.onopen = () => {
          console.log("Connected to backend");
          socket.send(JSON.stringify({ code: script }));
          setError("retry");
        };

        socket.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);

            setError(null);

            if (msg.video) {
              const byteArray = Uint8Array.from(atob(msg.video), (c) =>
                c.charCodeAt(0),
              );
              const blob = new Blob([byteArray], { type: "video/mp4" });
              const url = URL.createObjectURL(blob);

              setVideoUrl(url);
              setLoading(false);
              setError(null);
              toast.success("Rendered successfully");
              socket.close();
            } else if (msg.error) {
              setLogs((prev) => [...prev, `[error] ${msg.error}`]);
              setError("error");

              console.warn(`Attempt ${attempt} failed. Retrying...`);

              const debug_response = await fetch("/api/ollama/debug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code: msg.code || script,
                  error: msg.error,
                }),
              });

              if (debug_response.ok && attempt < 10) {
                const dbg = await debug_response.json();
                const newScript = JSON.parse(dbg.llm_output).script;
                setCurrCode(newScript);

                toast("Retrying with modified code");
                socket.close();
                connect(newScript, attempt + 1); // recursive retry with new socket
              } else {
                setLoading(false);
                setError(null);
                setCurrCode(undefined);
                toast.message("Internal server error", {
                  description: "Retry later",
                });
                socket.close();
              }
            }
          } catch {
            setLogs((prev) => [...prev, event.data]);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
          socket.close();
        };

        socket.onclose = () => {
          console.log("Socket closed");
        };
      };

      connect(codeToRun as string);
    } catch (err) {
      console.error(err);
      setError(null);
      setLoading(false);
      setCurrCode(undefined);
      toast.message("Internal server error", {
        description: "Try with different model",
      });
    }
  };

  const handleSelect = (value: string) => {
    console.log("Selected model:", value);
    setModel(value);
  };
  return (
    <div
      id="editor"
      className="relative flex h-screen w-full items-center justify-center bg-transparent"
    >
      <div className="absolute inset-0 -z-40 h-full w-full overflow-x-hidden overflow-y-auto p-2 font-mono text-sm brightness-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-orange-300">Logs:</span>
        <div className="flex flex-col gap-1">
          {displayedLogs.map((line, i) => (
            <span key={i} className="whitespace-pre-wrap text-purple-300">
              {line}
            </span>
          ))}
          {currentLine && (
            <span className="whitespace-pre-wrap text-purple-300">
              {currentLine}
              <span className="animate-pulse">|</span>
            </span>
          )}
        </div>
        <div ref={logsEndRef} />
      </div>

      <div className="relative z-20 flex h-[500px] w-5xl items-center justify-center gap-x-4 text-sm">
        {" "}
        <div className="relative flex h-full w-full flex-col items-start gap-1 transition-all duration-75 ease-in-out">
          <div className="h-18 w-full rounded-lg border-2 border-zinc-800 bg-black px-2 py-2">
            <Select onValueChange={handleSelect} value={model}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="border-none border-zinc-800 bg-black text-purple-300">
                <SelectItem
                  value="openai/gpt-oss-120b"
                  className="focus:bg-zinc-800 focus:text-purple-300"
                >
                  openai/gpt-oss-120b
                </SelectItem>
                <SelectItem
                  className="focus:bg-zinc-800 focus:text-purple-300"
                  value="openai/gpt-oss-20b"
                >
                  openai/gpt-oss-20b
                </SelectItem>
                <SelectItem
                  className="focus:bg-zinc-800 focus:text-purple-300"
                  value="meta-llama/llama-4-maverick-17b-128e-instruct"
                >
                  meta-llama/llama-4-maverick-17b-128e-instruct
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <video
            loop
            autoPlay={videoUrl != undefined ? true : false}
            controls
            className="h-full max-h-[400px] w-full rounded-lg border-2 border-purple-500 bg-black"
            src={videoUrl || undefined}
          />{" "}
          <div className="h-auto rounded-2xl border-1 border-zinc-800 bg-black p-2">
            <Textarea
              value={prompt || ""}
              onChange={(e) => {
                e.preventDefault();
                setPrompt(e.target.value);
              }}
              placeholder="Prompts goes here ..."
              className="relative z-10 flex min-h-13 w-3xl items-center justify-start rounded-xl border-zinc-200 bg-gradient-to-tl from-black via-black to-black p-2 pt-3 pl-2 text-lg font-normal shadow-amber-50 placeholder:text-purple-300"
            />
            <Button
              disabled={
                loading || prompt == "" || prompt == null ? true : false
              }
              onClick={handleSubmit}
              className="text-whit cursor-pointer bg-zinc-500 text-sm hover:bg-purple-200 hover:text-black"
            >
              {loading ? "Loading.." : "Start animate"}
            </Button>
          </div>{" "}
        </div>
        <CodeBlock
          isError={error}
          language="python"
          filename=""
          code={currentCode || ""}
        />
      </div>
    </div>
  );
};
