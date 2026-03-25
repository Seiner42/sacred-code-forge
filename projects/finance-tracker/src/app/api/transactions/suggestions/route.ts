import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q") ?? "");

  if (query.length < 1) {
    return NextResponse.json({ ok: true, suggestions: [] });
  }

  const prefixMatches = db.prepare(`
    SELECT merchant, usage_count
    FROM (
      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM transactions
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
        AND lower(merchant_normalized) LIKE ?
      GROUP BY merchant_normalized

      UNION ALL

      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM merchant_rules
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
        AND lower(merchant_normalized) LIKE ?
      GROUP BY merchant_normalized
    )
    GROUP BY merchant
    ORDER BY usage_count DESC, length(merchant) ASC, merchant ASC
    LIMIT 8
  `).all(`${query}%`, `${query}%`) as { merchant: string; usage_count: number }[];

  const containsMatches = prefixMatches.length >= 8 ? [] : db.prepare(`
    SELECT merchant, usage_count
    FROM (
      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM transactions
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
        AND lower(merchant_normalized) LIKE ?
      GROUP BY merchant_normalized

      UNION ALL

      SELECT merchant_normalized AS merchant, COUNT(*) AS usage_count
      FROM merchant_rules
      WHERE merchant_normalized IS NOT NULL
        AND trim(merchant_normalized) <> ''
        AND lower(merchant_normalized) LIKE ?
      GROUP BY merchant_normalized
    )
    GROUP BY merchant
    ORDER BY usage_count DESC, length(merchant) ASC, merchant ASC
    LIMIT 8
  `).all(`%${query}%`, `%${query}%`) as { merchant: string; usage_count: number }[];

  const seen = new Set<string>();
  const suggestions = [...prefixMatches, ...containsMatches]
    .filter((item) => {
      if (seen.has(item.merchant)) return false;
      seen.add(item.merchant);
      return true;
    })
    .slice(0, 8)
    .map((item) => item.merchant);

  return NextResponse.json({ ok: true, suggestions });
}
