import { pg } from "@/app/db/utils";
<<<<<<< HEAD
import { log } from "console";
=======
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
>>>>>>> 139b001 (Context length need a work :()
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
<<<<<<< HEAD

    const inputType = searchParams.get("inputType");

    console.log(inputType);
    if (inputType == "bulk") {
      console.log(inputType);
      const data = await req.formData();
      const file = data.get("data") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 500 },
        );
      }
      console.log("Data received : ✅");
      const text = await file.text();

      console.log("Parsing the data");

      let jsonData: Array<{ query: string; answer: string }>;
      try {
        jsonData = JSON.parse(text);
      } catch (e) {
        throw Error(`Error while parsing ${e?.toString}`);
      }

      console.log("Updating db....");

      try {
        jsonData.forEach(async (items) => {
          let response = await pg.query(
            "INSERT INTO manim_finetune_set (prompt, script) VALUES ($1, $2)",
            [items.query, items.answer],
          );
          console.log(`DB status : \n ${response}`);
        });
      } catch (e) {
        throw Error(`Error while seeding db: ${e?.toString}`);
      }

      console.log("DB seeded successfully");

      return NextResponse.json(
        { name: file?.name, type: file?.size },
        { status: 200 },
      );
    }
  } catch (e) {
    console.log("Error", e);
    return NextResponse.json({ error: e }, { status: 500 });
=======
    const inputType = searchParams.get("inputType");

    if (inputType !== "bulk") {
      return NextResponse.json({ error: "Invalid inputType" }, { status: 400 });
    }

    const data = await req.formData();
    const file = data.get("data") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("✅ File received:", file.name);
    const text = await file.text();

    let jsonData: Array<{ query: string; answer: string }>;
    try {
      jsonData = JSON.parse(text);
    } catch (e: any) {
      throw new Error(`Error while parsing JSON: ${e?.message}`);
    }

    console.log("📦 Parsed JSON, length:", jsonData.length);

    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large:latest",
      baseUrl: "http://localhost:11434",
    });

    // const embeddings = new OpenAIEmbeddings({
    //   apiKey: openai_api,
    //   model: "text-embedding-3-large",
    // });
    //
    console.log("⚡ Generating embeddings & inserting into DB...");

    for (const item of jsonData) {
      const inputText = `${item.query} ${item.answer}`;

      // get embedding
      const embed = await embeddings.embedQuery(inputText.toString());

      console.log("🧠 Embedding generated (first 5 dims):", embed.slice(0, 5));

      // insert into Neon/pgvector
      await pg`
        INSERT INTO manim_finetune_data (prompt, script, embedding)
        VALUES (${item.query}, ${item.answer}, ${embed}::vector)
        ON CONFLICT DO NOTHING
      `;
    }

    console.log("✅ DB seeded successfully");

    return NextResponse.json(
      { uploaded: file.name, size: file.size, records: jsonData.length },
      { status: 200 },
    );
  } catch (e: any) {
    console.error("❌ Error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 },
    );
>>>>>>> 139b001 (Context length need a work :()
  }
}
