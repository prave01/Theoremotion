"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";

export const Editor = (props: {}) => {
  const [prompt, setPrompt] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [currentCode, setCurrCode] = useState<string | undefined>(undefined);

  const [copied, setCopied] = useState<any>();

  const handleSubmit = async () => {
    let retry = true;
    setLoading(true);

    let codeToRun = currentCode;

    if (!codeToRun) {
      const res = await fetch("/api/stream");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let fullText = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // NDJSON => split by lines
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          const parsed = JSON.parse(line);
          fullText += parsed.output;
          console.log("Partial:", fullText); // <-- update UI progressively
        }
      }
      setCurrCode(codeToRun);
    }

    while (retry) {
      retry = false;
      console.log("codetorun", codeToRun);

      const renderer_response = await fetch("http://localhost:8000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToRun }),
      });

      if (renderer_response.ok) {
        const blob = await renderer_response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        return;
      }

      const renderer_data = await renderer_response.json();
      console.log("data,::", renderer_data);

      const debug_response = await fetch("/api/ollama/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: renderer_data?.code || codeToRun,
          error: renderer_data?.error,
        }),
      });

      const debugged = await debug_response.json();
      codeToRun = JSON.parse(debugged.llm_output).script;
      setCurrCode(codeToRun);
      retry = true;
    }
  };
  return (
    <div
      id="editor"
      className="flex h-screen w-full items-center justify-center bg-black"
    >
      <div className="flex h-[400px] w-5xl flex-col items-center justify-center gap-y-4 text-sm">
        {" "}
        <div className="trasition-all flex h-full w-full items-start gap-2 duration-75 ease-in-out">
          <video
            loop
            autoPlay={videoUrl != undefined ? true : false}
            controls
            width="600"
            className="h-full w-full rounded-lg border-2 border-gray-500"
            src={videoUrl || undefined}
          />

          <CodeBlock
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
          disabled={loading}
          onClick={handleSubmit}
          className="text-whit cursor-pointer bg-zinc-500 text-sm hover:bg-purple-200 hover:text-black"
        >
          {loading ? "Loading.." : "Start animate"}
        </Button>
      </div>
    </div>
  );
};
