import { NeonPostgres } from "@langchain/community/vectorstores/neon";
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

      let jsonData: Array<{ query: string; answer: string }> = JSON.parse(text);

      console.log("JSON parsed\n");

      const embeddings = new OllamaEmbeddings({
        model: "mxbai-embed-large:latest",
        baseUrl: "http://localhost:11434",
      });

      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 50,
      });

      console.log(jsonData[0].answer);

      const chunkedText = await textSplitter.createDocuments([
        jsonData[0].answer,
      ]);

      console.log(chunkedText);

      const vectors = await embeddings.embedDocuments(
        chunkedText.map((doc) => doc.pageContent),
      );

      console.log(vectors); // just preview

      return NextResponse.json({ done: "done" });
    }

    return NextResponse.json({ message: "No inputType provided" });
  } catch (e: any) {
    console.error("Error in POST handler:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
