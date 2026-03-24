import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllMerchantRules } from "@/lib/finance-data";

type Payload = {
  matchType?: "exact" | "contains";
  pattern?: string;
  merchantNormalized?: string;
  categoryId?: string | null;
  directionOverride?: "expense" | "income" | null;
  priority?: number;
  notes?: string | null;
};

function validate(payload: Payload) {
  if (payload.matchType !== "exact" && payload.matchType !== "contains") return "Укажи тип совпадения";
  if (!payload.pattern?.trim()) return "Укажи паттерн";
  if (!payload.merchantNormalized?.trim()) return "Укажи нормализованное имя";
  if (typeof payload.priority !== "number" || Number.isNaN(payload.priority)) return "Укажи корректный приоритет";
  return null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const error = validate(payload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  const id = `rule_${randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO merchant_rules (id, match_type, pattern, merchant_normalized, category_id, direction_override, priority, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, payload.matchType, payload.pattern!.trim(), payload.merchantNormalized!.trim(), payload.categoryId ?? null, payload.directionOverride ?? null, payload.priority, payload.notes?.trim() || null, now, now);
  const merchantRule = getAllMerchantRules().find((item) => item.id === id);
  return NextResponse.json({ ok: true, merchantRule });
}
