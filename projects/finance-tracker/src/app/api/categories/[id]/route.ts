import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllCategories } from "@/lib/finance-data";

type Payload = { name?: string; slug?: string; color?: string; icon?: string; isActive?: boolean };

function validate(payload: Payload) {
  if (!payload.name?.trim()) return "Укажи название категории";
  if (!payload.slug?.trim()) return "Укажи slug категории";
  return null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Payload;
  const error = validate(payload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  try {
    const result = db.prepare(`UPDATE categories SET name = ?, slug = ?, color = ?, icon = ?, is_active = ?, updated_at = ? WHERE id = ?`)
      .run(payload.name!.trim(), payload.slug!.trim(), payload.color || null, payload.icon || null, payload.isActive ? 1 : 0, new Date().toISOString(), id);
    if (result.changes === 0) return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 404 });
  } catch {
    return NextResponse.json({ ok: false, error: "Не удалось обновить категорию. Возможно, slug уже занят" }, { status: 400 });
  }
  const category = getAllCategories().find((item) => item.id === id);
  return NextResponse.json({ ok: true, category });
}
