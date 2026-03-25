import { db } from "@/lib/db";

export type OperationItem = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  categoryId: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  amount: string;
  amountValue: number;
  type: "expense" | "income";
  description: string | null;
  status: "done" | "pending";
};

export type SubscriptionItem = {
  id: string;
  name: string;
  period: "monthly" | "yearly";
  amount: string;
  amountValue: number;
  nextCharge: string;
  chargeDay: number;
  chargeMonth: number | null;
  status: "active" | "paused";
  autoPay: boolean;
};

export type SummaryCard = { title: string; value: string; hint: string };
export type ImportHistoryItem = { id: string; fileName: string; bank: "Альфа" | "Тинькофф"; importedAt: string; rows: number; imported: number; skipped: number; failed: number; needsReview: number; status: "ready" | "processing" | "failed"; };
export type TopCategoryItem = { name: string; amount: string; icon: string | null };
export type DashboardData = {
  monthLabel: string;
  summaryCards: SummaryCard[];
  recentTransactions: OperationItem[];
  topCategories: TopCategoryItem[];
  subscriptions: SubscriptionItem[];
  manualSubscriptions: SubscriptionItem[];
};
export type ReviewItem = { id: string; importId: string; rawMerchant: string; sourceCategory: string | null; mcc: string | null; sampleCount: number; suggestedMerchantNormalized: string; suggestedCategoryId: string | null; };
export type CategoryOption = { id: string; name: string; slug: string };
export type CategoryAdminItem = { id: string; name: string; slug: string; color: string | null; icon: string | null; isActive: boolean };
export type MerchantRuleAdminItem = { id: string; matchType: "exact" | "contains"; pattern: string; merchantNormalized: string; categoryId: string | null; categoryName: string | null; directionOverride: "expense" | "income" | null; priority: number; notes: string | null };

type TransactionRow = { id: string; operation_date: string; merchant_normalized: string; amount: number; direction: "expense" | "income"; description: string | null; category_id: string | null; category_name: string | null; category_color: string | null; category_icon: string | null; source_order: number | null; created_at: string; };
type SubscriptionRow = { id: string; name: string; period: "monthly" | "yearly"; amount: number; is_active: number; auto_pay: number | null; created_at: string; charge_day: number | null; charge_month: number | null; };
type ImportRow = { id: string; source: "alfa" | "tinkoff"; file_name: string; imported_at: string; rows_count: number; rows_imported: number; rows_skipped: number; rows_needing_review: number; rows_failed: number; status: "ready" | "processing" | "failed"; };
type ReviewRow = { id: string; import_id: string; raw_merchant: string; source_category: string | null; mcc: string | null; sample_count: number; suggested_merchant_normalized: string | null; suggested_category_id: string | null; };
type CategoryRow = { id: string; name: string; slug: string; color?: string | null; icon?: string | null; is_active?: number; };
type MerchantRuleRow = { id: string; match_type: "exact" | "contains"; pattern: string; merchant_normalized: string; category_id: string | null; category_name: string | null; direction_override: "expense" | "income" | null; priority: number; notes: string | null; };

const monthNames = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
function formatCurrency(value: number, { sign = false }: { sign?: boolean } = {}) { const formatted = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Math.abs(value)); if (sign && value > 0) return `+${formatted} ₽`; if (sign && value < 0) return `-${formatted} ₽`; return `${formatted} ₽`; }
function formatDate(date: string) { const [year, month, day] = date.split("-"); return `${day}.${month}.${year}`; }
function monthLabelFromIso(monthKey: string) { const [year, month] = monthKey.split("-"); return `${monthNames[Number(month) - 1]} ${year}`; }
function nextChargeFromSchedule(period: "monthly" | "yearly", chargeDay: number | null, chargeMonth: number | null, createdAt: string) {
  const fallback = new Date(createdAt);
  const day = chargeDay ?? fallback.getUTCDate();
  if (period === "monthly") return `${String(day).padStart(2, "0")} числа`;
  const month = chargeMonth ?? (fallback.getUTCMonth() + 1);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}`;
}
function getTransactionRows() { return db.prepare(`SELECT transactions.id, transactions.operation_date, transactions.merchant_normalized, transactions.amount, transactions.direction, transactions.description, transactions.category_id, transactions.source_order, transactions.created_at, categories.name AS category_name, categories.color AS category_color, categories.icon AS category_icon FROM transactions LEFT JOIN categories ON categories.id = transactions.category_id ORDER BY transactions.operation_date DESC, CASE WHEN transactions.source_order IS NULL THEN 1 ELSE 0 END ASC, transactions.source_order ASC, transactions.created_at DESC`).all() as TransactionRow[]; }
function getSubscriptionRows() { return db.prepare(`SELECT id, name, period, amount, is_active, auto_pay, created_at, charge_day, charge_month FROM subscriptions ORDER BY is_active DESC, amount DESC, name ASC`).all() as SubscriptionRow[]; }
function getImportRows() { return db.prepare(`SELECT id, source, file_name, imported_at, rows_count, rows_imported, rows_skipped, rows_needing_review, rows_failed, status FROM imports ORDER BY imported_at DESC, created_at DESC`).all() as ImportRow[]; }
function getReviewRows() { return db.prepare(`SELECT id, import_id, raw_merchant, source_category, mcc, sample_count, suggested_merchant_normalized, suggested_category_id FROM import_review_items WHERE status = 'pending' ORDER BY sample_count DESC, raw_merchant ASC`).all() as ReviewRow[]; }
function getMerchantRuleRows() { return db.prepare(`SELECT merchant_rules.id, merchant_rules.match_type, merchant_rules.pattern, merchant_rules.merchant_normalized, merchant_rules.category_id, categories.name AS category_name, merchant_rules.direction_override, merchant_rules.priority, merchant_rules.notes FROM merchant_rules LEFT JOIN categories ON categories.id = merchant_rules.category_id ORDER BY merchant_rules.priority DESC, merchant_rules.pattern ASC`).all() as MerchantRuleRow[]; }
function toOperationItem(row: TransactionRow): OperationItem { return { id: row.id, date: formatDate(row.operation_date), merchant: row.merchant_normalized, category: row.category_name ?? "Без категории", categoryId: row.category_id, categoryColor: row.category_color ?? null, categoryIcon: row.category_icon ?? null, amount: formatCurrency(row.amount, { sign: row.direction === "income" }), amountValue: row.amount, type: row.direction, description: row.description, status: "done" }; }
function toSubscriptionItem(row: SubscriptionRow): SubscriptionItem { return { id: row.id, name: row.name, period: row.period, amount: formatCurrency(row.amount), amountValue: row.amount, nextCharge: nextChargeFromSchedule(row.period, row.charge_day, row.charge_month, row.created_at), chargeDay: row.charge_day ?? new Date(row.created_at).getUTCDate(), chargeMonth: row.period === "yearly" ? (row.charge_month ?? (new Date(row.created_at).getUTCMonth() + 1)) : null, status: row.is_active ? "active" : "paused", autoPay: Boolean(row.auto_pay) }; }
function toImportItem(row: ImportRow): ImportHistoryItem { return { id: row.id, fileName: row.file_name, bank: row.source === "alfa" ? "Альфа" : "Тинькофф", importedAt: `${formatDate(row.imported_at.slice(0, 10))} ${row.imported_at.slice(11, 16)}`, rows: row.rows_count, imported: row.rows_imported, skipped: row.rows_skipped, failed: row.rows_failed, needsReview: row.rows_needing_review, status: row.status }; }
export function getOperations() { return getTransactionRows().map(toOperationItem); }
export function getSubscriptions() { return getSubscriptionRows().map(toSubscriptionItem); }
export function getImports() { return getImportRows().map(toImportItem); }
export function getPendingReviewItems(): ReviewItem[] { return getReviewRows().map((row) => ({ id: row.id, importId: row.import_id, rawMerchant: row.raw_merchant, sourceCategory: row.source_category, mcc: row.mcc, sampleCount: row.sample_count, suggestedMerchantNormalized: row.suggested_merchant_normalized ?? row.raw_merchant, suggestedCategoryId: row.suggested_category_id })); }
export function getCategories(): CategoryOption[] { return (db.prepare("SELECT id, name, slug FROM categories WHERE is_active = 1 ORDER BY name ASC").all() as CategoryRow[]).map((row) => ({ id: row.id, name: row.name, slug: row.slug })); }
export function getAllCategories(): CategoryAdminItem[] { return (db.prepare("SELECT id, name, slug, color, icon, is_active FROM categories ORDER BY name ASC").all() as CategoryRow[]).map((row) => ({ id: row.id, name: row.name, slug: row.slug, color: row.color ?? null, icon: row.icon ?? null, isActive: Boolean(row.is_active) })); }
export function getAllMerchantRules(): MerchantRuleAdminItem[] { return getMerchantRuleRows().map((row) => ({ id: row.id, matchType: row.match_type, pattern: row.pattern, merchantNormalized: row.merchant_normalized, categoryId: row.category_id, categoryName: row.category_name ?? null, directionOverride: row.direction_override ?? null, priority: row.priority, notes: row.notes ?? null })); }
export function getDashboardData(): DashboardData {
  const transactionRows = getTransactionRows();
  const subscriptionItems = getSubscriptionRows().map(toSubscriptionItem);
  const fallbackMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthKey = transactionRows[0]?.operation_date.slice(0, 7) ?? fallbackMonthKey;
  const currentMonthTransactions = transactionRows.filter((row) => row.operation_date.startsWith(currentMonthKey));

  const expenses = currentMonthTransactions
    .filter((row) => row.direction === "expense")
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);

  const incomes = currentMonthTransactions
    .filter((row) => row.direction === "income")
    .reduce((sum, row) => sum + Math.abs(row.amount), 0);

  const operationsCount = currentMonthTransactions.length;
  const currentMonthNumber = Number(currentMonthKey.slice(5, 7));
  const subscriptionsThisMonth = subscriptionItems
    .filter((item) => item.status === "active")
    .filter((item) => item.period === "monthly" || item.chargeMonth === currentMonthNumber)
    .reduce((sum, item) => sum + item.amountValue, 0);

  const topCategories = currentMonthTransactions
    .filter((row) => row.direction === "expense")
    .reduce((map, row) => {
      const key = row.category_name ?? "Без категории";
      const current = map.get(key) ?? { amount: 0, icon: row.category_icon ?? null };
      map.set(key, { amount: current.amount + Math.abs(row.amount), icon: current.icon ?? row.category_icon ?? null });
      return map;
    }, new Map<string, { amount: number; icon: string | null }>());

  const topCategoriesItems = Array.from(topCategories.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 5)
    .map(([name, value]) => ({ name, amount: formatCurrency(value.amount), icon: value.icon }));

  const manualSubscriptions = subscriptionItems
    .filter((item) => item.status === "active" && !item.autoPay)
    .filter((item) => item.period === "monthly" || item.chargeMonth === currentMonthNumber)
    .sort((a, b) => a.chargeDay - b.chargeDay || a.name.localeCompare(b.name));

  return {
    monthLabel: monthLabelFromIso(currentMonthKey),
    summaryCards: [
      {
        title: "Расходы за месяц",
        value: formatCurrency(expenses),
        hint: "Все расходы и списания за выбранный месяц",
      },
      {
        title: "Пополнения",
        value: formatCurrency(incomes, { sign: incomes > 0 }),
        hint: "Все пополнения и положительные движения за выбранный месяц",
      },
      {
        title: "Операций",
        value: String(operationsCount),
        hint: currentMonthTransactions.length > 0 ? "За выбранный рабочий месяц" : "Пока операций нет",
      },
      {
        title: "Подписки в этом месяце",
        value: formatCurrency(subscriptionsThisMonth),
        hint: subscriptionItems.length > 0 ? "Ежемесячные + годовые, если месяц оплаты совпал" : "Пока подписок нет",
      },
    ],
    recentTransactions: currentMonthTransactions.slice(0, 5).map(toOperationItem),
    topCategories: topCategoriesItems,
    subscriptions: subscriptionItems
      .filter((item) => item.status === "active")
      .filter((item) => item.period === "monthly" || item.chargeMonth === currentMonthNumber)
      .sort((a, b) => a.chargeDay - b.chargeDay || a.name.localeCompare(b.name)),
    manualSubscriptions,
  };
}
