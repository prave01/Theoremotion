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

  const [copied, setCopied] = useState<any>();

  const [error, setError] = useState<"retry" | "error" | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000/ws/console_logs");

    socket.onopen = () => {
      console.log("Connnected to scoket");
    };

    socket.onmessage = ({ data }) => {
      console.log("this is from server:", data);
    };
    return () => socket.close();
  }, []);

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
        setError("retry");
        const renderer_response = await axios({
          url: "http://localhost:4000/run-stream",
          method: "POST",
          responseType: "blob",
          data: {
            code: codeToRun,
          },
        });

        // Success
        const blob = renderer_response.data;
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setError(null);
        setLoading(false);
        toast.success("Rendered successfully");
      } catch (err: any) {
        // Error handling
        setError("error");
        setLoading(false);
        toast("Debugging and fixing with AI");

        let errorPayload: any = {};

        try {
          let text: string | undefined;

          if (err.response?.data instanceof Blob) {
            text = await err.response.data.text();
          } else if (typeof err.response?.data === "string") {
            text = err.response.data;
          } else if (typeof err.response?.data === "object") {
            errorPayload = err.response.data;
          }

          if (text) {
            try {
              errorPayload = JSON.parse(text);
            } catch (parseErr) {
              console.error("Response not valid JSON, got:", text);
            }
          }

          console.log("Error payload:", errorPayload);
        } catch (e) {
          console.error("Error parsing error payload", e);
        }

        const debug_response = await fetch("/api/ollama/debug", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: errorPayload?.code || codeToRun,
            error: errorPayload?.error?.stderr || err.message,
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
        } else {
          setLoading(false);
          setError(null);
          setCurrCode(undefined);
          toast.message("Internal server error", {
            description: "Retry later",
          });
          return;
        }
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
