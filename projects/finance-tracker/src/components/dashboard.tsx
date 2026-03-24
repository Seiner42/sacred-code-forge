import type { DashboardData, OperationItem } from "@/lib/finance-data";

function amountClass(item: OperationItem) {
  if (item.type === "income") return "text-emerald-300";
  if (item.type === "transfer") return "text-cyan-300";
  return "text-rose-300";
}

export function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 shadow-lg shadow-black/20 sm:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">
          Сводка
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          {data.monthLabel}
        </h2>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {data.summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5"
          >
            <p className="text-xs text-slate-400 sm:text-sm">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold text-white sm:mt-3 sm:text-3xl">{card.value}</p>
            <p className="mt-2 text-xs text-slate-400 sm:text-sm">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] sm:gap-6">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white sm:text-lg">Последние операции месяца</h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Живые данные из SQLite-контурa текущего рабочего месяца
            </p>
          </div>

          <div className="space-y-3 md:hidden">
            {data.recentTransactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.merchant}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.date} · {item.category}</p>
                  </div>
                  <span className={`text-sm font-medium ${amountClass(item)}`}>{item.amount}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-white/10 md:block">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Операция</th>
                  <th className="px-4 py-3 font-medium">Категория</th>
                  <th className="px-4 py-3 font-medium text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.recentTransactions.map((item) => (
                  <tr key={item.id} className="text-slate-200">
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">{item.merchant}</td>
                    <td className="px-4 py-3 text-slate-400">{item.category}</td>
                    <td className={`px-4 py-3 text-right font-medium ${amountClass(item)}`}>{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4 sm:space-y-6">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5">
            <h2 className="text-base font-semibold text-white sm:text-lg">Топ категорий месяца</h2>
            <ul className="mt-4 space-y-3">
              {data.topCategories.map((category, index) => (
                <li
                  key={category.name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-3 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm text-slate-200 sm:text-base">{category.name}</span>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-white sm:text-base">{category.amount}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white sm:text-lg">Подписки месяца</h2>
                <p className="text-xs text-slate-400 sm:text-sm">Регулярная нагрузка в текущем периоде</p>
              </div>
              <span className="shrink-0 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
                {data.subscriptions.length} шт.
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {data.subscriptions.map((subscription) => (
                <li
                  key={subscription.id}
                  className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{subscription.name}</p>
                      <p className="text-xs text-slate-400 sm:text-sm">
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
