"use client";

import { useMemo, useState } from "react";
import { transactions } from "@/lib/mock-data";

const typeLabels = {
  expense: "Расход",
  income: "Пополнение",
  transfer: "Перевод",
};

const statusLabels = {
  done: "Проведено",
  pending: "В обработке",
};

function badgeClass(kind: "expense" | "income" | "transfer") {
  if (kind === "expense") return "bg-rose-500/15 text-rose-300";
  if (kind === "income") return "bg-emerald-500/15 text-emerald-300";
  return "bg-cyan-500/15 text-cyan-300";
}

function statusClass(status: "done" | "pending") {
  return status === "pending"
    ? "bg-amber-500/15 text-amber-300"
    : "bg-emerald-500/15 text-emerald-300";
}

const filterButton =
  "rounded-full border px-3 py-2 text-sm transition";

export default function OperationsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "pending">("all");
  const [hideTransfers, setHideTransfers] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (hideTransfers && item.type === "transfer") return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [hideTransfers, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Operations</h2>
            <p className="mt-2 text-slate-400">
              Первый проход по журналу операций: таблица, статусы и базовые фильтры на моках.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
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

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Статус</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "done", "pending"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`${filterButton} ${
                      statusFilter === value
                        ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                        : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                    }`}
                  >
                    {value === "all" ? "Все" : statusLabels[value]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-sm text-slate-500">Режим</p>
              <button
                type="button"
                onClick={() => setHideTransfers((prev) => !prev)}
                className={`mt-3 ${filterButton} ${
                  hideTransfers
                    ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                    : "border-white/10 text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-400/10"
                }`}
              >
                {hideTransfers ? "Переводы скрыты" : "Показывать переводы"}
              </button>
              <p className="mt-3 text-sm text-slate-400">
                Сейчас в списке: {filteredTransactions.length} операций
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Операция</th>
                <th className="px-4 py-3 font-medium">Категория</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium">Статус</th>
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
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {statusLabels[item.status]}
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
