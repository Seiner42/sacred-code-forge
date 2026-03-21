import { importHistory } from "@/lib/mock-data";

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

export default function ImportsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] sm:gap-6">
        <article className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/10 p-5 shadow-lg shadow-black/20 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80 sm:text-sm">Импорт</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Загрузка CSV-выписок</h2>
          <p className="mt-3 text-sm leading-6 text-cyan-50/90">
            Здесь будет точка входа для импорта выписок из Альфы и Тинькофф. На текущем этапе это фронтовой макет: зона загрузки, описание сценария и история импортов.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-slate-950/40 px-4 py-8 text-center sm:px-6 sm:py-10">
            <p className="text-base font-medium text-white">Перетащи CSV сюда или выбери файл вручную</p>
            <p className="mt-2 text-sm text-slate-400">
              Поддерживаемые источники: Альфа, Тинькофф
            </p>
            <button className="mt-5 rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
              Выбрать CSV
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
          <h3 className="text-base font-semibold text-white sm:text-lg">Что будет после загрузки</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Файл сохранится как raw-импорт</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Строки CSV будут разобраны в единый формат</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Операции попадут в журнал для фильтрации и анализа</li>
            <li className="rounded-xl bg-slate-950/40 px-4 py-3">Позже сюда добавится экран разбора ошибок и дублей</li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white sm:text-xl">История импортов</h3>
          <p className="mt-2 text-sm text-slate-400">
            Пока это моковые записи, чтобы почувствовать будущий контур работы.
          </p>
        </div>

        <div className="space-y-3 md:hidden">
          {importHistory.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white break-words">{item.fileName}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.bank} · {item.importedAt}</p>
                </div>
                <span className="shrink-0 text-sm text-slate-300">{item.rows}</span>
              </div>
              <div className="mt-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Файл</th>
                <th className="px-4 py-3 font-medium">Банк</th>
                <th className="px-4 py-3 font-medium">Импортирован</th>
                <th className="px-4 py-3 font-medium">Строк</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {importHistory.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-3 font-medium text-white">{item.fileName}</td>
                  <td className="px-4 py-3 text-slate-400">{item.bank}</td>
                  <td className="px-4 py-3 text-slate-400">{item.importedAt}</td>
                  <td className="px-4 py-3 text-slate-400">{item.rows}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                      {statusLabels[item.status]}
                    </span>
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
