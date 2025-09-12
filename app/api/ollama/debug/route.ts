import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // OpenAI (Groq-compatible) client
    const openai = new OpenAI({
      apiKey: process.env.GROQ_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const buildPrompt = await openai.chat.completions.create({
      model: "qwen/qwen3-32b",
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
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a Manim debugger.  
Return output strictly as a valid JSON object in this exact format:

{
  "script": "<CORRECTED PYTHON SCRIPT>",
  "explanation": "<WHY IT WAS WRONG AND HOW IT WAS FIXED>"
}

Rules:
1. Analyze the provided Manim script.
2. Fix syntax errors, runtime issues, or invalid API usage.
3. The "script" must be a full runnable Manim file:
   - starts with "from manim import *"
   - exactly one Scene class
4. Keep fixes minimal and correct, do not add extra complexity.
5. Do not output anything outside the JSON object.
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
