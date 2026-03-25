import type { DashboardData, OperationItem, SubscriptionItem } from "@/lib/finance-data";

function amountClass(item: OperationItem) {
  if (item.type === "income") return "text-emerald-300";
  return "text-rose-300";
}

function summaryValueClass(title: string) {
  if (title === "Расходы за месяц") return "text-rose-300";
  if (title === "Пополнения") return "text-emerald-300";
  if (title === "Подписки в этом месяце") return "text-cyan-300";
  return "text-white";
}

function subscriptionScheduleLabel(subscription: SubscriptionItem) {
  return `${subscription.period === "monthly" ? "Ежемесячно" : "Ежегодно"} · следующее списание ${subscription.nextCharge}`;
}

function isSubscriptionPaid(subscription: SubscriptionItem) {
  const now = new Date();
  const currentDay = now.getUTCDate();
  const currentMonth = now.getUTCMonth() + 1;

  if (subscription.period === "monthly") {
    return currentDay >= subscription.chargeDay;
  }

  const chargeMonth = subscription.chargeMonth ?? 1;
  return currentMonth > chargeMonth || (currentMonth === chargeMonth && currentDay >= subscription.chargeDay);
}

function paymentBadgeClass(subscription: SubscriptionItem) {
  return isSubscriptionPaid(subscription) ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300";
}

function paymentLabel(subscription: SubscriptionItem) {
  return isSubscriptionPaid(subscription) ? "Оплачено" : "Не оплачено";
}

function autoPayBadgeClass(subscription: SubscriptionItem) {
  return subscription.autoPay ? "bg-cyan-400/15 text-cyan-300" : "bg-amber-500/15 text-amber-300";
}

function autoPayLabel(subscription: SubscriptionItem) {
  return subscription.autoPay ? "Автоплатёж" : "Без автоплатежа";
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
            <p className={`mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl ${summaryValueClass(card.title)}`}>{card.value}</p>
            <p className="mt-2 text-xs text-slate-400 sm:text-sm">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr] sm:gap-6">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white sm:text-lg">Последние операции месяца</h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Операции за текущий месяц
            </p>
          </div>

          <div className="space-y-3 md:hidden">
            {data.recentTransactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.merchant}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.date} · {item.categoryIcon ? `${item.categoryIcon} ` : ""}{item.category}</p>
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
                    <td className="px-4 py-3 text-slate-400">{item.categoryIcon ? `${item.categoryIcon} ` : ""}{item.category}</td>
                    <td className={`px-4 py-3 text-right font-medium ${amountClass(item)}`}>{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

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
                  <span className="truncate text-sm text-slate-200 sm:text-base">{category.icon ? `${category.icon} ` : ""}{category.name}</span>
                </div>
                <span className="shrink-0 text-sm font-medium text-white sm:text-base">{category.amount}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-5">
          <div className="border-b border-white/10 pb-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white sm:text-lg">Подписки месяца</h2>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">Сначала подписки, требующие ручного контроля, затем — автоплатёж</p>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <span className="inline-flex items-center rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-300">
                  {data.subscriptions.length} подписок в этом месяце
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
                  {data.manualSubscriptions.length} без автоплатежа
                </span>
              </div>
            </div>
          </div>

          {data.subscriptions.length > 0 ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {data.manualSubscriptions.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white sm:text-base">Требуют внимания</h3>
                      <p className="text-xs text-amber-50/80 sm:text-sm">Подписки без автоплатежа</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.manualSubscriptions.map((subscription) => (
                      <li
                        key={subscription.id}
                        className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate font-medium text-white">{subscription.name}</p>
                          <div className="flex shrink-0 items-center gap-2 text-xs sm:text-sm">
                            <span className="text-amber-50/80">{subscription.nextCharge}</span>
                            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 font-medium text-amber-200">
                              вручную
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Все активные подписки сейчас помечены как автоплатёж.
                </div>
              )}

              {data.subscriptions.some((subscription) => subscription.autoPay) ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white sm:text-base">Автоплатёж</h3>
                      <p className="text-xs text-slate-400 sm:text-sm">Подписки, которые спишутся автоматически</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.subscriptions.filter((subscription) => subscription.autoPay).map((subscription) => (
                      <li
                        key={subscription.id}
                        className="rounded-xl border border-cyan-400/15 bg-slate-950/40 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate font-medium text-white">{subscription.name}</p>
                          <div className="flex shrink-0 items-center gap-2 text-xs sm:text-sm">
                            <span className="text-slate-400">{subscription.nextCharge}</span>
                            <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 font-medium text-cyan-300">
                              авто
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
              В этом месяце регулярных подписок нет.
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
