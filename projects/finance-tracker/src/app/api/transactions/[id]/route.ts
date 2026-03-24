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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Payload;
  const error = validate(payload);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  const result = db.prepare(`
    UPDATE transactions
    SET operation_date = ?, raw_merchant = ?, merchant_normalized = ?, amount = ?, direction = ?, category_id = ?, description = ?, include_in_reports = ?, updated_at = ?
    WHERE id = ?
  `).run(payload.operationDate, payload.merchant!.trim(), payload.merchant!.trim(), payload.amount, payload.type, payload.categoryId ?? null, payload.description?.trim() || null, payload.includeInReports ? 1 : 0, new Date().toISOString(), id);
  if (result.changes === 0) return NextResponse.json({ ok: false, error: "Операция не найдена" }, { status: 404 });
  const transaction = getOperations().find((item) => item.id === id);
  return NextResponse.json({ ok: true, transaction });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ ok: false, error: "Операция не найдена" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
