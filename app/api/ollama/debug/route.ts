import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { pg } from "@/app/db/utils";
import OpenAI from "openai";
import build from "next/dist/build";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // OpenAI (Groq-compatible) client
    const openai = new OpenAI({
      apiKey: process.env.GROQ_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const buildPrompt = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "system",
          content: `
You are a Manim debugger.
- Your goal is to carefully analyze Manim Python scripts and find issues.
- Point out syntax errors, runtime problems, or incorrect Manim API usage.
- Suggest fixes in clean, valid Python code compatible with Manim.
- Ensure corrected scripts are error-free and run smoothly.
- Clearly explain what went wrong and why your fix solves it.
- Avoid introducing new errors or unnecessary complexity.
- Output only the corrected script and explanation.
`.trim(),
        },
        {
          role: "user",
          content: `Debug the following Manim script:\n\n${data?.code},\n Error: ${data?.error} `,
        },
      ],
    });
    const FinalPrompt = buildPrompt.choices[0].message.content || "";

    // Call OpenAI (Groq)

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "system",
          content: `
You are a Manim debugger.  
Your ONLY output must be a valid JSON object with this shape:  

You to solve this Error : ${data?.error} for this  Code: ${data?.code}

OTUTPUT_FORMAT:
{ "script": "<CORRECTED PYTHON SCRIPT>" }  

Rules:  
1. Analyze the provided Manim script carefully.  
2. Detect syntax errors, runtime issues, or incorrect API usage.  
3. Fix them in clean, valid Python code compatible with Manim.  
4. The "script" value must be a complete runnable Manim file with:  
   - "from manim import *"  
   - Exactly ONE Scene class.  
5. The "explanation" value must clearly describe:  
   - What went wrong.  
   - Why your fix solves it.  
6. Do not introduce new complexity. Keep fixes minimal and correct.  
7. Ensure the corrected script runs smoothly without overlap or broken animations.  

Final check:  
- Output must be ONLY the JSON object.  
- No extra text, no comments, no markdown.  
      `.trim(),
        },
        {
          role: "user",
          content: `Debug the following Manim script:\n\n${FinalPrompt}`,
        },
      ],
      temperature: 0.4,
      top_p: 0.9,
      stream: true,
      response_format: { type: "json_object" },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ output: chunk }) + "\n"),
          );
          await new Promise((r) => setTimeout(r, 500));
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
      },
    });
  } catch (e: any) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
