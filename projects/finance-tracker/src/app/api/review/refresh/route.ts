import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_MERCHANT_RULES } from "@/lib/defaults";
import { getPendingReviewItems } from "@/lib/finance-data";

type MatchType = "exact" | "contains";

type RuleRow = {
  id: string;
  match_type: MatchType;
  pattern: string;
  merchant_normalized: string;
  category_id: string | null;
  direction_override: "expense" | "income" | null;
};

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function merchantKey(value: string) {
  return normalizeSpaces(value.replace(/\\/g, "/").replace(/"/g, "").toUpperCase());
}

function applyRule(matchType: MatchType, pattern: string, key: string) {
  return matchType === "exact" ? key === pattern.toUpperCase() : key.includes(pattern.toUpperCase());
}

export async function POST() {
  const rules = db.prepare(`SELECT id, match_type, pattern, merchant_normalized, category_id, direction_override FROM merchant_rules ORDER BY priority DESC, created_at ASC`).all() as RuleRow[];
  const pendingItems = db.prepare(`SELECT id, import_id, raw_merchant FROM import_review_items WHERE status = 'pending' ORDER BY created_at ASC`).all() as { id: string; import_id: string; raw_merchant: string }[];
  const categoryBySlug = new Map((db.prepare("SELECT id, slug FROM categories").all() as { id: string; slug: string }[]).map((row) => [row.slug, row.id]));
  const builtInRules = DEFAULT_MERCHANT_RULES.map((rule) => ({
    matchType: rule.matchType,
    pattern: rule.pattern,
    merchantNormalized: rule.merchantNormalized,
    categoryId: rule.categorySlug ? categoryBySlug.get(rule.categorySlug) ?? null : null,
  }));

  let resolvedCount = 0;
  const affectedImports = new Set<string>();
  const now = new Date().toISOString();

  const transaction = db.transaction(() => {
    for (const item of pendingItems) {
      const key = merchantKey(item.raw_merchant);
      const matchedRule = rules.find((rule) => applyRule(rule.match_type, rule.pattern, key));
      const matchedBuiltIn = matchedRule ? null : builtInRules.find((rule) => applyRule(rule.matchType, rule.pattern, key));
      if (!matchedRule && !matchedBuiltIn) continue;

      const merchantNormalized = matchedRule?.merchant_normalized ?? matchedBuiltIn?.merchantNormalized ?? item.raw_merchant;
      const categoryId = matchedRule?.category_id ?? matchedBuiltIn?.categoryId ?? null;

      db.prepare(`
        UPDATE transactions
        SET merchant_normalized = ?, category_id = COALESCE(?, category_id), updated_at = ?
        WHERE raw_merchant = ?
      `).run(merchantNormalized, categoryId, now, item.raw_merchant);

      const result = db.prepare(`
        UPDATE import_review_items
        SET status = 'resolved', resolved_rule_id = ?, updated_at = ?
        WHERE raw_merchant = ? AND status = 'pending'
      `).run(matchedRule?.id ?? null, now, item.raw_merchant);

      if (result.changes > 0) {
        resolvedCount += result.changes;
      }
      affectedImports.add(item.import_id);
    }

    for (const importId of affectedImports) {
      db.prepare(`
        UPDATE imports
        SET rows_needing_review = (
          SELECT COUNT(*) FROM import_review_items WHERE import_id = ? AND status = 'pending'
        )
        WHERE id = ?
      `).run(importId, importId);
    }
  });

  transaction();

  return NextResponse.json({ ok: true, resolvedCount, items: getPendingReviewItems() });
}
