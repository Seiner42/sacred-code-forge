import { subscriptions } from "@/lib/mock-data";

const periodLabels = {
  monthly: "Ежемесячно",
  yearly: "Ежегодно",
};

const statusLabels = {
  active: "Активна",
  paused: "На паузе",
};

function statusClass(status: "active" | "paused") {
  return status === "active"
    ? "bg-emerald-500/15 text-emerald-300"
    : "bg-slate-500/20 text-slate-300";
}

export default function SubscriptionsPage() {
  const monthly = subscriptions.filter((item) => item.period === "monthly");
  const yearly = subscriptions.filter((item) => item.period === "yearly");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-400">Всего подписок</p>
          <p className="mt-3 text-3xl font-semibold text-white">{subscriptions.length}</p>
          <p className="mt-2 text-sm text-slate-400">Ручной список, без автодетекта</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-400">Ежемесячные</p>
          <p className="mt-3 text-3xl font-semibold text-white">{monthly.length}</p>
          <p className="mt-2 text-sm text-slate-400">Повторяющиеся платежи по месяцу</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <p className="text-sm text-slate-400">Ежегодные</p>
          <p className="mt-3 text-3xl font-semibold text-white">{yearly.length}</p>
          <p className="mt-2 text-sm text-slate-400">Редкие, но заметные списания</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
            <p className="mt-2 text-slate-400">
              Отдельный ручной список регулярных платежей: ежемесячных и годовых.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium">Период</th>
                  <th className="px-4 py-3 font-medium">Следующее списание</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="text-slate-200">
                    <td className="px-4 py-3 font-medium text-white">{subscription.name}</td>
                    <td className="px-4 py-3 text-slate-400">{periodLabels[subscription.period]}</td>
                    <td className="px-4 py-3 text-slate-400">{subscription.nextCharge}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(subscription.status)}`}>
                        {statusLabels[subscription.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-cyan-300 whitespace-nowrap">
                      {subscription.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <h3 className="text-lg font-semibold text-white">Что здесь будет дальше</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Ручное добавление и редактирование подписок</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Отдельное разделение на месячные и годовые</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Привязка подписок к операциям после импорта CSV</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Показывать общую регулярную нагрузку на месяц</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-lg shadow-black/20">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">MVP note</p>
            <p className="mt-3 text-sm leading-6 text-cyan-50/90">
              На первом этапе этот список ведётся вручную. Автоматическое распознавание recurring-платежей можно будет добавить позже, если механизм действительно понадобится.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
