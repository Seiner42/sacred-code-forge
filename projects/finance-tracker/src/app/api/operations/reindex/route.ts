import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_MERCHANT_RULES } from "@/lib/defaults";

type MatchType = "exact" | "contains";
type Direction = "expense" | "income";

type RuleRow = {
  id: string;
  match_type: MatchType;
  pattern: string;
  merchant_normalized: string;
  category_id: string | null;
  direction_override: Direction | null;
};

type TransactionRow = {
  id: string;
  raw_merchant: string;
  source_category: string | null;
  mcc: string | null;
  direction: Direction;
};

const SOURCE_CATEGORY_MAP: Record<string, string> = {
  "продукты": "products", "табак": "tobacco", "алкоголь": "alcohol", "фастфуд": "fastfood", "кафе и рестораны": "restaurants", "маркетплейсы": "marketplaces", "цифровые товары": "digital", "связь, интернет и тв": "telecom", "аптеки": "pharmacy", "такси": "taxi", "красота": "beauty", "животные": "pets", "одежда и обувь": "clothes", "пополнения": "cashback", "прочие расходы": "other",
};
const MCC_CATEGORY_MAP: Record<string, string> = { "5411": "products", "5331": "products", "5422": "products", "5993": "tobacco", "5921": "alcohol", "5814": "fastfood", "5812": "restaurants", "5912": "pharmacy", "4121": "taxi", "4900": "utilities", "7372": "subscriptions", "5815": "digital" };

function normalizeSpaces(value: string) { return value.replace(/\s+/g, " ").trim(); }
function normalizeCategoryKey(value: string | undefined) { return normalizeSpaces((value ?? "").toLowerCase().replace(/ё/g, "е")); }
function merchantKey(value: string) { return normalizeSpaces(value.replace(/\\/g, "/").replace(/"/g, "").toUpperCase()); }
function looksLikePerson(rawMerchant: string) { return /^[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё\.]+){0,2}$/.test(normalizeSpaces(rawMerchant)); }
function prettifyMerchant(value: string) { return normalizeSpaces(value.replace(/_/g, " ")).split(" ").map((part) => part ? part[0] + part.slice(1).toLowerCase() : part).join(" "); }
function inferMerchantBase(rawMerchant: string) { const normalized = normalizeSpaces(rawMerchant.replace(/\\/g, "/")); if (!normalized) return "Без названия"; if (looksLikePerson(normalized)) return normalized; const tail = normalized.split("/").map((part) => normalizeSpaces(part)).filter(Boolean).at(-1) ?? normalized; return prettifyMerchant(tail); }
function inferCategorySlug(sourceCategory: string | null, mcc: string | null, rawMerchant: string) {
  const key = merchantKey(rawMerchant);
  if (key.includes("CASHBACK")) return "cashback";
  if (key.includes("КОМИССИЯ ЗА АЛЬФА-СМАРТ")) return "bank_fees";
  if (looksLikePerson(rawMerchant)) return "person_transfers";
  if (mcc && MCC_CATEGORY_MAP[mcc]) return MCC_CATEGORY_MAP[mcc];
  const sourceKey = normalizeCategoryKey(sourceCategory ?? "");
  if (SOURCE_CATEGORY_MAP[sourceKey]) return SOURCE_CATEGORY_MAP[sourceKey];
  return "other";
}
function applyRule(matchType: MatchType, pattern: string, key: string) { return matchType === "exact" ? key === pattern.toUpperCase() : key.includes(pattern.toUpperCase()); }

export async function POST() {
  const categoryBySlug = new Map((db.prepare("SELECT id, slug FROM categories").all() as { id: string; slug: string }[]).map((row) => [row.slug, row.id]));
  const rules = db.prepare(`SELECT id, match_type, pattern, merchant_normalized, category_id, direction_override FROM merchant_rules ORDER BY priority DESC, created_at ASC`).all() as RuleRow[];
  const builtInRules = DEFAULT_MERCHANT_RULES.map((rule) => ({
    matchType: rule.matchType,
    pattern: rule.pattern,
    merchantNormalized: rule.merchantNormalized,
    categoryId: rule.categorySlug ? categoryBySlug.get(rule.categorySlug) ?? null : null,
    directionOverride: rule.directionOverride ?? null,
  }));
  const transactions = db.prepare(`SELECT id, raw_merchant, source_category, mcc, direction FROM transactions`).all() as TransactionRow[];
  const now = new Date().toISOString();
  let updatedCount = 0;

  const update = db.prepare(`UPDATE transactions SET merchant_normalized = ?, category_id = ?, direction = ?, updated_at = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    for (const item of transactions) {
      const key = merchantKey(item.raw_merchant);
      let merchantNormalized = inferMerchantBase(item.raw_merchant);
      let categoryId = categoryBySlug.get(inferCategorySlug(item.source_category, item.mcc, item.raw_merchant)) ?? categoryBySlug.get("other") ?? null;
      let direction: Direction = item.direction;

      const matchedRule = rules.find((rule) => applyRule(rule.match_type, rule.pattern, key));
      if (matchedRule) {
        merchantNormalized = matchedRule.merchant_normalized;
        categoryId = matchedRule.category_id ?? categoryId;
        direction = matchedRule.direction_override ?? direction;
      } else {
        const builtInRule = builtInRules.find((rule) => applyRule(rule.matchType, rule.pattern, key));
        if (builtInRule) {
          merchantNormalized = builtInRule.merchantNormalized;
          categoryId = builtInRule.categoryId ?? categoryId;
          direction = builtInRule.directionOverride ?? direction;
        }
      }

      const result = update.run(merchantNormalized, categoryId, direction, now, item.id);
      updatedCount += result.changes;
    }
  });

  tx();

  return NextResponse.json({ ok: true, updatedCount });
}
