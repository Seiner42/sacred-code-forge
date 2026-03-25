"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryOption, OperationItem } from "@/lib/finance-data";

const typeLabels = { expense: "Расход", income: "Пополнение" };
const months = [
  { key: "01", label: "Январь" }, { key: "02", label: "Февраль" }, { key: "03", label: "Март" }, { key: "04", label: "Апрель" },
  { key: "05", label: "Май" }, { key: "06", label: "Июнь" }, { key: "07", label: "Июль" }, { key: "08", label: "Август" },
  { key: "09", label: "Сентябрь" }, { key: "10", label: "Октябрь" }, { key: "11", label: "Ноябрь" }, { key: "12", label: "Декабрь" },
];
const filterButton = "rounded-full border px-3 py-2 text-sm transition";
const selectClass = "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none";

function formatCurrency(value: number, { sign = false }: { sign?: boolean } = {}) {
  const formatted = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.abs(value));
  if (sign && value > 0) return `+${formatted} ₽`;
  if (sign && value < 0) return `-${formatted} ₽`;
  return `${formatted} ₽`;
}

type FormState = {
  operationDate: string;
  merchant: string;
  amount: string;
  type: "expense" | "income";
  categoryId: string;
  description: string;
};

function badgeClass(kind: "expense" | "income") {
  if (kind === "expense") return "bg-rose-500/15 text-rose-300";
  return "bg-emerald-500/15 text-emerald-300";
}
function categoryBadgeStyle(color: string | null | undefined) {
  if (!color) return undefined;
  return { backgroundColor: `${color}26`, color };
}
function amountClass(kind: "expense" | "income") {
  if (kind === "expense") return "text-rose-300";
  return "text-emerald-300";
}
function toMonthKey(date: string) { const [, month, year] = date.split("."); return { month, year }; }
function toComparableDate(date: string) { const [day, month, year] = date.split("."); return `${year}-${month}-${day}`; }
function deriveYearOptions(transactions: OperationItem[]) {
  const years = Array.from(new Set(transactions.map((item) => item.date.split(".")[2]))).sort((a, b) => Number(b) - Number(a));
  return years.length === 0 ? [String(new Date().getUTCFullYear())] : years;
}
function deriveInitialMonth(transactions: OperationItem[]) { return transactions[0]?.date.split(".")[1] ?? String(new Date().getUTCMonth() + 1).padStart(2, "0"); }
function deriveInitialYear(transactions: OperationItem[]) { return transactions[0]?.date.split(".")[2] ?? String(new Date().getUTCFullYear()); }
function formFromOperation(operation?: OperationItem, fallbackCategoryId?: string): FormState {
  if (!operation) return { operationDate: new Date().toISOString().slice(0, 10), merchant: "", amount: "", type: "expense", categoryId: fallbackCategoryId ?? "", description: "" };
  return { operationDate: toComparableDate(operation.date), merchant: operation.merchant, amount: String(Math.abs(operation.amountValue)), type: operation.type, categoryId: operation.categoryId ?? fallbackCategoryId ?? "", description: operation.description ?? "" };
}

export function OperationsClient({ transactions: initialTransactions, categories }: { transactions: OperationItem[]; categories: CategoryOption[] }) {
  const years = deriveYearOptions(initialTransactions);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [selectedYear, setSelectedYear] = useState(deriveInitialYear(initialTransactions));
  const [selectedMonth, setSelectedMonth] = useState(deriveInitialMonth(initialTransactions));
  const [dateFrom, setDateFrom] = useState(initialTransactions.at(-1) ? toComparableDate(initialTransactions.at(-1)!.date) : "");
  const [dateTo, setDateTo] = useState(initialTransactions[0] ? toComparableDate(initialTransactions[0].date) : "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formFromOperation(undefined, categories[0]?.id));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([]);

  const currentYear = String(new Date().getUTCFullYear());
  const currentMonth = String(new Date().getUTCMonth() + 1).padStart(2, "0");
  const availableMonths = useMemo(() => selectedYear === currentYear ? months.filter((month) => month.key <= currentMonth) : months, [selectedYear, currentYear, currentMonth]);

  useEffect(() => {
    if (!availableMonths.some((month) => month.key === selectedMonth)) {
      setSelectedMonth(availableMonths.at(-1)?.key ?? currentMonth);
    }
  }, [availableMonths, selectedMonth, currentMonth]);

  useEffect(() => {
    if (!isModalOpen) {
      setMerchantSuggestions([]);
      return;
    }

    const query = form.merchant.trim();
    if (query.length < 1) {
      setMerchantSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/transactions/suggestions?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const result = await response.json() as { ok: boolean; suggestions?: string[] };
        if (!response.ok || !result.ok) {
          setMerchantSuggestions([]);
          return;
        }
        setMerchantSuggestions((result.suggestions ?? []).filter((item) => item !== query));
      } catch {
        if (!controller.signal.aborted) setMerchantSuggestions([]);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [form.merchant, isModalOpen]);

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

  const filteredIncomeTotal = useMemo(() => filteredTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Math.abs(item.amountValue), 0), [filteredTransactions]);
  const filteredExpenseTotal = useMemo(() => filteredTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Math.abs(item.amountValue), 0), [filteredTransactions]);

  function openCreate() { setEditingId(null); setForm(formFromOperation(undefined, categories[0]?.id)); setMerchantSuggestions([]); setError(""); setIsModalOpen(true); }
  function openEdit(item: OperationItem) { setEditingId(item.id); setForm(formFromOperation(item, categories[0]?.id)); setMerchantSuggestions([]); setError(""); setIsModalOpen(true); }
  function closeModal() { if (saving) return; setIsModalOpen(false); setEditingId(null); setForm(formFromOperation(undefined, categories[0]?.id)); setMerchantSuggestions([]); setError(""); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/transactions/${editingId}` : "/api/transactions", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operationDate: form.operationDate, merchant: form.merchant, amount: Number(form.amount), type: form.type, categoryId: form.categoryId || null, description: form.description || null }) });
      const result = await response.json() as { ok: boolean; transaction?: OperationItem; error?: string };
      if (!response.ok || !result.ok || !result.transaction) { setError(result.error ?? "Не удалось сохранить операцию"); return; }
      setTransactions((current) => editingId ? current.map((item) => item.id === editingId ? result.transaction! : item) : [result.transaction!, ...current]);
      closeModal();
    } catch { setError("Сбой сохранения. Повтори попытку."); } finally { setSaving(false); }
  }

  async function handleDelete(item: OperationItem) {
    if (!window.confirm(`Удалить операцию «${item.merchant}»?`)) return;
    const response = await fetch(`/api/transactions/${item.id}`, { method: "DELETE" });
    const result = await response.json() as { ok: boolean; error?: string };
    if (!response.ok || !result.ok) { window.alert(result.error ?? "Не удалось удалить операцию"); return; }
    setTransactions((current) => current.filter((currentItem) => currentItem.id !== item.id));
  }

  return <div className="space-y-4 sm:space-y-6"><section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><div className="flex flex-col gap-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-white sm:text-2xl">Операции</h2><p className="mt-2 text-sm text-slate-400">Журнал операций с фильтром по месяцу или диапазону дат.</p></div><button onClick={openCreate} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">+ Добавить операцию</button></div><div className="grid gap-3 xl:grid-cols-3 sm:gap-4"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 xl:col-span-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setPeriodMode("month")} className={`${filterButton} ${periodMode === "month" ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}>По месяцу</button><button type="button" onClick={() => setPeriodMode("custom")} className={`${filterButton} ${periodMode === "custom" ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}>Кастомные даты</button></div>{periodMode === "month" ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"><span className="block text-slate-500">Год</span><select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className={selectClass}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"><span className="block text-slate-500">Месяц</span><select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className={selectClass}>{availableMonths.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}</select></label></div> : <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"><span className="block text-slate-500">Дата от</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={selectClass} /></label><label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300"><span className="block text-slate-500">Дата до</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={selectClass} /></label></div>}</div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm text-slate-500">Тип операции</p><div className="mt-3 grid grid-cols-3 gap-2">{(["all","expense","income"] as const).map((value) => <button key={value} type="button" onClick={() => setTypeFilter(value)} className={`${filterButton} w-full justify-center text-center ${typeFilter === value ? "border-cyan-300/60 bg-cyan-400/15 text-white" : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"}`}>{value === "all" ? "Все" : typeLabels[value]}</button>)}</div></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm text-slate-500">Категория</p><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={selectClass}><option value="all">Все категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm text-slate-500">Поиск</p><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Название или комментарий" className={selectClass} /></div><div className="grid gap-3 sm:grid-cols-3 xl:col-span-3"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm text-slate-500">Кол-во операций</p><p className="mt-3 text-2xl font-semibold text-white">{filteredTransactions.length}</p></div><div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4"><p className="text-sm text-emerald-100/80">Сумма приходов</p><p className="mt-3 text-2xl font-semibold text-emerald-300">{formatCurrency(filteredIncomeTotal, { sign: true })}</p></div><div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4"><p className="text-sm text-rose-100/80">Сумма расходов</p><p className="mt-3 text-2xl font-semibold text-rose-300">{formatCurrency(filteredExpenseTotal)}</p></div></div></div></div></section><section className="space-y-3 md:hidden">{filteredTransactions.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-white">{item.merchant}</p><p className="mt-1 text-xs text-slate-400">{item.date}</p></div><span className={`shrink-0 text-sm font-medium ${amountClass(item.type)}`}>{item.amount}</span></div><div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300" style={categoryBadgeStyle(item.categoryColor)}>{item.categoryIcon ? <span>{item.categoryIcon}</span> : null}<span>{item.category}</span></span><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.type)}`}>{typeLabels[item.type]}</span></div><div className="mt-3 flex gap-2"><button onClick={() => openEdit(item)} aria-label="Изменить операцию" title="Изменить" className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">✏️</button><button onClick={() => handleDelete(item)} aria-label="Удалить операцию" title="Удалить" className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-white">🗑️</button></div></article>)}</section><section className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 md:block"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-white/10 text-sm"><thead className="bg-white/5 text-left text-slate-400"><tr><th className="px-4 py-3 font-medium">Дата</th><th className="px-4 py-3 font-medium">Операция</th><th className="px-4 py-3 font-medium">Категория</th><th className="px-4 py-3 font-medium">Тип</th><th className="px-4 py-3 font-medium text-right">Сумма</th><th className="px-4 py-3 font-medium text-right">Действия</th></tr></thead><tbody className="divide-y divide-white/10">{filteredTransactions.map((item) => <tr key={item.id} className="text-slate-200"><td className="px-4 py-3 whitespace-nowrap">{item.date}</td><td className="px-4 py-3"><div className="font-medium text-white">{item.merchant}</div>{item.description ? <div className="mt-1 text-xs text-slate-500">{item.description}</div> : null}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300" style={categoryBadgeStyle(item.categoryColor)}>{item.categoryIcon ? <span>{item.categoryIcon}</span> : null}<span>{item.category}</span></span></td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.type)}`}>{typeLabels[item.type]}</span></td><td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${amountClass(item.type)}`}>{item.amount}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => openEdit(item)} aria-label="Изменить операцию" title="Изменить" className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">✏️</button><button onClick={() => handleDelete(item)} aria-label="Удалить операцию" title="Удалить" className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-rose-400/50 hover:bg-rose-500/10 hover:text-white">🗑️</button></div></td></tr>)}</tbody></table></div></section>{isModalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Операция</p><h3 className="mt-2 text-xl font-semibold text-white">{editingId ? 'Изменить операцию' : 'Новая операция'}</h3></div><button onClick={closeModal} className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">✕</button></div><form onSubmit={submit} className="mt-5 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm text-slate-300">Дата</span><input type="date" value={form.operationDate} onChange={(event) => setForm((current) => ({ ...current, operationDate: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" required /></label><label className="block"><span className="mb-2 block text-sm text-slate-300">Сумма, ₽</span><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" required /></label></div><label className="block"><span className="mb-2 block text-sm text-slate-300">Название</span><input value={form.merchant} list="merchant-suggestions" onChange={(event) => setForm((current) => ({ ...current, merchant: event.target.value }))} placeholder="Например: Яндекс Лавка или Зарплата" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" required />{merchantSuggestions.length > 0 ? <p className="mt-2 text-xs text-slate-500">Подсказки берутся из уже сохранённых операций и правил.</p> : null}<datalist id="merchant-suggestions">{merchantSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm text-slate-300">Тип</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FormState['type'] }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"><option value="expense">Расход</option><option value="income">Пополнение</option></select></label><label className="block"><span className="mb-2 block text-sm text-slate-300">Категория</span><select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div><label className="block"><span className="mb-2 block text-sm text-slate-300">Комментарий</span><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" /></label>{error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}<div className="flex gap-3"><button type="button" onClick={closeModal} className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">Отмена</button><button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Сохраняю...' : editingId ? 'Сохранить' : 'Добавить'}</button></div></form></div></div> : null}</div>;
}
