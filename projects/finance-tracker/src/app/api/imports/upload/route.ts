import { NextResponse } from "next/server";
import { getImports } from "@/lib/finance-data";
import { importAlfaCsv } from "@/lib/alfa-import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const source = formData.get("source");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Файл не передан" }, { status: 400 });
  }

  if (source !== "alfa") {
    return NextResponse.json({ ok: false, error: "Сейчас поддерживается только Альфа CSV" }, { status: 400 });
  }

  try {
    const text = await file.text();
    const result = importAlfaCsv(file.name, text);
    const item = getImports().find((entry) => entry.id === result.importId);
    return NextResponse.json({ ok: true, item, summary: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Не удалось импортировать CSV" },
      { status: 500 },
    );
  }
}
