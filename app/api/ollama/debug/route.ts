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
      model: "moonshotai/kimi-k2-instruct-0905",
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
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `
You are a Manim debugger assistant.  
Return output strictly as a single JSON object and nothing else.

Output schema:
{
  "script": "<FULL_CORRECTED_MANIM_PYTHON_SCRIPT>",
  "diagnostics": ["<short strings explaining fixes performed>"],
  "confidence": "<low|medium|high>"
}

Rules:
1. Input: an error message and the original Manim script.
2. Return a complete runnable Manim file in "script":
   - Must start with: "from manim import *"
   - Must contain exactly one "class <Name>(Scene):" definition (or subclass of Scene).
   - The file must be self-contained (imports and the one Scene only).
3. Fix only what is necessary:
   - syntax errors
   - incorrect API usage
   - name mismatches
   - missing imports
   - indentation issues
   - runtime bugs preventing execution
4. Do NOT add unrelated features, comments, or explanations outside diagnostics.
5. "diagnostics" = short actionable items like:
   - "Fixed missing import: import numpy as np"
   - "Corrected scene class name from X to Y"
   - "Fixed indentation on line 23"
6. "confidence":
   - "high" → runs cleanly
   - "medium" → risky assumptions made
   - "low" → could not fully infer missing context
7. If no valid script possible, set "script" = "" and add reason in diagnostics.
8. Keep output minimal and strictly JSON (no markdown, no prose).
      `.trim(),
        },
        {
          role: "user",
          content: `
Error:
${data?.error}

Code:
${data?.code}

Additional Hints:
${FinalPrompt}
      `.trim(),
        },
      ],
      temperature: 0.3,
      top_p: 0.85,
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
