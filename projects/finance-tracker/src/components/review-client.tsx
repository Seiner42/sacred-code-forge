"use client";

import { useState } from "react";
import type { CategoryOption, ReviewItem } from "@/lib/finance-data";

type FormState = {
  merchantNormalized: string;
  categoryId: string;
  matchType: "exact" | "contains";
};

export function ReviewClient({ initialItems, categories }: { initialItems: ReviewItem[]; categories: CategoryOption[] }) {
  const [items, setItems] = useState(initialItems);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [forms, setForms] = useState<Record<string, FormState>>(() => Object.fromEntries(initialItems.map((item) => [item.id, { merchantNormalized: item.suggestedMerchantNormalized, categoryId: item.suggestedCategoryId ?? categories.find((category) => category.slug === "other")?.id ?? "", matchType: "contains" }])));

  async function handleResolve(item: ReviewItem) {
    const form = forms[item.id];
    setSavingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/review/${item.id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchantNormalized: form.merchantNormalized, categoryId: form.categoryId || null, matchType: form.matchType }) });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Не удалось сохранить правило");
        return;
      }
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch {
      setError("Сбой сохранения правила. Повтори попытку.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleIgnore(item: ReviewItem) {
    setSavingId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/review/${item.id}/ignore`, { method: "POST" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "Не удалось пропустить паттерн");
        return;
      }
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch {
      setError("Сбой при пропуске. Повтори попытку.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-lg shadow-black/20 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">Разбор</p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Новые продавцы из импорта</h2>
        <p className="mt-3 text-sm leading-6 text-cyan-50/90">Здесь появляются операции, которые система не смогла уверенно распознать. Для каждой карточки достаточно: проверить название, выбрать категорию и сохранить правило — тогда похожие операции будут разбираться автоматически.</p>
      </section>
      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
      {items.length === 0 ? <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-lg shadow-black/20">Новых продавцов для разбора нет. Контур чист.</section> : <section className="space-y-4">{items.map((item) => { const form = forms[item.id]; return <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><div className="flex flex-col gap-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Как пришло из банка</p><h3 className="mt-1 text-lg font-semibold text-white">{item.rawMerchant}</h3><p className="mt-2 text-sm text-slate-400">Категория банка: {item.sourceCategory ?? "—"} · MCC: {item.mcc ?? "—"} · Встретился: {item.sampleCount} раз</p></div><span className="inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">Нужно решение</span></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-sm font-medium text-white">Что сделать</p><ol className="mt-3 space-y-2 text-sm text-slate-300"><li>1. Проверь, как назвать продавца.</li><li>2. Выбери правильную категорию.</li><li>3. Сохрани правило, чтобы дальше всё разбиралось автоматически.</li></ol></div><div className="grid gap-4 lg:grid-cols-2"><label className="block"><span className="mb-2 block text-sm text-slate-300">Как назвать продавца</span><input value={form.merchantNormalized} onChange={(event) => setForms((current) => ({ ...current, [item.id]: { ...current[item.id], merchantNormalized: event.target.value } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" placeholder="Например, Yandex Plus" /></label><label className="block"><span className="mb-2 block text-sm text-slate-300">Категория</span><select value={form.categoryId} onChange={(event) => setForms((current) => ({ ...current, [item.id]: { ...current[item.id], categoryId: event.target.value } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block lg:col-span-2"><span className="mb-2 block text-sm text-slate-300">Как распознавать дальше</span><select value={form.matchType} onChange={(event) => setForms((current) => ({ ...current, [item.id]: { ...current[item.id], matchType: event.target.value as FormState["matchType"] } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"><option value="contains">Если содержит этот текст</option><option value="exact">Только точное совпадение</option></select></label></div><div className="flex flex-col gap-3 sm:flex-row"><button onClick={() => handleResolve(item)} disabled={savingId === item.id} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{savingId === item.id ? "Сохраняю..." : "Сохранить правило"}</button><button onClick={() => handleIgnore(item)} disabled={savingId === item.id} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">Пропустить пока</button></div></div></article>; })}</section>}
    </div>
  );
}
