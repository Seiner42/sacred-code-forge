"use client";

import { useMemo, useState } from "react";
import { transactions } from "@/lib/mock-data";

const typeLabels = {
  expense: "Расход",
  income: "Пополнение",
  transfer: "Перевод",
};

const years = ["2026", "2025"];

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

function badgeClass(kind: "expense" | "income" | "transfer") {
  if (kind === "expense") return "bg-rose-500/15 text-rose-300";
  if (kind === "income") return "bg-emerald-500/15 text-emerald-300";
  return "bg-cyan-500/15 text-cyan-300";
}

const filterButton = "rounded-full border px-3 py-2 text-sm transition";
const selectClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none";

function toMonthKey(date: string) {
  const [, month, year] = date.split(".");
  return { month, year };
}

function toComparableDate(date: string) {
  const [day, month, year] = date.split(".");
  return `${year}-${month}-${day}`;
}

export default function OperationsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [hideTransfers, setHideTransfers] = useState(false);
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("03");
  const [dateFrom, setDateFrom] = useState("2026-03-01");
  const [dateTo, setDateTo] = useState("2026-03-31");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (hideTransfers && item.type === "transfer") return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;

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
    });
  }, [dateFrom, dateTo, hideTransfers, periodMode, selectedMonth, selectedYear, typeFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Операции</h2>
            <p className="mt-2 text-sm text-slate-400">
              Журнал операций с фильтром периода: по отдельному выбору года и месяца или по кастомному диапазону дат.
            </p>
          </div>

          <div className="grid gap-3 xl:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 xl:col-span-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodMode("month")}
                  className={`${filterButton} ${
                    periodMode === "month"
                      ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                      : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                  }`}
                >
                  По месяцу
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodMode("custom")}
                  className={`${filterButton} ${
                    periodMode === "custom"
                      ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                      : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                  }`}
                >
                  Кастомные даты
                </button>
              </div>

              {periodMode === "month" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Год</span>
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      className={selectClass}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Месяц</span>
                    <select
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                      className={selectClass}
                    >
                      {months.map((month) => (
                        <option key={month.key} value={month.key}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Дата от</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className={selectClass}
                    />
                  </label>
                  <label className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                    <span className="block text-slate-500">Дата до</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className={selectClass}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Тип операции</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "expense", "income", "transfer"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={`${filterButton} ${
                      typeFilter === value
                        ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                        : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                    }`}
                  >
                    {value === "all" ? "Все" : typeLabels[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 xl:col-span-2">
              <p className="text-sm text-slate-500">Режим</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHideTransfers((prev) => !prev)}
                  className={`${filterButton} ${
                    hideTransfers
                      ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                      : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                  }`}
                >
                  {hideTransfers ? "Переводы скрыты" : "Показывать переводы"}
                </button>
                <p className="text-sm text-slate-400">
                  Сейчас в списке: {filteredTransactions.length} операций
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 md:hidden">
        {filteredTransactions.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white">{item.merchant}</p>
                <p className="mt-1 text-xs text-slate-400">{item.date}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-white">{item.amount}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">{item.category}</span>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.type)}`}>
                {typeLabels[item.type]}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Операция</th>
                <th className="px-4 py-3 font-medium">Категория</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.merchant}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(item.type)}`}>
                      {typeLabels[item.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white whitespace-nowrap">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
