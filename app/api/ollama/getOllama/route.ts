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

    console.log("FinalPrompt", FinalPrompt);

    // Call OpenAI (Groq)

    const completion = openai.chat.completions.stream({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `

You are a Manim script generator.  
Your ONLY output must be a valid JSON object with this shape:  
{ "script": "<COMPLETE PYTHON SCRIPT>" }  

You can use this knowledge base: ${context},  

Rules:  
1. The value of "script" must be a full, runnable Manim Python file with:  
   - "from manim import *"  
   - Exactly ONE Scene class.  

2. Layout & spacing:  
   - Keep all objects fully inside the default frame (no cropping).  
   - Use clear spacing with "next_to", "above", "below", or "shift".  
   - Never overlap text, shapes, or equations.  
   - Titles/subtitles must always stay at the top.  
   - Equations should appear centered or slightly above if diagrams follow.  
   - Diagrams must be placed below equations with enough buffer.  
   - Labels must always be near their objects but never touching or overlapping.  

3. Sequencing:  
   - Show one concept at a time.  
   - Always FadeOut or remove old objects before introducing new ones in the same area.  
   - Related objects must be grouped with "Group" (never VGroup unless all are VMobjects).  

4. Labels:  
   - All math MUST be inside $...$ (e.g. "$a^2$").  
   - Keep font sizes readable and consistent.  
   - Position labels with next_to or shift so they never overlap.  

5. Animations:  
   - Use smooth, purposeful transitions: FadeIn, FadeOut, Write, Create, MoveAlongPath.  
   - Add small pauses (self.wait) to let viewers absorb each concept.  
   - Never leave stray objects behind on screen.  

6. Ending:  
   - Scene must finish with FadeOut of ALL objects (use Group, not VGroup).  

7. Error prevention:  
   - No raw LaTeX outside math mode.  
   - No mixing Mobjects inside VGroup.  
   - Always size and position objects relative to screen or main object.  
   - Ensure new objects never collide with or overwrite existing ones.  
   - All text and MathTex must be UTF-8 safe.  

Final check:  
- Output must be ONLY the JSON object.  
- No extra text, no comments, no markdown.  

      `.trim(),
        },
        {
          role: "user",
          content: `User Quert : Generate manim script for ${FinalPrompt}`,
        },
      ],
      temperature: 1,
      top_p: 0.9,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for await (const event of completion) {
          console.log(event.choices[0].delta);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ output: event.choices[0].delta }) + "\n",
            ),
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
