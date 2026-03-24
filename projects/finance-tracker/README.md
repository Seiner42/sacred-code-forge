# Finance Tracker

Личный финансовый трекер на Next.js + SQLite.

Приложение уже умеет:
- показывать сводку по текущему месяцу;
- хранить и редактировать операции вручную;
- импортировать выписки Альфа CSV;
- отправлять неоднозначные операции в ручной разбор;
- сохранять правила нормализации продавцов;
- вести отдельный список подписок;
- редактировать справочник категорий;
- работать в Docker.

## Реализованные разделы

### Обзор (`/`)
- карточки месяца:
  - расходы;
  - пополнения;
  - количество операций;
  - месячная нагрузка по подпискам;
- последние операции месяца;
- топ категорий;
- краткий блок по подпискам.

### Операции (`/operations`)
- список всех операций из SQLite;
- фильтрация:
  - по месяцу;
  - по произвольному диапазону дат;
  - по типу операции;
  - с возможностью скрыть переводы;
- создание, редактирование и удаление операций.

### Подписки (`/subscriptions`)
- ручной список регулярных списаний;
- месячные и годовые подписки;
- статусы `active` / `paused`;
- создание, редактирование и удаление.

### Импорт (`/imports`)
- загрузка Альфа CSV;
- запись операций в SQLite;
- защита от дублей через `source_row_hash`;
- история импортов;
- статистика по импорту:
  - сколько строк импортировано;
  - сколько пропущено;
  - сколько ушло в разбор;
  - сколько упало с ошибкой.

### Разбор (`/review`)
- список нераспознанных продавцов;
- подтверждение нормализованного имени;
- выбор категории;
- сохранение merchant rule;
- возможность пропустить элемент.

### Справочники (`/admin`)
- просмотр и редактирование категорий;
- имя, slug, цвет, иконка, активность.

## Импорт Альфа CSV

Сейчас поддерживается формат выписки Альфа Банка с колонками вроде:
- `operationDate`
- `merchant`
- `amount`
- `currency`
- `category`
- `mcc`
- `type`
- `comment`

### Что делает импортёр
- читает CSV с `bom: true`;
- нормализует даты и суммы;
- определяет направление операции (`expense` / `income`);
- применяет встроенные правила по известным мерчантам;
- применяет сохранённые пользовательские правила из `merchant_rules`;
- создаёт review items для неоднозначных операций.

### Порядок строк из CSV
Для сохранения порядка строк внутри одного дня используется поле:
- `transactions.source_order`

При импорте каждой строке присваивается порядковый номер в CSV.
Далее выборка операций сортируется так:
- сначала по `operation_date DESC`
- потом по `source_order ASC`

Это позволяет сохранить порядок операций внутри одной даты так, как он был в файле банка.

## Модель данных

Основные таблицы:
- `transactions` — операции;
- `imports` — история импортов;
- `import_review_items` — элементы ручного разбора;
- `merchant_rules` — правила нормализации продавцов;
- `categories` — справочник категорий;
- `subscriptions` — регулярные списания.

### Важные поля `transactions`
- `operation_date`
- `raw_merchant`
- `merchant_normalized`
- `amount`
- `direction`
- `category_id`
- `source_category`
- `mcc`
- `include_in_reports`
- `source_row_hash`
- `source_order`
- `import_id`

## Стек
- Next.js 16
- React 19
- TypeScript
- better-sqlite3
- csv-parse
- Tailwind CSS 4

## Локальный запуск

```bash
npm ci
npm run dev
```

По умолчанию приложение поднимается на:
- `http://localhost:3000`

## Production build

```bash
npm run build
npm run start
```

## Docker

В проекте есть production Dockerfile.

Сборка образа:

```bash
docker build -t finance-tracker-app:latest .
```

Пример запуска:

```bash
docker run -d \
  --name finance-tracker-app \
  --restart unless-stopped \
  -p 3001:3000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  finance-tracker-app:latest
```

## Переменные окружения

Сейчас приложению нужен как минимум:
- `APP_PASSWORD` — пароль для входа в UI.

## Авторизация

Есть простая парольная защита:
- страница входа: `/login`
- API:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`

После успешного входа ставится cookie авторизации.

## API

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH /api/transactions/[id]`
- `DELETE /api/transactions/[id]`

### Subscriptions
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `PATCH /api/subscriptions/[id]`
- `DELETE /api/subscriptions/[id]`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/[id]`

### Imports
- `POST /api/imports/upload`

### Review
- `POST /api/review/[id]/resolve`
- `POST /api/review/[id]/ignore`

## Что важно помнить
- база данных хранится в `data/finance-tracker.db`;
- файл базы не должен коммититься в git;
- порядок строк банка внутри одной даты теперь хранится отдельно через `source_order`;
- импорты защищены от дублей через `source_row_hash`.
