import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Payload = {
  merchantNormalized?: string;
  categoryId?: string | null;
  matchType?: "exact" | "contains";
  includeInReports?: boolean | null;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Payload;

  if (!payload.merchantNormalized?.trim()) {
    return NextResponse.json({ ok: false, error: "Укажи нормализованное название" }, { status: 400 });
  }

  if (payload.matchType !== "exact" && payload.matchType !== "contains") {
    return NextResponse.json({ ok: false, error: "Некорректный тип правила" }, { status: 400 });
  }

  const item = db.prepare(`
    SELECT id, import_id, raw_merchant, suggested_category_id
    FROM import_review_items
    WHERE id = ? AND status = 'pending'
  `).get(id) as { id: string; import_id: string; raw_merchant: string; suggested_category_id: string | null } | undefined;

  if (!item) {
    return NextResponse.json({ ok: false, error: "Элемент разбора не найден" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const ruleId = `rule_${randomUUID()}`;
  const normalizedName = payload.merchantNormalized.trim();
  const pattern = payload.matchType === "exact" ? item.raw_merchant : item.raw_merchant.replace(/\\/g, "/");
  const categoryId = payload.categoryId ?? item.suggested_category_id ?? null;
  const includeValue = typeof payload.includeInReports === "boolean" ? (payload.includeInReports ? 1 : 0) : null;

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO merchant_rules (
        id, match_type, pattern, merchant_normalized, category_id, direction_override, include_in_reports_override, priority, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NULL, ?, 500, 'Подтверждено в ручном разборе', ?, ?)
    `).run(ruleId, payload.matchType, pattern, normalizedName, categoryId, includeValue, now, now);

    db.prepare(`
      UPDATE transactions
      SET merchant_normalized = ?, category_id = COALESCE(?, category_id), include_in_reports = COALESCE(?, include_in_reports), updated_at = ?
      WHERE import_id = ? AND raw_merchant = ?
    `).run(normalizedName, categoryId, includeValue, now, item.import_id, item.raw_merchant);

    db.prepare(`
      UPDATE import_review_items
      SET status = 'resolved', resolved_rule_id = ?, updated_at = ?
      WHERE raw_merchant = ? AND status = 'pending'
    `).run(ruleId, now, item.raw_merchant);

    db.prepare(`
      UPDATE imports
      SET rows_needing_review = (
        SELECT COUNT(*) FROM import_review_items WHERE import_id = ? AND status = 'pending'
      )
      WHERE id = ?
    `).run(item.import_id, item.import_id);
  });

  transaction();

  return NextResponse.json({ ok: true });
}
