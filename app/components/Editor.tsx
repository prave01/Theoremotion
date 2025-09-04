"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const Editor = (props: {}) => {
  const [prompt, setPrompt] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const runCode = async () => {
    const response = await fetch("http://localhost:8000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: `
from manim import *

class BinaryTreeDemo(Scene):
    def construct(self):
        dot = Dot()
        self.play(Create(dot))
        self.wait()
        `,
      }),
    });

    if (response.ok) {
      const blob = await response.blob();
      setVideoUrl(URL.createObjectURL(blob));
    }
  };

  const handleSubmit = async () => {
    let currentCode = null;
    let retry = true;

    let codeToRun: any = currentCode;
    if (!codeToRun) {
      const response = await fetch("/api/ollama/getOllama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt }),
      });
      const data = await response.json();

      const script = await JSON.parse(data.llm_output).script;
      console.log("llm_data", script);
      codeToRun = script;
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

      const debug_script = await JSON.parse(debugged.llm_output).script;

      codeToRun = debug_script;
      retry = true;
    }
  };
  return (
    <div
      id="editor"
      className="flex h-screen w-full items-center justify-center bg-black"
    >
      {videoUrl && <video autoPlay loop controls width="600" src={videoUrl} />}
      <div className="flex h-auto w-auto flex-col items-center justify-center gap-y-4">
        {" "}
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
          onClick={handleSubmit}
          className="text-whit cursor-pointer text-sm hover:bg-purple-200 hover:text-black"
        >
          Start animate
        </Button>
      </div>
    </div>
  );
};
