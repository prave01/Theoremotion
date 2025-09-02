import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { pg } from "@/app/db/utils";
import OpenAI from "openai";
import build from "next/dist/build";

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
      LIMIT 5;
    `;

    const context = results
      .map((row: any, idx: number) => {
        const safeScript = row.script.replace(/{/g, "{{").replace(/}/g, "}}");

        return `Example ${idx + 1}:\nPrompt: ${row.prompt}\nScript:\n${safeScript}`;
      })
      .join("\n\n");

    // Generate prompt
    const buildPrompt = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `
You are a Manim script generator.
- Think like a director and scene designer.
- The goal is to produce clear, lecture-ready animations for teaching.
- Scripts must be error-free, easy to understand, and visually engaging.
- Avoid overlapping of text or elements. Always position objects relative to the content in a readable way.
- Use smooth, purposeful animations that aid comprehension.
- Apply consistent styling (colors, labels, positions).
- Output only valid Python code compatible with Manim.
- Make sure you added space between two animation so they will never overlaps each other and dont follow the origin position for previouly rendered animation scene for upcomings
`.trim(),
        },
        {
          role: "user",
          content: `Generate a Manim script for the following request:\n\n${data?.query}`,
        },
      ],
    });

    const FinalPrompt = buildPrompt.choices[0].message.content || "";

    // Call OpenAI (Groq)

    const response = await openai.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content: `
You are a Manim script generator.
Your sole output must be a valid, runnable Python script.

Output rules:
- Always return a single JSON object.
- JSON must contain exactly one key: "script".
- The value of "script" must be a complete Python file with all necessary imports (e.g., "from manim import *").

Script requirements:
1. Define exactly one Scene class.
2. Keep all objects inside the default camera frame (no cropping or overflow).
3. Avoid clutter and overlaps:
   - Place objects with clear spacing using "next_to", "above", "below", or "shift".
   - Fade out or remove old objects before adding new ones, unless reused.
4. Sequential staging:
   - Introduce one concept at a time.
   - Group related objects and fade them out together when no longer needed.
5. Labels:
   - Always wrap math in $...$ (e.g., "$a^2$" not "a^2").
   - Place labels clearly near their objects, never overlapping.
6. Groups:
   - Use "Group" for combining objects (works with both Mobject and VMobject).
   - Do NOT use "VGroup" unless absolutely sure all members are VMobject.
7. Animations:
   - Use "Create", "Write", "FadeIn", "FadeOut" smoothly.
   - Avoid leaving objects behind when introducing new ones.
8. Ending:
   - Ensure the scene ends with a clean fade out of all objects.

Error prevention:
- Always enclose LaTeX expressions in "$...$".
- Never mix Mobject types in VGroup; default to Group.
- Avoid raw LaTeX that requires math mode (e.g., use "$\\\\triangle ABC$" not "\\\\triangle ABC").

Important:
- Do not include explanations, comments, or markdown outside the JSON.
- The JSON object must be the only output.
      `.trim(),
        },
        {
          role: "user",
          content: `
Task: Create a Manim script for ${FinalPrompt || "bouncing ball animation"}.
Context: ${context}.
Extra requirement: Use geometric shapes with clear, non-overlapping labels.
Return the output strictly as a JSON object.
      `.trim(),
        },
      ],
      temperature: 0.6,
      top_p: 0.95,
      response_format: { type: "json_object" },
    });
    const llm_output = response.choices[0].message?.content || "";

    console.log("llm_response:", llm_output);

    return NextResponse.json({ llm_output }, { status: 200 });
  } catch (e: any) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
