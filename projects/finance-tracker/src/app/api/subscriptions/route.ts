import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSubscriptions } from "@/lib/finance-data";

type Payload = {
  name?: string;
  period?: "monthly" | "yearly";
  amount?: number;
  status?: "active" | "paused";
  chargeDay?: number;
  chargeMonth?: number | null;
  autoPay?: boolean;
};

function validatePayload(payload: Payload) {
  if (!payload.name?.trim()) return "Укажи название подписки";
  if (payload.period !== "monthly" && payload.period !== "yearly") return "Некорректный период";
  if (typeof payload.amount !== "number" || Number.isNaN(payload.amount) || payload.amount < 0) return "Некорректная сумма";
  if (payload.status !== "active" && payload.status !== "paused") return "Некорректный статус";
  if (typeof payload.chargeDay !== "number" || Number.isNaN(payload.chargeDay) || payload.chargeDay < 1 || payload.chargeDay > 31) return "Некорректный день списания";
  if (payload.period === "yearly" && (typeof payload.chargeMonth !== "number" || Number.isNaN(payload.chargeMonth) || payload.chargeMonth < 1 || payload.chargeMonth > 12)) return "Некорректный месяц списания";
  if (typeof payload.autoPay !== "boolean") return "Некорректное значение автоплатежа";
  return null;
}

function ensureSubscriptionCategory() {
  const existing = db.prepare("SELECT id FROM categories WHERE slug = 'podpiski' OR name = 'Подписки' LIMIT 1").get() as { id: string } | undefined;
  if (existing) return existing.id;

  const id = `cat_${randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO categories (id, name, slug, color, icon, is_active, created_at, updated_at)
    VALUES (?, 'Подписки', 'podpiski', NULL, NULL, 1, ?, ?)
  `).run(id, now, now);
  return id;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const normalizedPayload = { ...payload, autoPay: payload.autoPay ?? false } satisfies Payload;
  const error = validatePayload(normalizedPayload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

  const id = `sub_${randomUUID()}`;
  const now = new Date().toISOString();
  const categoryId = ensureSubscriptionCategory();

  db.prepare(`
    INSERT INTO subscriptions (id, name, period, amount, category_id, is_active, auto_pay, notes, charge_day, charge_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
  `).run(id, normalizedPayload.name!.trim(), normalizedPayload.period!, normalizedPayload.amount!, categoryId, normalizedPayload.status === "active" ? 1 : 0, normalizedPayload.autoPay ? 1 : 0, normalizedPayload.chargeDay!, normalizedPayload.period === "yearly" ? normalizedPayload.chargeMonth! : null, now, now);

  const subscription = getSubscriptions().find((item) => item.id === id);
  return NextResponse.json({ ok: true, subscription });
}
