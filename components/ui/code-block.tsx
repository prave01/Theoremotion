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
  isError: boolean;
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
  filename,
  isError,
  code,
  highlightLines = [],
  tabs = [],
}: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const tabsExist = tabs.length > 0;

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].code : code;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language;
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines;

  return (
    <div
      className={cn(
        "relative flex h-full w-full max-w-[40%] rounded-lg border-1 border-cyan-500 p-4 font-mono text-sm",
        isError
          ? "bg-gradient-to-t from-red-500/30 to-transparent backdrop-blur-md"
          : "bg-black",
      )}
    >
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
        {!tabsExist && filename && (
          <div className="flex items-center justify-between py-2">
            <div className="text-xs text-zinc-400">{filename}</div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 font-sans text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </button>
          </div>
        )}
      </div>
      {isError ? (
        <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center">
          <Button className="">
            <span className="animate-pulse">Fixing</span>
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
        className={cn(isError && "blur-xs", "no-scrollbar")}
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
