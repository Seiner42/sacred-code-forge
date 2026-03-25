import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeQuery(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

type SuggestionRow = { merchant: string; usage_count: number };
type SuggestionItem = { merchant: string; categoryId: string | null; categoryName: string | null };

function getSuggestionPool() {
  return db.prepare(`
    SELECT merchant, SUM(usage_count) AS usage_count
    FROM (
      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM transactions
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
      GROUP BY merchant_normalized

      UNION ALL

      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM merchant_rules
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
      GROUP BY merchant_normalized
    )
    GROUP BY merchant
    ORDER BY usage_count DESC, length(merchant) ASC, merchant ASC
  `).all() as SuggestionRow[];
}

function getPreferredCategory(merchant: string) {
  const fromTransactions = db.prepare(`
    SELECT category_id AS categoryId, categories.name AS categoryName, COUNT(*) AS usage_count
    FROM transactions
    LEFT JOIN categories ON categories.id = transactions.category_id
    WHERE merchant_normalized = ?
      AND category_id IS NOT NULL
    GROUP BY category_id, categories.name
    ORDER BY usage_count DESC, categories.name ASC
    LIMIT 2
  `).all(merchant) as { categoryId: string; categoryName: string | null; usage_count: number }[];

  if (fromTransactions.length > 0) {
    if (fromTransactions.length === 1 || fromTransactions[0]!.usage_count > fromTransactions[1]!.usage_count) {
      return { categoryId: fromTransactions[0]!.categoryId, categoryName: fromTransactions[0]!.categoryName ?? null };
    }
  }

  const fromRules = db.prepare(`
    SELECT merchant_rules.category_id AS categoryId, categories.name AS categoryName, COUNT(*) AS usage_count
    FROM merchant_rules
    LEFT JOIN categories ON categories.id = merchant_rules.category_id
    WHERE merchant_rules.merchant_normalized = ?
      AND merchant_rules.category_id IS NOT NULL
    GROUP BY merchant_rules.category_id, categories.name
    ORDER BY usage_count DESC, categories.name ASC
    LIMIT 1
  `).get(merchant) as { categoryId: string; categoryName: string | null; usage_count: number } | undefined;

  if (fromRules?.categoryId) {
    return { categoryId: fromRules.categoryId, categoryName: fromRules.categoryName ?? null };
  }

  return { categoryId: null, categoryName: null };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q") ?? "");

  if (query.length < 1) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }

  const pool = getSuggestionPool().map((item) => ({
    ...item,
    normalizedMerchant: item.merchant.toLocaleLowerCase("ru-RU"),
  }));

  const prefixMatches = pool.filter((item) => item.normalizedMerchant.startsWith(query));
  const containsMatches = pool.filter((item) => !item.normalizedMerchant.startsWith(query) && item.normalizedMerchant.includes(query));

  const suggestions = [...prefixMatches, ...containsMatches]
    .slice(0, 8)
    .map((item) => {
      const preferredCategory = getPreferredCategory(item.merchant);
      return {
        merchant: item.merchant,
        categoryId: preferredCategory.categoryId,
        categoryName: preferredCategory.categoryName,
      } satisfies SuggestionItem;
    });

  return NextResponse.json({ ok: true, suggestions });
}
