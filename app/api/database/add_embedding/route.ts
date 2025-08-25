import { pg } from "@/app/db/utils";
import { log } from "console";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

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
  }
}
