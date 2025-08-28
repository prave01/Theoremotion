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

    // Build system + user messages for OpenAI
    const messages = [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `You are a Manim script expert.
You generate correct, runnable Python Manim scripts.
Only output valid Python code (no explanations).`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Task: Create a Manim script for "${data?.query || "bouncing ball animation"}".
With this knowledge: ${context}.
Extra context: use geometric shapes with proper labels.`,
          },
        ],
      },
    ];

    // Call OpenAI (Groq)
    const response = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b", // or "gpt-4o-mini" etc
      messages: [
        {
          role: "system",
          content: `You are a Manim script expert.
You generate correct, runnable Python Manim scripts.
Only output valid Python code (no explanations).`,
        },
        {
          role: "user",
          content: `Task: Create a Manim script for "${data?.query || "bouncing ball animation"}".
With this knowledge: ${context}.
Extra context: use geometric shapes with proper labels.`,
        },
      ],
      temperature: 0,
    });

    const llm_output = response.choices[0].message?.content || "";

    console.log("llm_response:", llm_output);

    return NextResponse.json({ llm_output }, { status: 200 });
  } catch (e: any) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
