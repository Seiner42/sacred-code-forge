"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import type { ImportHistoryItem } from "@/lib/finance-data";

const statusLabels = {
  ready: "Готово",
  processing: "В обработке",
  failed: "Ошибка",
};

function statusClass(status: "ready" | "processing" | "failed") {
  if (status === "ready") return "bg-emerald-500/15 text-emerald-300";
  if (status === "processing") return "bg-amber-500/15 text-amber-300";
  return "bg-rose-500/15 text-rose-300";
}

type UploadSummary = {
  rowsCount: number;
  rowsImported: number;
  rowsSkipped: number;
  rowsFailed: number;
  rowsNeedingReview: number;
};

export function ImportsClient({ initialImports }: { initialImports: ImportHistoryItem[] }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState(initialImports);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<UploadSummary | null>(null);

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "alfa");

      const response = await fetch("/api/imports/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { ok: boolean; item?: ImportHistoryItem; summary?: UploadSummary; error?: string };

      if (!response.ok || !result.ok || !result.item || !result.summary) {
        setError(result.error ?? "Не удалось импортировать CSV");
        return;
      }

      setItems((current) => [result.item!, ...current]);
      setSummary(result.summary);
    } catch {
      setError("Сбой загрузки. Повтори попытку.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] sm:gap-6">
        <article className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/10 p-5 shadow-lg shadow-black/20 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">Импорт</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Загрузка Альфа CSV</h2>
          <p className="mt-3 text-sm leading-6 text-cyan-50/90">
            CSV читается в памяти, операции записываются в SQLite, а новые непонятные merchants попадают в контур ручного разбора.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-950/40 px-4 py-8 text-center sm:px-6 sm:py-10">
            <p className="text-base font-medium text-white">Выбери CSV-выписку из Альфы</p>
            <p className="mt-2 text-sm text-slate-400">Поддерживается только формат Альфа CSV. Сам файл на диск не сохраняется.</p>

            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

            <button onClick={openPicker} disabled={uploading} className="mt-5 rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {uploading ? "Импортирую..." : "Выбрать CSV"}
            </button>

            {error ? <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

            {summary ? (
              <div className="mt-4 grid gap-3 text-left sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">Строк в CSV: <span className="font-semibold text-white">{summary.rowsCount}</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">Импортировано: <span className="font-semibold text-white">{summary.rowsImported}</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">Пропущено дублей: <span className="font-semibold text-white">{summary.rowsSkipped}</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">Требуют разбора: <span className="font-semibold text-white">{summary.rowsNeedingReview}</span></div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-200">Ошибок строк: <span className="font-semibold text-white">{summary.rowsFailed}</span></div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <h3 className="text-base font-semibold text-white sm:text-lg">Как работает импорт</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Поддерживает только Альфа CSV</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Не сохраняет сам CSV-файл</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Пишет операции в `transactions` с защитой от дублей</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Новые merchants складывает в контур ручного разбора</li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white sm:text-xl">История импортов</h3>
          <p className="mt-2 text-sm text-slate-400">Записи читаются из SQLite и показывают, сколько строк импортировалось, пропустилось и ушло на разбор.</p>
        </div>

        <div className="space-y-3 md:hidden">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white break-words">{item.fileName}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.bank} · {item.importedAt}</p>
                </div>
                <span className="shrink-0 text-sm text-slate-300">{item.rows}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
                <span className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">+ {item.imported}</span>
                <span className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">= {item.skipped} дублей</span>
                <span className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">? {item.needsReview}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Файл</th>
                <th className="px-4 py-3 font-medium">Источник</th>
                <th className="px-4 py-3 font-medium">Импортирован</th>
                <th className="px-4 py-3 font-medium">Строк</th>
                <th className="px-4 py-3 font-medium">Импорт</th>
                <th className="px-4 py-3 font-medium">Дубли</th>
                <th className="px-4 py-3 font-medium">Разбор</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{item.fileName}</td>
                  <td className="px-4 py-3 text-slate-400">{item.bank}</td>
                  <td className="px-4 py-3 text-slate-400">{item.importedAt}</td>
                  <td className="px-4 py-3 text-slate-400">{item.rows}</td>
                  <td className="px-4 py-3 text-slate-400">{item.imported}</td>
                  <td className="px-4 py-3 text-slate-400">{item.skipped}</td>
                  <td className="px-4 py-3 text-slate-400">{item.needsReview}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{statusLabels[item.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
