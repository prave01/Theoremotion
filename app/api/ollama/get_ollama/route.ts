import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { pg } from "@/app/db/utils";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

export async function GET() {
  try {
    // Connect to LLM
    const ollama = new Ollama({
      model: "gemma3:4b",
      temperature: 0,
      baseUrl: "http://127.0.0.1:11434",
    });

    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large:latest",
      baseUrl: "http://localhost:11434",
      truncate: false,
    });

    // Step 1: Embed the query
    const queryEmbedding = await embeddings.embedQuery(
      "generate manim script of bouncing ball",
    );
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // Step 2: Retrieve most relevant stored scripts
    const results = await pg`
      SELECT id, prompt, script
      FROM manim_finetune_data
      ORDER BY embedding <-> ${vectorString}
      LIMIT 1;
    `;

    // Step 3: Create context from retrieved results
    const context = results
      .map((row: any, idx: number) => {
        const safeScript = row.script.replace(/{/g, "{{").replace(/}/g, "}}"); // escape braces for PromptTemplate

        return `Example ${idx + 1}:\nPrompt: ${row.prompt}\nScript:\n${safeScript}`;
      })
      .join("\n\n");

    console.log(context);

    // prompt template
    const prompt = PromptTemplate.fromTemplate(`
You are a Manim script expert.  
You generate correct, runnable Python Manim scripts.  

Task: Create a Manim script for "create a bouncing ball animation script".  
With this knowledge: ${context}.  
Output only the script, no explanations.
`);

    // chain
    const chain = prompt.pipe(ollama);

    // invoke
    const response = await chain.invoke({
      task: "generate manim script of bouncing ball",
      extra_context: "use geometric shapes with proper labels",
    });

    console.log("llm_response", response);

    return NextResponse.json(
      { results, llm_output: response },
      { status: 200 },
    );
  } catch (e) {
    console.error("error:", e);
    return NextResponse.json({ error: e?.toString() }, { status: 400 });
  }
}
