import { createHash, randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db";

type Direction = "expense" | "income" | "transfer";
type MatchType = "exact" | "contains";

type AlfaCsvRow = {
  operationDate?: string;
  merchant?: string;
  amount?: string;
  currency?: string;
  category?: string;
  mcc?: string;
  type?: string;
  comment?: string;
};

type MerchantRuleRow = {
  id: string;
  match_type: MatchType;
  pattern: string;
  merchant_normalized: string;
  category_id: string | null;
  direction_override: Direction | null;
  include_in_reports_override: number | null;
  priority: number;
};

type CategoryRow = { id: string; slug: string };

type ReviewCandidate = {
  rawMerchant: string;
  sourceCategory: string | null;
  mcc: string | null;
  suggestedMerchantNormalized: string;
  suggestedCategoryId: string | null;
  sampleCount: number;
};

type NormalizedOperation = {
  operationDate: string;
  rawMerchant: string;
  merchantNormalized: string;
  amount: number;
  currency: string;
  direction: Direction;
  sourceCategory: string | null;
  categoryId: string | null;
  mcc: string | null;
  description: string | null;
  includeInReports: boolean;
  sourceRowHash: string;
  sourceOrder: number;
  needsReview: boolean;
};

const BASE_CATEGORIES = [
  ["products", "Продукты"], ["tobacco", "Табак"], ["alcohol", "Алкоголь"], ["fastfood", "Фастфуд"], ["restaurants", "Кафе и рестораны"],
  ["marketplaces", "Маркетплейсы"], ["digital", "Цифровые товары"], ["subscriptions", "Подписки"], ["telecom", "Связь"], ["pharmacy", "Аптеки"],
  ["taxi", "Такси"], ["beauty", "Красота"], ["pets", "Животные"], ["clothes", "Одежда и обувь"], ["utilities", "ЖКХ"],
  ["person_transfers", "Переводы людям"], ["transfers_internal", "Между своими счетами"], ["cashback", "Кэшбэк"], ["bank_fees", "Банковские комиссии"], ["other", "Прочее"],
] as const;

const BUILTIN_RULES: Array<{ matchType: MatchType; pattern: string; merchantNormalized: string; categorySlug?: string; directionOverride?: Direction; includeInReportsOverride?: boolean; priority: number; }> = [
  { matchType: "exact", pattern: "МЕЖДУ СВОИМИ СЧЕТАМИ", merchantNormalized: "Между своими счетами", categorySlug: "transfers_internal", includeInReportsOverride: false, priority: 1000 },
  { matchType: "contains", pattern: "CASHBACK", merchantNormalized: "CashBack", categorySlug: "cashback", directionOverride: "income", includeInReportsOverride: true, priority: 950 },
  { matchType: "contains", pattern: "КОМИССИЯ ЗА АЛЬФА-СМАРТ", merchantNormalized: "Комиссия за Альфа-Смарт", categorySlug: "bank_fees", priority: 940 },
  { matchType: "contains", pattern: "YANDEX PLUS", merchantNormalized: "Yandex Plus", categorySlug: "subscriptions", priority: 930 },
  { matchType: "contains", pattern: "YANDEX 360", merchantNormalized: "Yandex 360", categorySlug: "subscriptions", priority: 930 },
  { matchType: "contains", pattern: "YANDEX LAVKA", merchantNormalized: "Yandex Lavka", categorySlug: "products", priority: 920 },
  { matchType: "contains", pattern: "YANDEX EDA", merchantNormalized: "Yandex Eda", categorySlug: "fastfood", priority: 920 },
  { matchType: "contains", pattern: "YANDEX GO", merchantNormalized: "Yandex Go", categorySlug: "taxi", priority: 920 },
  { matchType: "contains", pattern: "Y M MARKET YANDEX", merchantNormalized: "Yandex Market", categorySlug: "marketplaces", priority: 920 },
  { matchType: "contains", pattern: "OZON", merchantNormalized: "Ozon", categorySlug: "marketplaces", priority: 920 },
  { matchType: "contains", pattern: "SAMOKAT", merchantNormalized: "Samokat", categorySlug: "products", priority: 920 },
  { matchType: "contains", pattern: "PYATEROCHKA", merchantNormalized: "Пятёрочка", categorySlug: "products", priority: 910 },
  { matchType: "contains", pattern: "LENTA", merchantNormalized: "Лента", categorySlug: "products", priority: 910 },
  { matchType: "contains", pattern: "MAGNIT", merchantNormalized: "Магнит", categorySlug: "products", priority: 910 },
  { matchType: "contains", pattern: "WINELAB", merchantNormalized: "WineLab", categorySlug: "alcohol", priority: 910 },
  { matchType: "contains", pattern: "ВЫМПЕЛКОМ", merchantNormalized: "Билайн", categorySlug: "telecom", priority: 905 },
  { matchType: "contains", pattern: "БИЛАЙН", merchantNormalized: "Билайн", categorySlug: "telecom", priority: 905 },
  { matchType: "exact", pattern: "T2", merchantNormalized: "T2", categorySlug: "telecom", priority: 905 },
  { matchType: "contains", pattern: "МОСЭНЕРГОСБЫТ", merchantNormalized: "Мосэнергосбыт", categorySlug: "utilities", priority: 905 },
  { matchType: "contains", pattern: "МОСОБЛГАЗ", merchantNormalized: "Мособлгаз", categorySlug: "utilities", priority: 905 },
  { matchType: "contains", pattern: "МОСОБЛЕИРЦ", merchantNormalized: "Мособлеирц", categorySlug: "utilities", priority: 905 },
];

const SOURCE_CATEGORY_MAP: Record<string, string> = {
  "продукты": "products", "табак": "tobacco", "алкоголь": "alcohol", "фастфуд": "fastfood", "кафе и рестораны": "restaurants", "маркетплейсы": "marketplaces", "цифровые товары": "digital", "связь, интернет и тв": "telecom", "аптеки": "pharmacy", "такси": "taxi", "красота": "beauty", "животные": "pets", "одежда и обувь": "clothes", "пополнения": "cashback", "прочие расходы": "other",
};
const MCC_CATEGORY_MAP: Record<string, string> = { "5411": "products", "5331": "products", "5422": "products", "5993": "tobacco", "5921": "alcohol", "5814": "fastfood", "5812": "restaurants", "5912": "pharmacy", "4121": "taxi", "4900": "utilities", "7372": "subscriptions", "5815": "digital" };

function normalizeSpaces(value: string) { return value.replace(/\s+/g, " ").trim(); }
function normalizeCurrency(value: string | undefined) { const upper = value?.trim().toUpperCase() || "RUB"; return upper === "RUR" ? "RUB" : upper; }
function parseRuDate(value: string | undefined) { if (!value?.trim()) throw new Error("operationDate is required"); const [day, month, year] = value.trim().split("."); return `${year}-${month}-${day}`; }
function amountToNumber(value: string | undefined) { const parsed = Number((value?.trim().replace(",", ".") ?? "0")); if (!Number.isFinite(parsed)) throw new Error(`Invalid amount: ${value}`); return parsed; }
function normalizeCategoryKey(value: string | undefined) { return normalizeSpaces((value ?? "").toLowerCase().replace(/ё/g, "е")); }
function merchantKey(value: string) { return normalizeSpaces(value.replace(/\\/g, "/").replace(/"/g, "").toUpperCase()); }
function looksLikePerson(rawMerchant: string) { return /^[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё\.]+){0,2}$/.test(normalizeSpaces(rawMerchant)); }
function prettifyMerchant(value: string) { return normalizeSpaces(value.replace(/_/g, " ")).split(" ").map((part) => part ? part[0] + part.slice(1).toLowerCase() : part).join(" "); }
function inferMerchantBase(rawMerchant: string) { const normalized = normalizeSpaces(rawMerchant.replace(/\\/g, "/")); if (!normalized) return "Без названия"; if (looksLikePerson(normalized)) return normalized; const tail = normalized.split("/").map((part) => normalizeSpaces(part)).filter(Boolean).at(-1) ?? normalized; return prettifyMerchant(tail); }
function inferDirection(typeValue: string | undefined): Direction { return normalizeSpaces(typeValue ?? "").toLowerCase() === "пополнение" ? "income" : "expense"; }
function defaultIncludeInReports(categorySlug: string | null) { return categorySlug !== "transfers_internal"; }
function buildSourceRowHash(row: AlfaCsvRow) { return createHash("sha256").update([row.operationDate ?? "", row.merchant ?? "", row.amount ?? "", row.currency ?? "", row.category ?? "", row.mcc ?? "", row.type ?? "", row.comment ?? ""].join("|")).digest("hex"); }
function ensureBaseCategories() { const now = new Date().toISOString(); const insert = db.prepare(`INSERT OR IGNORE INTO categories (id, name, slug, color, icon, is_active, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, 1, ?, ?)`); for (const [slug, name] of BASE_CATEGORIES) insert.run(`cat_${slug}`, name, slug, now, now); }
function getCategoryMap() { ensureBaseCategories(); return new Map((db.prepare("SELECT id, slug FROM categories").all() as CategoryRow[]).map((row) => [row.slug, row.id])); }
function getMerchantRules() { return db.prepare(`SELECT id, match_type, pattern, merchant_normalized, category_id, direction_override, include_in_reports_override, priority FROM merchant_rules ORDER BY priority DESC, created_at ASC`).all() as MerchantRuleRow[]; }
function applyRule(rule: MerchantRuleRow, key: string) { return rule.match_type === "exact" ? key === rule.pattern.toUpperCase() : key.includes(rule.pattern.toUpperCase()); }
function selectBuiltInRule(key: string) { return BUILTIN_RULES.find((rule) => rule.matchType === "exact" ? key === rule.pattern : key.includes(rule.pattern)) ?? null; }
function inferCategorySlug(sourceCategory: string | null, mcc: string | null, rawMerchant: string) {
  const key = merchantKey(rawMerchant);
  if (key === "МЕЖДУ СВОИМИ СЧЕТАМИ") return "transfers_internal";
  if (key.includes("CASHBACK")) return "cashback";
  if (key.includes("КОМИССИЯ ЗА АЛЬФА-СМАРТ")) return "bank_fees";
  if (looksLikePerson(rawMerchant)) return "person_transfers";
  if (mcc && MCC_CATEGORY_MAP[mcc]) return MCC_CATEGORY_MAP[mcc];
  const sourceKey = normalizeCategoryKey(sourceCategory ?? "");
  if (SOURCE_CATEGORY_MAP[sourceKey]) return SOURCE_CATEGORY_MAP[sourceKey];
  return "other";
}
function isReviewNeeded(rawMerchant: string, sourceCategory: string | null, explicitRuleMatched: boolean, builtInRuleMatched: boolean) {
  if (explicitRuleMatched || builtInRuleMatched) return false;
  if (merchantKey(rawMerchant) === "МЕЖДУ СВОИМИ СЧЕТАМИ") return false;
  if (looksLikePerson(rawMerchant)) return false;
  const sourceKey = normalizeCategoryKey(sourceCategory ?? "");
  if (["финансовые операции", "прочие расходы", ""].includes(sourceKey)) return true;
  return /^(Magazin|Am)$/i.test(inferMerchantBase(rawMerchant));
}
function normalizeOperation(row: AlfaCsvRow, categoryMap: Map<string, string>, rules: MerchantRuleRow[], sourceOrder: number): NormalizedOperation {
  const operationDate = parseRuDate(row.operationDate);
  const rawMerchant = normalizeSpaces(row.merchant ?? "");
  const amount = amountToNumber(row.amount);
  const currency = normalizeCurrency(row.currency);
  const sourceCategory = normalizeSpaces(row.category ?? "") || null;
  const mcc = normalizeSpaces(row.mcc ?? "") || null;
  const description = normalizeSpaces(row.comment ?? "") || null;
  const rowHash = buildSourceRowHash(row);
  const key = merchantKey(rawMerchant);
  let direction: Direction = inferDirection(row.type);
  let merchantNormalized = inferMerchantBase(rawMerchant);
  let categorySlug = inferCategorySlug(sourceCategory, mcc, rawMerchant);
  let includeInReports = defaultIncludeInReports(categorySlug);
  let explicitRuleMatched = false;
  for (const rule of rules) {
    if (!applyRule(rule, key)) continue;
    explicitRuleMatched = true;
    merchantNormalized = rule.merchant_normalized;
    if (rule.category_id) {
      const categoryRow = db.prepare("SELECT slug FROM categories WHERE id = ?").get(rule.category_id) as { slug: string } | undefined;
      if (categoryRow?.slug) categorySlug = categoryRow.slug;
    }
    if (rule.direction_override) direction = rule.direction_override === "transfer" ? direction : rule.direction_override;
    if (typeof rule.include_in_reports_override === "number") includeInReports = Boolean(rule.include_in_reports_override);
    break;
  }
  const builtInRule = explicitRuleMatched ? null : selectBuiltInRule(key);
  if (builtInRule) {
    merchantNormalized = builtInRule.merchantNormalized;
    if (builtInRule.categorySlug) categorySlug = builtInRule.categorySlug;
    if (builtInRule.directionOverride && builtInRule.directionOverride !== "transfer") direction = builtInRule.directionOverride;
    if (typeof builtInRule.includeInReportsOverride === "boolean") includeInReports = builtInRule.includeInReportsOverride;
  }
  return { operationDate, rawMerchant, merchantNormalized, amount, currency, direction, sourceCategory, categoryId: categoryMap.get(categorySlug) ?? categoryMap.get("other") ?? null, mcc, description, includeInReports, sourceRowHash: rowHash, sourceOrder, needsReview: isReviewNeeded(rawMerchant, sourceCategory, explicitRuleMatched, Boolean(builtInRule)) };
}

export type AlfaImportResult = { importId: string; rowsCount: number; rowsImported: number; rowsSkipped: number; rowsFailed: number; rowsNeedingReview: number };

export function importAlfaCsv(fileName: string, csvText: string): AlfaImportResult {
  ensureBaseCategories();
  const categoryMap = getCategoryMap();
  const rules = getMerchantRules();
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as AlfaCsvRow[];
  const now = new Date().toISOString();
  const importId = `imp_${randomUUID()}`;
  db.prepare(`INSERT INTO imports (id, source, file_name, imported_at, rows_count, rows_imported, rows_skipped, rows_needing_review, rows_failed, status, error_message, created_at) VALUES (?, 'alfa', ?, ?, ?, 0, 0, 0, 0, 'processing', NULL, ?)`).run(importId, fileName, now, rows.length, now);
  const insertTransaction = db.prepare(`INSERT INTO transactions (id, import_id, operation_date, raw_merchant, merchant_normalized, amount, currency, direction, category_id, source_category, mcc, description, include_in_reports, source_row_hash, source_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertReview = db.prepare(`INSERT INTO import_review_items (id, import_id, raw_merchant, source_category, mcc, sample_count, suggested_merchant_normalized, suggested_category_id, status, resolved_rule_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`);
  let rowsImported = 0; let rowsSkipped = 0; let rowsFailed = 0; const reviewMap = new Map<string, ReviewCandidate>();
  const transaction = db.transaction(() => {
    for (const [index, row] of rows.entries()) {
      try {
        const normalized = normalizeOperation(row, categoryMap, rules, index);
        if (db.prepare("SELECT id FROM transactions WHERE source_row_hash = ?").get(normalized.sourceRowHash)) { rowsSkipped += 1; continue; }
        insertTransaction.run(`tx_${randomUUID()}`, importId, normalized.operationDate, normalized.rawMerchant, normalized.merchantNormalized, normalized.amount, normalized.currency, normalized.direction, normalized.categoryId, normalized.sourceCategory, normalized.mcc, normalized.description, normalized.includeInReports ? 1 : 0, normalized.sourceRowHash, normalized.sourceOrder, now, now);
        rowsImported += 1;
        if (normalized.needsReview) {
          const key = `${normalized.rawMerchant}|${normalized.sourceCategory ?? ""}|${normalized.mcc ?? ""}`;
          const existingReview = reviewMap.get(key);
          if (existingReview) existingReview.sampleCount += 1;
          else reviewMap.set(key, { rawMerchant: normalized.rawMerchant, sourceCategory: normalized.sourceCategory, mcc: normalized.mcc, suggestedMerchantNormalized: normalized.merchantNormalized, suggestedCategoryId: normalized.categoryId, sampleCount: 1 });
        }
      } catch { rowsFailed += 1; }
    }
    for (const item of reviewMap.values()) insertReview.run(`rev_${randomUUID()}`, importId, item.rawMerchant, item.sourceCategory, item.mcc, item.sampleCount, item.suggestedMerchantNormalized, item.suggestedCategoryId, now, now);
    db.prepare(`UPDATE imports SET rows_imported = ?, rows_skipped = ?, rows_needing_review = ?, rows_failed = ?, status = 'ready', error_message = NULL WHERE id = ?`).run(rowsImported, rowsSkipped, reviewMap.size, rowsFailed, importId);
  });
  try { transaction(); } catch (error) { db.prepare(`UPDATE imports SET status = 'failed', error_message = ? WHERE id = ?`).run(error instanceof Error ? error.message : "Импорт не выполнен", importId); throw error; }
  return { importId, rowsCount: rows.length, rowsImported, rowsSkipped, rowsFailed, rowsNeedingReview: reviewMap.size };
}
