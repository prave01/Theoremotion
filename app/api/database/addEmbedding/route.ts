import { pg } from "@/app/db/utils";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inputType = searchParams.get("inputType");

    if (inputType === "bulk") {
      const data = await req.formData();
      const file = data.get("data") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Invalid file type" },
          { status: 400 },
        );
      }

      const text = await file.text();

      const jsonData: Array<{ query: string; answer: string }> =
        JSON.parse(text);

      console.log("JSON parsed\n");

      const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large:latest",
        baseUrl: "http://localhost:11434",
        truncate: false,
      });

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 50,
      });

      // const vectorStore = await NeonPostgres.initialize(embeddings, {
      //   connectionString: process.env.DATABASE_URL as string,
      // });

      for (const i of jsonData) {
        const chunkedData = await textSplitter.createDocuments([i.query]);

        const vector = await embeddings.embedDocuments(
          chunkedData.map((doc) => doc.pageContent),
        );

        console.log("Embedding length:", vector.length);

        for (const vec of vector) {
          const vectorString = `[${vec.join(",")}]`;
          const response =
            await pg`INSERT INTO manim_finetune_data (prompt, script, embedding) VALUES (${i.query}, ${i.answer}, ${vectorString});`;
          console.log("response from pg:", response);
        }
      }

      return NextResponse.json({ done: "done" });
    }

    return NextResponse.json({ message: "No inputType provided" });
  } catch (e) {
    console.error("Error in POST handler:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
