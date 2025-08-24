import { Ollama } from "@langchain/ollama";
import { NextResponse } from "next/server";

export async function GET() {
  const llm = new Ollama({
    model: "gemma3:4b",
    temperature: 0,
    maxRetries: 2,
  });

  const inputText = "Ollama is an AI company that ";

  const completion = await llm.invoke(inputText);
  return NextResponse.json({ data: completion }, { status: 200 });
}
