import { recentTransactions, subscriptions, summaryCards, topCategories } from "@/lib/mock-data";

function StatusBadge({ status }: { status: "done" | "pending" }) {
  const isPending = status === "pending";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isPending
          ? "bg-amber-500/15 text-amber-300"
          : "bg-emerald-500/15 text-emerald-300"
      }`}
    >
      {isPending ? "В обработке" : "Проведено"}
    </span>
  );
}

export function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20"
          >
            <p className="text-sm text-slate-400">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-sm text-slate-400">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Последние операции</h2>
              <p className="text-sm text-slate-400">
                Моковые данные для первого прохода по интерфейсу
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Операция</th>
                  <th className="px-4 py-3 font-medium">Категория</th>
                  <th className="px-4 py-3 font-medium">Сумма</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentTransactions.map((item) => (
                  <tr key={item.id} className="text-slate-200">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">{item.merchant}</td>
                    <td className="px-4 py-3 text-slate-400">{item.category}</td>
                    <td className="px-4 py-3 font-medium text-white">{item.amount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
            <h2 className="text-lg font-semibold text-white">Топ категорий</h2>
            <ul className="mt-4 space-y-3">
              {topCategories.map((category, index) => (
                <li
                  key={category.name}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="text-slate-200">{category.name}</span>
                  </div>
                  <span className="font-medium text-white">{category.amount}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Подписки</h2>
                <p className="text-sm text-slate-400">Отдельный ручной список</p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
                {subscriptions.length} шт.
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {subscriptions.slice(0, 3).map((subscription) => (
                <li
                  key={subscription.id}
                  className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{subscription.name}</p>
                      <p className="text-sm text-slate-400">
                        {subscription.period === "monthly" ? "Ежемесячно" : "Ежегодно"} · следующее списание {subscription.nextCharge}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-cyan-300">
                      {subscription.amount}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
