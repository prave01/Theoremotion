import { Ollama } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { pg } from "@/app/db/utils";

export async function GET() {
  try {
    const get = fetch("http://124.0.0.1:11434/");
    console.log(get);

    // Connect to LLM
    const ollama = new Ollama({
      model: "gemma3:4b",
      temperature: 0,
      baseUrl: "http://127.0.0.1:11434",
      format: "json",
      embeddingOnly: true,
    });

    // Generate script
    const response = await ollama.invoke(
      "generate manim script of bouncing ball",
    );
    return NextResponse.json({ response }, { status: 200 });
  } catch (e) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
