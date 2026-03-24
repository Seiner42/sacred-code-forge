"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import type { SubscriptionItem } from "@/lib/finance-data";

type FormState = {
  name: string;
  period: "monthly" | "yearly";
  amount: string;
  status: "active" | "paused";
  chargeDay: string;
  chargeMonth: string;
};

const periodLabels = { monthly: "Ежемесячно", yearly: "Ежегодно" };
const statusLabels = { active: "Активна", paused: "На паузе" };
const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function statusClass(status: "active" | "paused") {
  return status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/20 text-slate-300";
}

const actionButtonClass = "inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white";

function formFromSubscription(subscription?: SubscriptionItem): FormState {
  if (!subscription) return { name: "", period: "monthly", amount: "", status: "active", chargeDay: "1", chargeMonth: "1" };
  return { name: subscription.name, period: subscription.period, amount: String(subscription.amountValue), status: subscription.status, chargeDay: String(subscription.chargeDay), chargeMonth: String(subscription.chargeMonth ?? 1) };
}

function nextChargeLabel(subscription: SubscriptionItem) {
  if (subscription.period === "monthly") return `каждого ${subscription.chargeDay} числа`;
  return `${subscription.chargeDay} ${months[(subscription.chargeMonth ?? 1) - 1]}`;
}

export function SubscriptionsClient({ initialSubscriptions }: { initialSubscriptions: SubscriptionItem[] }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formFromSubscription());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const monthly = useMemo(() => subscriptions.filter((item) => item.period === "monthly"), [subscriptions]);
  const yearly = useMemo(() => subscriptions.filter((item) => item.period === "yearly"), [subscriptions]);

  function openCreateModal() { setEditingId(null); setForm(formFromSubscription()); setError(""); setIsModalOpen(true); }
  function openEditModal(subscription: SubscriptionItem) { setEditingId(subscription.id); setForm(formFromSubscription(subscription)); setError(""); setIsModalOpen(true); }
  function closeModal() { if (submitting) return; setIsModalOpen(false); setEditingId(null); setForm(formFromSubscription()); setError(""); }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const payload = { name: form.name.trim(), period: form.period, amount: Number(form.amount), status: form.status, chargeDay: Number(form.chargeDay), chargeMonth: form.period === "yearly" ? Number(form.chargeMonth) : null };
      const response = await fetch(editingId ? `/api/subscriptions/${editingId}` : "/api/subscriptions", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { ok: boolean; subscription?: SubscriptionItem; error?: string };
      if (!response.ok || !result.ok || !result.subscription) { setError(result.error ?? "Не удалось сохранить подписку"); return; }
      setSubscriptions((current) => editingId ? current.map((item) => item.id === editingId ? result.subscription! : item) : [result.subscription!, ...current]);
      closeModal();
    } catch { setError("Сбой сохранения. Повтори попытку."); } finally { setSubmitting(false); }
  }

  async function handleDelete(subscription: SubscriptionItem) {
    if (!window.confirm(`Удалить подписку «${subscription.name}»?`)) return;
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, { method: "DELETE" });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) { window.alert(result.error ?? "Не удалось удалить подписку"); return; }
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
    } catch { window.alert("Сбой удаления. Повтори попытку."); }
  }

  return <><div className="space-y-4 sm:space-y-6"><section className="grid gap-3 lg:grid-cols-3 sm:gap-4"><article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><p className="text-sm text-slate-400">Всего подписок</p><p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{subscriptions.length}</p><p className="mt-2 text-xs text-slate-400 sm:text-sm">Ручной список, без автодетекта</p></article><article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><p className="text-sm text-slate-400">Ежемесячные</p><p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{monthly.length}</p><p className="mt-2 text-xs text-slate-400 sm:text-sm">Повторяющиеся платежи по месяцу</p></article><article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><p className="text-sm text-slate-400">Ежегодные</p><p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{yearly.length}</p><p className="mt-2 text-xs text-slate-400 sm:text-sm">Редкие, но заметные списания</p></article></section><section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] sm:gap-6"><article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-white sm:text-2xl">Подписки</h2><p className="mt-2 text-sm text-slate-400">Отдельный ручной список регулярных платежей: ежемесячных и годовых.</p></div><button onClick={openCreateModal} className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">+ Добавить подписку</button></div><div className="space-y-3 md:hidden">{subscriptions.map((subscription) => <article key={subscription.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-white">{subscription.name}</p><p className="mt-1 text-xs text-slate-400">{periodLabels[subscription.period]} · {nextChargeLabel(subscription)}</p></div><span className="shrink-0 text-sm font-medium text-cyan-300">{subscription.amount}</span></div><div className="mt-3 flex items-center justify-between gap-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(subscription.status)}`}>{statusLabels[subscription.status]}</span><div className="flex gap-2"><button onClick={() => openEditModal(subscription)} className={actionButtonClass}>✏️</button><button onClick={() => handleDelete(subscription)} className={actionButtonClass}>🗑️</button></div></div></article>)}</div><div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block"><table className="min-w-full divide-y divide-white/10 text-sm"><thead className="bg-white/5 text-left text-slate-400"><tr><th className="px-4 py-3 font-medium">Название</th><th className="px-4 py-3 font-medium">Период</th><th className="px-4 py-3 font-medium">Списание</th><th className="px-4 py-3 font-medium">Статус</th><th className="px-4 py-3 font-medium text-right">Сумма</th><th className="px-4 py-3 font-medium text-right">Действия</th></tr></thead><tbody className="divide-y divide-white/10">{subscriptions.map((subscription) => <tr key={subscription.id} className="text-slate-200"><td className="px-4 py-3 font-medium text-white">{subscription.name}</td><td className="px-4 py-3 text-slate-400">{periodLabels[subscription.period]}</td><td className="px-4 py-3 text-slate-400">{nextChargeLabel(subscription)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(subscription.status)}`}>{statusLabels[subscription.status]}</span></td><td className="px-4 py-3 text-right font-medium text-cyan-300 whitespace-nowrap">{subscription.amount}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => openEditModal(subscription)} className={actionButtonClass}>✏️ Изменить</button><button onClick={() => handleDelete(subscription)} className={actionButtonClass}>🗑️ Удалить</button></div></td></tr>)}</tbody></table></div></article><div className="space-y-4 sm:space-y-6"><article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6"><h3 className="text-base font-semibold text-white sm:text-lg">Что здесь будет дальше</h3><ul className="mt-4 space-y-3 text-sm text-slate-300"><li className="rounded-xl bg-slate-950/40 px-4 py-3">Ручное добавление и редактирование подписок</li><li className="rounded-xl bg-slate-950/40 px-4 py-3">Отдельное разделение на месячные и годовые</li><li className="rounded-xl bg-slate-950/40 px-4 py-3">Привязка подписок к операциям после импорта CSV</li><li className="rounded-xl bg-slate-950/40 px-4 py-3">Показывать общую регулярную нагрузку на месяц</li></ul></article><article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-lg shadow-black/20 sm:p-6"><p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">MVP note</p><p className="mt-3 text-sm leading-6 text-cyan-50/90">На первом этапе этот список ведётся вручную. Автоматическое распознавание recurring-платежей можно будет добавить позже, если механизм действительно понадобится.</p></article></div></section></div>{isModalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Подписка</p><h3 className="mt-2 text-xl font-semibold text-white">{editingId ? "Изменить подписку" : "Новая подписка"}</h3></div><button onClick={closeModal} className={actionButtonClass} aria-label="Закрыть">✕</button></div><form onSubmit={submitForm} className="mt-5 space-y-4"><label className="block"><span className="mb-2 block text-sm text-slate-300">Название</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" placeholder="Например, Yandex Plus" required /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm text-slate-300">Период</span><select value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: event.target.value as FormState['period'] }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"><option value="monthly">Ежемесячно</option><option value="yearly">Ежегодно</option></select></label><label className="block"><span className="mb-2 block text-sm text-slate-300">Сумма, ₽</span><input type="number" min="0" step="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" placeholder="499" required /></label></div>{form.period === "monthly" ? <label className="block"><span className="mb-2 block text-sm text-slate-300">День списания</span><input type="number" min="1" max="31" value={form.chargeDay} onChange={(event) => setForm((current) => ({ ...current, chargeDay: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" required /></label> : <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm text-slate-300">День списания</span><input type="number" min="1" max="31" value={form.chargeDay} onChange={(event) => setForm((current) => ({ ...current, chargeDay: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60" required /></label><label className="block"><span className="mb-2 block text-sm text-slate-300">Месяц списания</span><select value={form.chargeMonth} onChange={(event) => setForm((current) => ({ ...current, chargeMonth: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60">{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label></div>}<label className="block"><span className="mb-2 block text-sm text-slate-300">Статус</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as FormState['status'] }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60"><option value="active">Активна</option><option value="paused">На паузе</option></select></label>{error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}<div className="flex gap-3"><button type="button" onClick={closeModal} className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white">Отмена</button><button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Сохраняю..." : editingId ? "Сохранить" : "Добавить"}</button></div></form></div></div> : null}</>;
}
