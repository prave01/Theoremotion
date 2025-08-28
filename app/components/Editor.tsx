"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const Editor = (props: {}) => {
  const [prompt, setPrompt] = useState<string | null>(null);

  const handleSubmit = async () => {
    const response = await fetch("/api/ollama/getOllama", {
      method: "POST",
      headers: {
        "Content-Type": `application/json`,
      },
      body: JSON.stringify({
        query: prompt,
      }),
    });
    console.log(response);
  };
  return (
    <div
      id="editor"
      className="flex h-screen w-full items-center justify-center bg-black"
    >
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
