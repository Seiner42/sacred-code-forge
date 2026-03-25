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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Payload;
  const normalizedPayload = { ...payload, autoPay: payload.autoPay ?? false } satisfies Payload;
  const error = validatePayload(normalizedPayload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

  const existing = db.prepare("SELECT id FROM subscriptions WHERE id = ?").get(id) as { id: string } | undefined;
  if (!existing) return NextResponse.json({ ok: false, error: "Подписка не найдена" }, { status: 404 });

  db.prepare(`
    UPDATE subscriptions
    SET name = ?, period = ?, amount = ?, is_active = ?, auto_pay = ?, charge_day = ?, charge_month = ?, updated_at = ?
    WHERE id = ?
  `).run(normalizedPayload.name!.trim(), normalizedPayload.period!, normalizedPayload.amount!, normalizedPayload.status === "active" ? 1 : 0, normalizedPayload.autoPay ? 1 : 0, normalizedPayload.chargeDay!, normalizedPayload.period === "yearly" ? normalizedPayload.chargeMonth! : null, new Date().toISOString(), id);

  const subscription = getSubscriptions().find((item) => item.id === id);
  return NextResponse.json({ ok: true, subscription });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = db.prepare("DELETE FROM subscriptions WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ ok: false, error: "Подписка не найдена" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
