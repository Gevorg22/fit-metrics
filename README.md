# fitMetrics

Минималистичный дневник тренировок. Логинишься по одноразовому коду на почту, выбираешь упражнение, записываешь подходы с весом и повторениями — всё сохраняется в базу. История тренировок и динамика веса под рукой.

## Возможности

- **Авторизация по OTP** — вводишь почту, получаешь 6-значный код, вводишь его — готово. Без паролей.
- **Гостевой режим** — можно попробовать приложение без регистрации.
- **Тренировки** — поиск упражнений по названию и группе мышц (грудь, спина, ноги и т.д.), добавление подходов с весом и повторениями, сохранение в базу в реальном времени.
- **История** — последние тренировки на главной с деталями по упражнениям и подходам.
- **Вес** — ввод веса тела за день и график динамики.
- **Профиль** — статистика по тренировкам и личные рекорды.

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | [Next.js 16](https://nextjs.org) (App Router) |
| Язык | TypeScript |
| UI | [Ant Design 6](https://ant.design) |
| Стили | SCSS Modules |
| ORM | [Prisma 6](https://www.prisma.io) |
| БД | PostgreSQL |
| Аутентификация | [NextAuth v5](https://authjs.dev) + кастомный OTP flow |
| Email | [Resend](https://resend.com) |
| Состояние | [Zustand](https://zustand-demo.pmnd.rs) |
| Графики | [Recharts](https://recharts.org) |

## Локальный запуск

### 1. Клонируй репозиторий

```bash
git clone https://github.com/Gevorg22/fitMetrics.git
cd fitMetrics
```

### 2. Установи зависимости

```bash
npm install
```

### 3. Настрой переменные окружения

Скопируй `.env.example` в `.env.local` и заполни:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fitmetrics"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxx"
RESEND_FROM="noreply@yourdomain.com"
```

### 4. Примени схему БД

```bash
npm run db:push
```

### 5. Запусти сервер разработки

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для продакшена |
| `npm run start` | Запуск собранного приложения |
| `npm run db:push` | Применить схему Prisma к БД |
| `npm run db:migrate` | Создать и применить миграцию |
| `npm run db:studio` | Открыть Prisma Studio |
| `npm run lint` | Проверка кода |

## Структура проекта

```
fitMetrics/
├── app/
│   ├── (auth)/          # Страницы авторизации (login, verify-otp)
│   ├── (protected)/     # Защищённые страницы (dashboard, workout, analytics, profile)
│   └── api/             # API routes (otp, workout, weight, sets)
├── components/
│   ├── dashboard/       # Компоненты дашборда (история, вес, график)
│   ├── layout/          # Навигация
│   └── workout/         # Поиск упражнений, форма подходов
├── lib/                 # Утилиты, Prisma client, переводы упражнений
├── prisma/              # Схема БД
├── public/              # Статика (exercises.json с базой упражнений)
├── stores/              # Zustand stores
└── types/               # TypeScript типы
```
