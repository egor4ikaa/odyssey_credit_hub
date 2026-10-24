# Архитектура

## Обзор

Full-stack приложение на TypeScript (Next.js 14 App Router): веб-интерфейс, REST API,
бизнес-логика конвейера и доступ к БД в одном процессе. PostgreSQL — система записи.

```
┌────────────────────────────────────────────────────┐
│                 Next.js (TypeScript)               │
│  Pages (React)  │  API Routes (REST)  │  lib/*    │
│  - лендинг/логин - auth, products                 │
│  - каталог       - applications CRUD              │
│  - мастер заявки - assistant (YandexGPT)          │
│  - карточка      - backoffice (оператор)          │
│    заявки        - submit/accept/decline/update   │
└──────────┬───────────────────────┬────────────────┘
           │                       │
     lib/pipeline.ts         lib/mocks.ts (БКИ, ЕГРЮЛ, ФНС)
     lib/scoring.ts          lib/yandex.ts (YandexGPT + fallback)
     lib/stateMachine.ts
           │
     ┌─────▼─────┐
     │ PostgreSQL │  users, companies, products,
     │  (Prisma)  │  applications, events
     └───────────┘
```

## Ключевые модули

| Модуль | Назначение |
|---|---|
| `lib/stateMachine.ts` | Диаграмма состояний и валидация переходов |
| `lib/pipeline.ts` | Асинхронный кредитный конвейер (проверка → обогащение → скоринг → решение) |
| `lib/scoring.ts` | Правиловая балльная модель с объяснимыми факторами |
| `lib/mocks.ts` | Детерминированные моки БКИ / ЕГРЮЛ / ФНС по ИНН |
| `lib/yandex.ts` | Клиент YandexGPT + офлайн-fallback |
| `app/api/backoffice/*` | Кабинет кредитного специалиста |

## Модель данных (ER)

```
User 1───∞ Application ∞───1 Product
Company 1───∞ Application
Application 1───∞ Event
```

- `Application.status` — состояние в конвейере (enum AppStatus)
- `Application.conditions` — JSON {amount, term, rate, monthlyPayment}
- `Event` — аудит-лог всех шагов конвейера (источник таймлайна для клиента)

## Безопасность

- Пароли: scrypt + соль, константное время сравнения (timingSafeEqual)
- Сессия: HMAC-подписанный httpOnly-cookie (SESSION_SECRET из env)
- Авторизация: проверка роли и владения заявкой на каждом запросе
- Запросы параметризованы через Prisma (защита от SQL-инъекций)

## Отказоустойчивость и масштабирование

- Конвейер выполняется изолированно от HTTP-запроса; ошибка шага логируется в Event
- ИИ-вызовы имеют таймаут и fallback — конвейер не зависит от внешних API
- Stateless-приложение → горизонтальное масштабирование за балансировщиком
- Точки роста: BullMQ для очередей, репликация PostgreSQL, кэш справочников
