import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { pg } from "@/app/db/utils";

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
You are going to generate prompt for the given error, so the next llm will solves.
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
You are a Manim debugger/Error solving expert.  
Your ONLY output must be a valid JSON object with this shape:  


Here is some example python script which is closely realted to this problem

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
          content: `
Help me fix this Manim code:\n\n${data?.error}\n
Here is something that may help:\n\n${FinalPrompt}`,
        },
      ],
      temperature: 0.4,
      top_p: 0.9,
      response_format: { type: "json_object" },
    });

    return NextResponse.json({
      llm_output: completion.choices[0].message.content,
    });
  } catch (e: any) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
