"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryOption, OperationItem } from "@/lib/finance-data";

const typeLabels = { expense: "Расход", income: "Пополнение" };
const months = [
  { key: "01", label: "Январь" },
  { key: "02", label: "Февраль" },
  { key: "03", label: "Март" },
  { key: "04", label: "Апрель" },
  { key: "05", label: "Май" },
  { key: "06", label: "Июнь" },
  { key: "07", label: "Июль" },
  { key: "08", label: "Август" },
  { key: "09", label: "Сентябрь" },
  { key: "10", label: "Октябрь" },
  { key: "11", label: "Ноябрь" },
  { key: "12", label: "Декабрь" },
];
const filterButton = "rounded-full border px-3 py-2 text-sm transition";
const selectClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none";
const palette = ["#22d3ee", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#fb7185", "#f59e0b", "#34d399"];

function formatCurrency(value: number, { sign = false }: { sign?: boolean } = {}) {
  const formatted = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.abs(value));
  if (sign && value > 0) return `+${formatted} ₽`;
  if (sign && value < 0) return `-${formatted} ₽`;
  return `${formatted} ₽`;
}

function toMonthKey(date: string) {
  const [, month, year] = date.split(".");
  return { month, year };
}

function toComparableDate(date: string) {
  const [day, month, year] = date.split(".");
  return `${year}-${month}-${day}`;
}

function deriveYearOptions(transactions: OperationItem[]) {
  const years = Array.from(new Set(transactions.map((item) => item.date.split(".")[2]))).sort((a, b) => Number(b) - Number(a));
  return years.length === 0 ? [String(new Date().getUTCFullYear())] : years;
}

function deriveInitialMonth(transactions: OperationItem[]) {
  return transactions[0]?.date.split(".")[1] ?? String(new Date().getUTCMonth() + 1).padStart(2, "0");
}

function deriveInitialYear(transactions: OperationItem[]) {
  return transactions[0]?.date.split(".")[2] ?? String(new Date().getUTCFullYear());
}

type ChartSlice = { key: string; label: string; value: number; color: string; share: number; icon: string | null };
type TimelinePoint = { label: string; income: number; expense: number; balance: number };
type DonutHoverState = { slice: ChartSlice; x: number; y: number };

type SummaryCard = { title: string; value: string; hint: string; tone?: "income" | "expense" | "neutral" };

function describePeriod(periodMode: "month" | "custom", selectedMonth: string, selectedYear: string, dateFrom: string, dateTo: string) {
  if (periodMode === "month") {
    const monthLabel = months.find((item) => item.key === selectedMonth)?.label ?? selectedMonth;
    return `${monthLabel} ${selectedYear}`;
  }
  if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`;
  if (dateFrom) return `с ${dateFrom}`;
  if (dateTo) return `до ${dateTo}`;
  return "весь диапазон";
}

function hexToRgba(color: string, alpha: number) {
  const normalized = color.replace("#", "");
  if (normalized.length !== 6) return color;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildCategorySlices(transactions: OperationItem[]) {
  const expenses = transactions.filter((item) => item.type === "expense");
  const total = expenses.reduce((sum, item) => sum + Math.abs(item.amountValue), 0);
  if (total === 0) return [] as ChartSlice[];

  const grouped = expenses.reduce((map, item) => {
    const key = item.categoryId ?? item.category;
    const current = map.get(key) ?? { key, label: item.category, value: 0, color: item.categoryColor ?? null, icon: item.categoryIcon ?? null };
    current.value += Math.abs(item.amountValue);
    if (!current.color && item.categoryColor) current.color = item.categoryColor;
    if (!current.icon && item.categoryIcon) current.icon = item.categoryIcon;
    map.set(key, current);
    return map;
  }, new Map<string, { key: string; label: string; value: number; color: string | null; icon: string | null }>());

  const sorted = Array.from(grouped.values()).sort((a, b) => b.value - a.value);
  const detailed = sorted.filter((item, index) => index < 10 || item.value / total >= 0.04);
  const collapsedKeys = new Set(detailed.map((item) => item.key));
  const other = sorted.filter((item) => !collapsedKeys.has(item.key));

  const base = detailed.map((item, index) => ({
    key: item.key,
    label: item.label,
    value: item.value,
    color: item.color ?? palette[index % palette.length],
    share: item.value / total,
    icon: item.icon,
  }));

  if (other.length >= 2) {
    const otherValue = other.reduce((sum, item) => sum + item.value, 0);
    base.push({ key: "other", label: "Прочее", value: otherValue, color: "#64748b", share: otherValue / total, icon: null });
  } else if (other.length === 1) {
    const item = other[0];
    base.push({
      key: item.key,
      label: item.label,
      value: item.value,
      color: item.color ?? palette[base.length % palette.length],
      share: item.value / total,
      icon: item.icon,
    });
  }

  return base;
}

function buildMerchantStats(transactions: OperationItem[]) {
  const expenses = transactions.filter((item) => item.type === "expense");
  const total = expenses.reduce((sum, item) => sum + Math.abs(item.amountValue), 0);
  if (total === 0) return [] as Array<{ label: string; value: number; share: number }>;

  const grouped = expenses.reduce((map, item) => {
    map.set(item.merchant, (map.get(item.merchant) ?? 0) + Math.abs(item.amountValue));
    return map;
  }, new Map<string, number>());

  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, share: value / total }));
}

function buildMerchantSlices(transactions: OperationItem[], categoryLabel: string) {
  const expenses = transactions.filter((item) => item.type === "expense" && item.category === categoryLabel);
  const total = expenses.reduce((sum, item) => sum + Math.abs(item.amountValue), 0);
  if (total === 0) return [] as ChartSlice[];

  const grouped = expenses.reduce((map, item) => {
    map.set(item.merchant, (map.get(item.merchant) ?? 0) + Math.abs(item.amountValue));
    return map;
  }, new Map<string, number>());

  const sorted = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]);
  const detailed = sorted.filter(([_, value], index) => index < 12 || value / total >= 0.035);
  const detailedKeys = new Set(detailed.map(([label]) => label));
  const other = sorted.filter(([label]) => !detailedKeys.has(label));

  const slices = detailed.map(([label, value], index) => ({
    key: label,
    label,
    value,
    color: palette[index % palette.length],
    share: value / total,
    icon: null,
  }));

  if (other.length >= 2) {
    const otherValue = other.reduce((sum, [, value]) => sum + value, 0);
    slices.push({ key: "other-merchants", label: "Прочее", value: otherValue, color: "#64748b", share: otherValue / total, icon: null });
  } else if (other.length === 1) {
    const [label, value] = other[0];
    slices.push({ key: label, label, value, color: palette[slices.length % palette.length], share: value / total, icon: null });
  }

  return slices;
}

function buildTimeline(transactions: OperationItem[], periodMode: "month" | "custom", dateFrom: string, dateTo: string) {
  const grouped = new Map<string, TimelinePoint>();
  const customSpanDays = dateFrom && dateTo ? Math.max(1, Math.round((Date.parse(dateTo) - Date.parse(dateFrom)) / 86_400_000) + 1) : 0;
  const groupByDay = periodMode === "month" || (periodMode === "custom" && customSpanDays <= 45);

  for (const item of transactions) {
    const comparable = toComparableDate(item.date);
    const key = groupByDay ? comparable : comparable.slice(0, 7);
    const label = groupByDay
      ? item.date.slice(0, 5)
      : `${months.find((month) => month.key === comparable.slice(5, 7))?.label.slice(0, 3) ?? comparable.slice(5, 7)} ${comparable.slice(0, 4)}`;
    const current = grouped.get(key) ?? { label, income: 0, expense: 0, balance: 0 };
    if (item.type === "income") current.income += Math.abs(item.amountValue);
    else current.expense += Math.abs(item.amountValue);
    current.balance = current.income - current.expense;
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => value);
}

function DonutChart({
  slices,
  centerLabel,
  centerHint,
  activeKey,
  onSliceClick,
}: {
  slices: ChartSlice[];
  centerLabel: string;
  centerHint: string;
  activeKey?: string | null;
  onSliceClick?: (slice: ChartSlice) => void;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const [hoveredSlice, setHoveredSlice] = useState<DonutHoverState | null>(null);
  let offset = 0;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[19rem] sm:max-w-[24rem] lg:max-w-[30rem]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90 overflow-visible">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
        {slices.map((slice) => {
          const length = circumference * slice.share;
          const currentOffset = offset;
          const segment = (
            <circle
              key={slice.label}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={hoveredSlice?.slice.key === slice.key || activeKey === slice.key ? 22 : 18}
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={-currentOffset}
              className={`transition-all duration-150 ${onSliceClick ? "cursor-pointer" : "cursor-default"}`}
              style={{ filter: hoveredSlice?.slice.key === slice.key || activeKey === slice.key ? `drop-shadow(0 0 10px ${hexToRgba(slice.color, 0.45)})` : undefined }}
              onMouseMove={(event) => {
                const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!bounds) return;
                setHoveredSlice({ slice, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
              }}
              onMouseEnter={(event) => {
                const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                if (!bounds) return;
                setHoveredSlice({ slice, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
              }}
              onMouseLeave={() => setHoveredSlice((current) => current?.slice.key === slice.key ? null : current)}
              onClick={() => onSliceClick?.(slice)}
            />
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 sm:text-xs">{centerLabel}</p>
        <p className="mt-2 text-xl font-semibold text-white sm:text-3xl">{formatCurrency(total)}</p>
        <p className="mt-1 max-w-[9rem] text-[11px] leading-4 text-slate-400 sm:max-w-none sm:text-sm">{centerHint}</p>
      </div>
      {hoveredSlice ? (
        <div
          className="pointer-events-none absolute z-10 w-48 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-left shadow-2xl shadow-black/40 backdrop-blur sm:w-52"
          style={{ left: `clamp(0.5rem, ${hoveredSlice.x}px, calc(100% - 13rem))`, top: `clamp(0.5rem, ${hoveredSlice.y}px, calc(100% - 6rem))` }}
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hoveredSlice.slice.color }} />
            <p className="text-sm font-medium text-white">{hoveredSlice.slice.icon ? `${hoveredSlice.slice.icon} ` : ""}{hoveredSlice.slice.label}</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(hoveredSlice.slice.value)}</p>
          <p className="mt-1 text-xs text-slate-400">{(hoveredSlice.slice.share * 100).toFixed(hoveredSlice.slice.share < 0.1 ? 1 : 0)}% расходов в текущей выборке</p>
        </div>
      ) : null}
    </div>
  );
}

function EmptyChartState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 px-6 py-8 text-center">
      <p className="text-base font-medium text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-400">{hint}</p>
    </div>
  );
}

export function StatisticsClient({ transactions, categories }: { transactions: OperationItem[]; categories: CategoryOption[] }) {
  const years = deriveYearOptions(transactions);
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [selectedYear, setSelectedYear] = useState(deriveInitialYear(transactions));
  const [selectedMonth, setSelectedMonth] = useState(deriveInitialMonth(transactions));
  const [dateFrom, setDateFrom] = useState(transactions.at(-1) ? toComparableDate(transactions.at(-1)!.date) : "");
  const [dateTo, setDateTo] = useState(transactions[0] ? toComparableDate(transactions[0].date) : "");
  const [selectedCategoryDrill, setSelectedCategoryDrill] = useState<string | null>(null);

  const currentYear = String(new Date().getUTCFullYear());
  const currentMonth = String(new Date().getUTCMonth() + 1).padStart(2, "0");
  const availableMonths = useMemo(() => selectedYear === currentYear ? months.filter((month) => month.key <= currentMonth) : months, [selectedYear, currentYear, currentMonth]);

  useEffect(() => {
    if (!availableMonths.some((month) => month.key === selectedMonth)) {
      setSelectedMonth(availableMonths.at(-1)?.key ?? currentMonth);
    }
  }, [availableMonths, selectedMonth, currentMonth]);

  const filteredTransactions = useMemo(() => transactions.filter((item) => {
    const search = searchQuery.trim().toLowerCase();
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (categoryFilter !== "all" && item.categoryId !== categoryFilter) return false;
    if (search && !`${item.merchant} ${item.description ?? ""}`.toLowerCase().includes(search)) return false;
    if (periodMode === "month") {
      const { month, year } = toMonthKey(item.date);
      if (month !== selectedMonth || year !== selectedYear) return false;
    }
    if (periodMode === "custom") {
      const comparable = toComparableDate(item.date);
      if (dateFrom && comparable < dateFrom) return false;
      if (dateTo && comparable > dateTo) return false;
    }
    return true;
  }), [categoryFilter, dateFrom, dateTo, periodMode, searchQuery, selectedMonth, selectedYear, transactions, typeFilter]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Math.abs(item.amountValue), 0);
    const expense = filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Math.abs(item.amountValue), 0);
    const balance = income - expense;
    const periodLabel = describePeriod(periodMode, selectedMonth, selectedYear, dateFrom, dateTo);
    const cards: SummaryCard[] = [
      { title: "Операции", value: String(filteredTransactions.length), hint: `В выборке за ${periodLabel}` },
      { title: "Пополнения", value: formatCurrency(income, { sign: income > 0 }), hint: "Все положительные движения", tone: "income" },
      { title: "Расходы", value: formatCurrency(expense), hint: "Все списания по текущим фильтрам", tone: "expense" },
      { title: "Баланс", value: formatCurrency(balance, { sign: true }), hint: balance >= 0 ? "Период в плюсе" : "Период в минусе", tone: "neutral" },
    ];
    return { income, expense, balance, cards };
  }, [dateFrom, dateTo, filteredTransactions, periodMode, selectedMonth, selectedYear]);

  const categorySlices = useMemo(() => buildCategorySlices(filteredTransactions), [filteredTransactions]);
  const drilledMerchantSlices = useMemo(() => selectedCategoryDrill ? buildMerchantSlices(filteredTransactions, selectedCategoryDrill) : [], [filteredTransactions, selectedCategoryDrill]);
  const activeSlices = selectedCategoryDrill ? drilledMerchantSlices : categorySlices;
  const timeline = useMemo(() => buildTimeline(filteredTransactions, periodMode, dateFrom, dateTo), [filteredTransactions, periodMode, dateFrom, dateTo]);
  const merchantStats = useMemo(() => buildMerchantStats(filteredTransactions), [filteredTransactions]);
  const timelineMax = useMemo(() => Math.max(1, ...timeline.flatMap((point) => [point.income, point.expense, Math.abs(point.balance)])), [timeline]);

  useEffect(() => {
    if (!selectedCategoryDrill) return;
    const stillExists = categorySlices.some((slice) => slice.label === selectedCategoryDrill);
    if (!stillExists) setSelectedCategoryDrill(null);
  }, [categorySlices, selectedCategoryDrill]);

  const chartTitle = selectedCategoryDrill ? `Вендоры категории «${selectedCategoryDrill}»` : "Расходы по категориям";
  const chartDescription = selectedCategoryDrill
    ? "Диаграмма перестроена по продавцам внутри выбранной категории. Нажми «Назад к категориям», чтобы вернуться к общему срезу."
    : "Центральный срез структуры трат. Наведи на сектор, чтобы увидеть категорию, сумму и долю. Нажми на сектор, чтобы провалиться к вендорам этой категории.";

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Статистика</h2>
              <p className="mt-2 text-sm text-slate-400">Те же фильтры, что и в операциях, но вместо списка — графики и сводные срезы.</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 xl:col-span-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPeriodMode("month")} className={`${filterButton} ${periodMode === "month" ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}>По месяцу</button>
                <button type="button" onClick={() => setPeriodMode("custom")} className={`${filterButton} ${periodMode === "custom" ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}>Кастомные даты</button>
              </div>
              {periodMode === "month" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Год</span>
                    <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className={selectClass}>
                      {years.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Месяц</span>
                    <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={selectClass}>
                      {availableMonths.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Дата от</span>
                    <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={selectClass} />
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Дата до</span>
                    <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={selectClass} />
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Тип операции</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["all", "expense", "income"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={`${filterButton} w-full justify-center text-center ${typeFilter === value ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}
                  >
                    {value === "all" ? "Все" : typeLabels[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Категория</p>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={selectClass}>
                <option value="all">Все категории</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Поиск</p>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Название или комментарий" className={selectClass} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {summary.cards.map((card) => (
          <article key={card.title} className={`rounded-2xl border p-4 shadow-lg shadow-black/20 sm:p-5 ${card.tone === "income" ? "border-emerald-400/20 bg-emerald-500/10" : card.tone === "expense" ? "border-rose-400/20 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
            <p className="text-xs text-slate-400 sm:text-sm">{card.title}</p>
            <p className={`mt-3 text-2xl font-semibold sm:text-3xl ${card.tone === "income" ? "text-emerald-300" : card.tone === "expense" ? "text-rose-300" : card.title === "Баланс" ? (summary.balance >= 0 ? "text-cyan-300" : "text-amber-300") : "text-white"}`}>{card.value}</p>
            <p className="mt-2 text-xs text-slate-400 sm:text-sm">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="mx-auto mb-5 max-w-3xl text-center">
          <h3 className="text-xl font-semibold text-white sm:text-2xl">{chartTitle}</h3>
          <p className="mt-2 text-sm text-slate-400">{chartDescription}</p>
          {selectedCategoryDrill ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedCategoryDrill(null)}
                className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-400/15 hover:text-white"
              >
                ← Назад к категориям
              </button>
            </div>
          ) : null}
        </div>
        {activeSlices.length === 0 ? (
          <EmptyChartState title="Нет расходов для диаграммы" hint="Измени фильтры или переключись на период, где есть списания." />
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/25 px-3 py-5 sm:px-4 sm:py-6">
              <DonutChart
                slices={activeSlices}
                centerLabel={selectedCategoryDrill ? "Вендоры" : "Расходы"}
                centerHint={selectedCategoryDrill ? `внутри ${selectedCategoryDrill}` : "по категориям"}
                onSliceClick={(slice) => {
                  if (selectedCategoryDrill) return;
                  if (slice.key === "other") return;
                  setSelectedCategoryDrill(slice.label);
                }}
              />
            </div>
            <div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeSlices.map((slice) => (
                <button
                  key={slice.key}
                  type="button"
                  disabled={Boolean(selectedCategoryDrill)}
                  onClick={() => {
                    if (selectedCategoryDrill) return;
                    if (slice.key === "other") return;
                    setSelectedCategoryDrill(slice.label);
                  }}
                  className={`min-w-0 rounded-xl border bg-slate-950/30 p-3 text-left transition ${selectedCategoryDrill ? "cursor-default border-white/10" : slice.key === "other" ? "cursor-default border-white/10" : "cursor-pointer border-white/10 hover:border-cyan-400/40 hover:bg-cyan-400/5"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{slice.icon ? `${slice.icon} ` : ""}{slice.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{(slice.share * 100).toFixed(slice.share < 0.1 ? 1 : 0)}% расходов</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-white">{formatCurrency(slice.value)}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/5">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.max(slice.share * 100, 4)}%`, backgroundColor: slice.color }} />
                  </div>
                  {!selectedCategoryDrill && slice.key !== "other" ? <p className="mt-2 text-[11px] text-cyan-300/80">Нажми для вендоров →</p> : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] sm:gap-6">
        <article className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Топ продавцов</h3>
            <p className="mt-2 text-sm text-slate-400">Кто съедает бюджет сильнее всего в текущей выборке.</p>
          </div>
          {merchantStats.length === 0 ? (
            <EmptyChartState title="Нет расходов для рейтинга" hint="Когда в выборке появятся списания, здесь покажется топ продавцов." />
          ) : (
            <div className="space-y-3">
              {merchantStats.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{(item.share * 100).toFixed(item.share < 0.1 ? 1 : 0)}% расходов</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-white">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" style={{ width: `${Math.max(item.share * 100, 4)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <section className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Динамика по времени</h3>
          <p className="mt-2 text-sm text-slate-400">По месяцу строится дневная лента, по широкому диапазону — укрупнение по месяцам.</p>
        </div>
        {timeline.length === 0 ? (
          <EmptyChartState title="Нет данных для графика" hint="В текущей выборке нет операций. Проверь период или другие фильтры." />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto overflow-y-hidden pb-2">
              <div className="flex min-w-max items-end gap-3 rounded-3xl border border-white/10 bg-slate-950/30 p-4 sm:gap-4 sm:p-5">
                {timeline.map((point) => (
                  <div key={point.label} className="flex w-14 shrink-0 flex-col items-center gap-3 sm:w-16">
                    <div className="flex h-52 items-end gap-1 sm:h-60">
                      <div className="w-4 rounded-t-2xl bg-emerald-400/90" style={{ height: `${Math.max((point.income / timelineMax) * 100, point.income > 0 ? 6 : 0)}%` }} title={`Пополнения: ${formatCurrency(point.income, { sign: point.income > 0 })}`} />
                      <div className="w-4 rounded-t-2xl bg-rose-400/90" style={{ height: `${Math.max((point.expense / timelineMax) * 100, point.expense > 0 ? 6 : 0)}%` }} title={`Расходы: ${formatCurrency(point.expense)}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-300">{point.label}</p>
                      <p className={`mt-1 text-[11px] ${point.balance >= 0 ? "text-cyan-300" : "text-amber-300"}`}>{formatCurrency(point.balance, { sign: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Пополнения</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" />Расходы</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/30 px-3 py-2">Баланс под столбцами</span>
            </div>
          </div>
        )}
      </section>
    </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Краткие выводы по выборке</h3>
          <p className="mt-2 text-sm text-slate-400">Быстрый текстовый срез, чтобы не вычитывать всё глазами из графиков.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-500">Главная категория расходов</p>
            <p className="mt-3 text-lg font-semibold text-white">{categorySlices[0] ? `${categorySlices[0].icon ? `${categorySlices[0].icon} ` : ""}${categorySlices[0].label}` : "—"}</p>
            <p className="mt-2 text-sm text-slate-400">{categorySlices[0] ? `${formatCurrency(categorySlices[0].value)} · ${(categorySlices[0].share * 100).toFixed(0)}%` : "Нет расходов в выборке"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-500">Главный продавец</p>
            <p className="mt-3 text-lg font-semibold text-white">{merchantStats[0]?.label ?? "—"}</p>
            <p className="mt-2 text-sm text-slate-400">{merchantStats[0] ? `${formatCurrency(merchantStats[0].value)} · ${(merchantStats[0].share * 100).toFixed(0)}%` : "Нет расходов в выборке"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-500">Режим периода</p>
            <p className="mt-3 text-lg font-semibold text-white">{periodMode === "month" ? "Помесячный" : "Произвольный диапазон"}</p>
            <p className="mt-2 text-sm text-slate-400">{describePeriod(periodMode, selectedMonth, selectedYear, dateFrom, dateTo)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
