"use client";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type CodeBlockProps = {
  language: string;
  filename: string;
  isError: string | null;
  highlightLines?: number[];
} & (
    | {
      code: string;
      tabs?: never;
    }
    | {
      code?: never;
      tabs: Array<{
        name: string;
        code: string;
        language?: string;
        highlightLines?: number[];
      }>;
    }
  );

export const CodeBlock = ({
  language,
  isError,
  code,
  highlightLines = [],
  tabs = [],
}: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabsExist = tabs.length > 0;

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language;
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // reset after 2s
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div
      className={cn(
        "relative z-10 flex h-full w-full min-w-[50%] rounded-lg border-2 border-dashed border-cyan-500 p-4 font-mono text-sm",
        isError == "error"
          ? "bg-gradient-to-t from-red-500/30 to-transparent backdrop-blur-md"
          : isError == "retry"
            ? "bg-gradient-to-t from-cyan-500/30 to-transparent backdrop-blur-md"
            : "bg-black",
      )}
    >
      {code !== undefined && code !== "" ? (
        <Button
          onClick={() => copyToClipboard(code)} // 👈 explicitly pass your text
          className="flex items-center gap-1 bg-purple-500 font-sans text-xs text-zinc-400 transition-colors hover:text-zinc-200"
        >
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
        </Button>
      ) : (
        ""
      )}

      <div className="flex-col gap-2">
        {tabsExist && (
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-3 !py-2 font-sans text-xs transition-colors ${activeTab === index
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {isError ? (
        <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center brightness-75">
          <Button className="">
            <span className="animate-pulse">
              {isError == "retry" ? "Rendering" : "Fixing"}
            </span>
          </Button>
        </div>
      ) : (
        <></>
      )}
      <SyntaxHighlighter
        language={activeLanguage}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: 0,
          background: "transparent",
          fontSize: "0.875rem",
          width: "100%",
          overflowY: "scroll",
          overflowX: "scroll",
        }}
        className={cn(
          isError == "retry" || isError == "error"
            ? "no-scrollbar blur-xs"
            : "no-scrollbar",
        )}
        wrapLines={true}
        showLineNumbers={true}
        lineProps={(lineNumber) => ({
          style: {
            backgroundColor: activeHighlightLines.includes(lineNumber)
              ? "rgba(255,255,255,0.1)"
              : "transparent",
            display: "block",
          },
        })}
        PreTag="div"
      >
        {String(activeCode)}
      </SyntaxHighlighter>
    </div>
  );
};
