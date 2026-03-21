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

const actionButtonClass =
  "inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white";

export default function SubscriptionsPage() {
  const monthly = subscriptions.filter((item) => item.period === "monthly");
  const yearly = subscriptions.filter((item) => item.period === "yearly");

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-3 lg:grid-cols-3 sm:gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <p className="text-sm text-slate-400">Всего подписок</p>
          <p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{subscriptions.length}</p>
          <p className="mt-2 text-xs text-slate-400 sm:text-sm">Ручной список, без автодетекта</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <p className="text-sm text-slate-400">Ежемесячные</p>
          <p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{monthly.length}</p>
          <p className="mt-2 text-xs text-slate-400 sm:text-sm">Повторяющиеся платежи по месяцу</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <p className="text-sm text-slate-400">Ежегодные</p>
          <p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{yearly.length}</p>
          <p className="mt-2 text-xs text-slate-400 sm:text-sm">Редкие, но заметные списания</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] sm:gap-6">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Подписки</h2>
              <p className="mt-2 text-sm text-slate-400">
                Отдельный ручной список регулярных платежей: ежемесячных и годовых.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
              + Добавить подписку
            </button>
          </div>

          <div className="space-y-3 md:hidden">
            {subscriptions.map((subscription) => (
              <article key={subscription.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{subscription.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{periodLabels[subscription.period]} · {subscription.nextCharge}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-cyan-300">{subscription.amount}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(subscription.status)}`}>
                    {statusLabels[subscription.status]}
                  </span>
                  <div className="flex gap-2">
                    <button className={actionButtonClass} aria-label={`Изменить ${subscription.name}`}>
                      ✏️
                    </button>
                    <button className={actionButtonClass} aria-label={`Удалить ${subscription.name}`}>
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Название</th>
                  <th className="px-4 py-3 font-medium">Период</th>
                  <th className="px-4 py-3 font-medium">Следующее списание</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Сумма</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button className={actionButtonClass} aria-label={`Изменить ${subscription.name}`}>
                          ✏️ Изменить
                        </button>
                        <button className={actionButtonClass} aria-label={`Удалить ${subscription.name}`}>
                          🗑️ Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4 sm:space-y-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
            <h3 className="text-base font-semibold text-white sm:text-lg">Что здесь будет дальше</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Ручное добавление и редактирование подписок</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Отдельное разделение на месячные и годовые</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Привязка подписок к операциям после импорта CSV</li>
              <li className="rounded-xl bg-slate-950/40 px-4 py-3">Показывать общую регулярную нагрузку на месяц</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-lg shadow-black/20 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">MVP note</p>
            <p className="mt-3 text-sm leading-6 text-cyan-50/90">
              На первом этапе этот список ведётся вручную. Автоматическое распознавание recurring-платежей можно будет добавить позже, если механизм действительно понадобится.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
