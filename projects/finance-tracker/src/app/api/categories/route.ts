import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllCategories } from "@/lib/finance-data";

type Payload = { name?: string; slug?: string; color?: string; icon?: string; isActive?: boolean };

function validate(payload: Payload) {
  if (!payload.name?.trim()) return "Укажи название категории";
  if (!payload.slug?.trim()) return "Укажи slug категории";
  return null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const error = validate(payload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  const id = `cat_${randomUUID()}`;
  const now = new Date().toISOString();
  try {
    db.prepare(`INSERT INTO categories (id, name, slug, color, icon, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, payload.name!.trim(), payload.slug!.trim(), payload.color || null, payload.icon || null, payload.isActive ? 1 : 0, now, now);
  } catch {
    return NextResponse.json({ ok: false, error: "Не удалось создать категорию. Возможно, slug уже занят" }, { status: 400 });
  }
  const category = getAllCategories().find((item) => item.id === id);
  return NextResponse.json({ ok: true, category });
}
