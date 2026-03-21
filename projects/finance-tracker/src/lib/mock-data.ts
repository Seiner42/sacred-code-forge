export type SummaryCard = {
  title: string;
  value: string;
  hint: string;
};

export type Transaction = {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: string;
  type: "expense" | "income" | "transfer";
  status: "done" | "pending";
};

export type Subscription = {
  id: string;
  name: string;
  period: "monthly" | "yearly";
  amount: string;
  nextCharge: string;
  status: "active" | "paused";
};

export type ImportHistoryItem = {
  id: string;
  fileName: string;
  bank: "Альфа" | "Тинькофф";
  importedAt: string;
  rows: number;
  status: "ready" | "processing" | "failed";
};

export const summaryCards: SummaryCard[] = [
  {
    title: "Расходы за март",
    value: "87 430 ₽",
    hint: "+12% к прошлому месяцу",
  },
  {
    title: "Пополнения",
    value: "210 612 ₽",
    hint: "с учётом переводов между счетами",
  },
  {
    title: "Операций",
    value: "126",
    hint: "За текущий месяц",
  },
  {
    title: "Подписки",
    value: "4 302 ₽",
    hint: "3 ежемесячных · 1 годовая",
  },
];

export const topCategories = [
  { name: "Продукты", amount: "32 180 ₽" },
  { name: "Табак", amount: "14 023 ₽" },
  { name: "Связь и сервисы", amount: "5 003 ₽" },
  { name: "Маркетплейсы", amount: "2 911 ₽" },
];

export const transactions: Transaction[] = [
  {
    id: "tx-1",
    date: "21.03.2026",
    merchant: "Yandex Lavka",
    category: "Продукты",
    amount: "2 116 ₽",
    type: "expense",
    status: "pending",
  },
  {
    id: "tx-2",
    date: "20.03.2026",
    merchant: "Yandex 360",
    category: "Подписки",
    amount: "2 990 ₽",
    type: "expense",
    status: "pending",
  },
  {
    id: "tx-3",
    date: "20.03.2026",
    merchant: "Ozon",
    category: "Маркетплейсы",
    amount: "204 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-4",
    date: "19.03.2026",
    merchant: "Светлана Я.",
    category: "Переводы",
    amount: "7 000 ₽",
    type: "transfer",
    status: "done",
  },
  {
    id: "tx-5",
    date: "19.03.2026",
    merchant: "Билайн",
    category: "Связь",
    amount: "100 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-6",
    date: "18.03.2026",
    merchant: "Пятёрочка",
    category: "Продукты",
    amount: "1 056 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-7",
    date: "17.03.2026",
    merchant: "Мосэнергосбыт",
    category: "ЖКХ",
    amount: "1 919 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-8",
    date: "16.03.2026",
    merchant: "Максим Владимирович Я",
    category: "Прочие расходы",
    amount: "637 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-9",
    date: "14.03.2026",
    merchant: "CashBack",
    category: "Пополнения",
    amount: "+1 096 ₽",
    type: "income",
    status: "done",
  },
  {
    id: "tx-10",
    date: "13.03.2026",
    merchant: "Между своими счетами",
    category: "Внутренние переводы",
    amount: "+64 567 ₽",
    type: "income",
    status: "done",
  },
  {
    id: "tx-11",
    date: "11.03.2026",
    merchant: "U.S. Polo Assn",
    category: "Одежда и обувь",
    amount: "11 900 ₽",
    type: "expense",
    status: "done",
  },
  {
    id: "tx-12",
    date: "09.03.2026",
    merchant: "Yandex Eda",
    category: "Фастфуд",
    amount: "2 238 ₽",
    type: "expense",
    status: "done",
  },
];

export const recentTransactions = transactions.slice(0, 5);

export const subscriptions: Subscription[] = [
  {
    id: "sub-1",
    name: "Yandex 360",
    period: "yearly",
    amount: "2 990 ₽",
    nextCharge: "20.03.2027",
    status: "active",
  },
  {
    id: "sub-2",
    name: "Yandex Plus",
    period: "monthly",
    amount: "499 ₽",
    nextCharge: "20.04.2026",
    status: "active",
  },
  {
    id: "sub-3",
    name: "Билайн",
    period: "monthly",
    amount: "100 ₽",
    nextCharge: "01.04.2026",
    status: "active",
  },
  {
    id: "sub-4",
    name: "Альфа-Смарт",
    period: "monthly",
    amount: "399 ₽",
    nextCharge: "25.03.2026",
    status: "paused",
  },
];

export const importHistory: ImportHistoryItem[] = [
  {
    id: "imp-1",
    fileName: "Statement_21.02.2026_-_21.03.2026.csv",
    bank: "Альфа",
    importedAt: "21.03.2026 20:07",
    rows: 108,
    status: "ready",
  },
  {
    id: "imp-2",
    fileName: "tinkoff-march.csv",
    bank: "Тинькофф",
    importedAt: "18.03.2026 11:32",
    rows: 64,
    status: "processing",
  },
  {
    id: "imp-3",
    fileName: "alfa-february.csv",
    bank: "Альфа",
    importedAt: "01.03.2026 09:14",
    rows: 97,
    status: "failed",
  },
];
