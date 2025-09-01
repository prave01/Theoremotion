import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { pg } from "@/app/db/utils";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // OpenAI (Groq-compatible) client
    const openai = new OpenAI({
      apiKey: process.env.GROQ_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Embeddings (keep Ollama for vector search)
    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large:latest",
      baseUrl: "http://localhost:11434",
      truncate: false,
    });

    // Create query embedding
    const queryEmbedding = await embeddings.embedQuery(data?.query);
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Retrieve most relevant context from Postgres
    const results = await pg`
      SELECT id, prompt, script
      FROM manim_finetune_data
      ORDER BY embedding <-> ${vectorString}
      LIMIT 1;
    `;

    const context = results
      .map((row: any, idx: number) => {
        const safeScript = row.script.replace(/{/g, "{{").replace(/}/g, "}}");

        return `Example ${idx + 1}:\nPrompt: ${row.prompt}\nScript:\n${safeScript}`;
      })
      .join("\n\n");

    console.log("context:", context);

    // Call OpenAI (Groq)
    const response = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content:
            'You are a Manim script director.\nYou generate only correct, runnable Python Manim scripts.\nAlways output a single JSON object with exactly one key: "script".\nThe value of "script" must be the complete Python code including all required imports (e.g., \'from manim import *\').\nThe script must:\n- Define exactly one Scene class.\n- Place objects with clear spatial separation to avoid overlaps.\n- Use geometric shapes with labels when requested.\n- Ensure animations are staged (sequential or well-spaced) for clarity.\n- Follow current Manim best practices (use FadeIn, Write, Create, etc.).\nDo not include explanations, markdown, or comments outside the JSON.',
        },
        {
          role: "user",
          content: `Task: Create a Manim script for ${data?.query || "bouncing ball animation"}".\nWith this knowledge: ${context}.\nExtra context: Use geometric shapes with proper labels. Return the output strictly in JSON.`,
        },
      ],
      temperature: 0,
      response_format: {
        type: "json_object",
      },
    });

    const llm_output = response.choices[0].message?.content || "";

    console.log("llm_response:", llm_output);

    return NextResponse.json({ llm_output }, { status: 200 });
  } catch (e: any) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
