import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOperations } from "@/lib/finance-data";

type Payload = {
  operationDate?: string;
  merchant?: string;
  amount?: number;
  type?: "expense" | "income" | "transfer";
  categoryId?: string | null;
  description?: string | null;
  includeInReports?: boolean;
};

function validate(payload: Payload) {
  if (!payload.operationDate) return "Укажи дату операции";
  if (!payload.merchant?.trim()) return "Укажи название операции";
  if (typeof payload.amount !== "number" || Number.isNaN(payload.amount) || payload.amount < 0) return "Некорректная сумма";
  if (payload.type !== "expense" && payload.type !== "income" && payload.type !== "transfer") return "Некорректный тип операции";
  return null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Payload;
  const error = validate(payload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  const now = new Date().toISOString();
  const id = `tx_${randomUUID()}`;
  db.prepare(`
    INSERT INTO transactions (id, import_id, operation_date, raw_merchant, merchant_normalized, amount, currency, direction, category_id, source_category, mcc, description, include_in_reports, source_row_hash, created_at, updated_at)
    VALUES (?, NULL, ?, ?, ?, ?, 'RUB', ?, ?, NULL, NULL, ?, ?, NULL, ?, ?)
  `).run(id, payload.operationDate, payload.merchant!.trim(), payload.merchant!.trim(), payload.amount, payload.type, payload.categoryId ?? null, payload.description?.trim() || null, payload.includeInReports ? 1 : 0, now, now);
  const transaction = getOperations().find((item) => item.id === id);
  return NextResponse.json({ ok: true, transaction });
}
