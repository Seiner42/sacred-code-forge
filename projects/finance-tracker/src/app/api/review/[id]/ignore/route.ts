import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const item = db.prepare("SELECT id, import_id FROM import_review_items WHERE id = ? AND status = 'pending'").get(id) as { id: string; import_id: string } | undefined;
  if (!item) {
    return NextResponse.json({ ok: false, error: "Элемент разбора не найден" }, { status: 404 });
  }

  db.prepare("UPDATE import_review_items SET status = 'ignored', updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
  db.prepare(`
    UPDATE imports
    SET rows_needing_review = (
      SELECT COUNT(*) FROM import_review_items WHERE import_id = ? AND status = 'pending'
    )
    WHERE id = ?
  `).run(item.import_id, item.import_id);

  return NextResponse.json({ ok: true });
}
