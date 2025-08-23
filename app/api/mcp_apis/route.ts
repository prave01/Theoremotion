import { NextResponse } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export async function GET() {
  const client = new Client({
    name: "manim_mcp",
    version: "0.1",
    title: "manim",
  });

  const transport = SSEClientTransport({});
}
