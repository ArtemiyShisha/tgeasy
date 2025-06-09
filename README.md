# TGeasy - Автоматизация рекламных кампаний в Telegram

SaaS-решение для админов телеграм-каналов, автоматизирующее управление рекламными размещениями, маркировку контента и сбор аналитики. **Проект полностью спроектирован для AI-first разработки** с готовыми промптами для каждой задачи.

## 🚀 Технологический стек

### Frontend & AI-генерация UI
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - типизированный JavaScript  
- **Tailwind CSS** - utility-first CSS фреймворк
- **shadcn/ui** - современные UI компоненты
- **21st.dev MCP** - AI-генерация UI компонентов ⭐

### Backend & Database
- **Vercel** - serverless функции и деплой
- **Supabase** - PostgreSQL, аутентификация, файловое хранилище
- **Telegram Bot API** - интеграция с Telegram для постинга и аналитики
- **ОРД Яндекса API** - автоматическая маркировка рекламы
- **ЮКасса API** - прием платежей

### AI-инструменты разработки
- **21st.dev MCP** - автоматическая генерация UI компонентов
- **Cursor/Windsurf** - AI-инструменты разработки
- **45 готовых промптов** - для каждой задачи разработки
- **AI-first архитектура** - модульная структура для AI

## 🤖 AI-First подход разработки

Проект полностью спроектирован для разработки с AI-инструментами:

### 🎨 21st.dev MCP интеграция
- **Автоматическая генерация UI** на основе детальных требований
- **Consistent design system** через MCP конфигурацию
- **Быстрое прототипирование** интерфейсов
- **Modern SaaS дизайн** с темной/светлой темой

### 📋 45 готовых задач с промптами
- **Поэтапная разработка** от инфраструктуры до деплоя
- **Атомарные задачи** по 30-120 минут каждая
- **Готовые промпты** для копирования в Cursor/Windsurf
- **Минимальные зависимости** между задачами

### 🏗️ 10 этапов разработки
1. **Инфраструктура** (задачи 1-6) - Next.js, Supabase, MCP
2. **Аутентификация** (задачи 7-10) - Telegram OAuth + UI через MCP
3. **Управление каналами** (задачи 11-14) - Backend + UI через MCP
4. **Договоры** (задачи 15-17) - File management + UI через MCP
5. **Рекламные размещения** (задачи 18-22) - Core функциональность + UI
6. **Интеграции** (задачи 23-26) - ОРД, Telegram Bot, автопостинг
7. **Аналитика** (задачи 27-30) - Метрики + дашборды через MCP
8. **Платежная система** (задачи 31-34) - ЮКасса + UI через MCP
9. **Уведомления** (задачи 35-38) - Telegram + email уведомления
10. **Финальная полировка** (задачи 39-46) - тестирование, деплой

## 🏗️ Архитектура

```
├── frontend (Next.js + MCP)
│   ├── app/                    # App Router pages
│   ├── components/            # UI компоненты (MCP-генерируемые)
│   ├── lib/                   # Утилиты и конфигурация
│   ├── hooks/                 # React хуки
│   └── types/                 # TypeScript типы
├── api/                       # Vercel serverless функции
├── database/                  # Supabase схемы и миграции
├── integrations/             # Внешние API (ОРД, Telegram, ЮКасса)
├── .cursor/rules/            # Правила для AI-инструментов
├── docs/ui-requirements/     # Требования для MCP генерации
├── configs/                   # MCP и другие конфигурации
└── schemas/                   # База данных схемы
```

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+
- npm или yarn
- Аккаунт Supabase
- Аккаунт Vercel
- Telegram Bot Token
- Доступ к ОРД Яндекса API
- Аккаунт ЮКасса
- **21st.dev MCP** настроенный в IDE ⭐

### Установка

1. **Клонируйте и настройте проект**
```bash
git clone <repository-url>
cd tgeasy
npm install
```

2. **Настройте 21st.dev MCP** ⭐
```bash
# Настройте MCP в вашей IDE (Cursor/Windsurf)
# Скопируйте configs/mcp-config.json
# Настройте design system и компоненты
```

3. **Настройте переменные окружения**
```bash
cp .env.example .env.local
# Заполните все необходимые API ключи включая MCP
```

4. **Настройте Supabase**
```bash
npx supabase init
npx supabase start
npx supabase db reset
```

5. **Запустите development сервер**
```bash
npm run dev
```

## 📁 Структура проекта (AI-оптимизированная)

```
tgeasy/
├── app/
│   ├── (auth)/                # Группа авторизации
│   │   ├── login/page.tsx     # MCP-генерируемая страница
│   │   └── callback/page.tsx  # MCP-генерируемая страница
│   ├── (dashboard)/           # Основной дашборд
│   │   ├── page.tsx          # Главная (MCP)
│   │   ├── channels/         # Управление каналами (MCP)
│   │   ├── posts/            # Размещения (MCP)
│   │   ├── contracts/        # Договоры (MCP)
│   │   ├── analytics/        # Аналитика (MCP)
│   │   ├── payments/         # Платежи (MCP)
│   │   └── settings/         # Настройки (MCP)
│   └── public-stats/         # Публичные ссылки
├── components/
│   ├── ui/                   # shadcn/ui базовые компоненты
│   ├── auth/                 # MCP-генерируемые auth компоненты
│   ├── dashboard/            # MCP-генерируемые dashboard компоненты
│   ├── channels/             # MCP-генерируемые channel компоненты
│   ├── posts/                # MCP-генерируемые post компоненты
│   ├── contracts/            # MCP-генерируемые contract компоненты
│   ├── analytics/            # MCP-генерируемые analytics компоненты
│   └── payments/             # MCP-генерируемые payment компоненты
├── lib/
│   ├── supabase/             # Supabase клиент
│   ├── telegram/             # Telegram Bot API
│   ├── ord/                  # ОРД Яндекса API
│   ├── yookassa/             # ЮКасса API
│   └── utils/                # Утилиты
├── api/
│   ├── auth/                 # Авторизация через Telegram
│   ├── channels/             # API каналов
│   ├── posts/                # API размещений
│   ├── contracts/            # API договоров
│   ├── analytics/            # API аналитики
│   ├── payments/             # Платежные операции
│   └── webhooks/             # Webhooks (Telegram, ЮКасса)
├── .cursor/rules/            # Правила для AI-инструментов
│   ├── architecture.mdc      # Архитектурные правила
│   └── coding-standards.mdc  # Стандарты кода
├── docs/ui-requirements/     # Требования для MCP генерации
│   ├── auth.md              # UI требования для авторизации
│   ├── channels.md          # UI требования для каналов
│   ├── posts.md             # UI требования для размещений
│   ├── analytics.md         # UI требования для аналитики
│   └── payments.md          # UI требования для платежей
├── configs/                  # Конфигурации
│   ├── mcp-config.json      # Основная конфигурация MCP
│   ├── mcp-auth.json        # MCP конфиг для auth
│   ├── mcp-channels.json    # MCP конфиг для каналов
│   └── performance-config.ts # Performance настройки
├── types/
│   ├── database.ts          # Типы БД
│   ├── api.ts               # API типы
│   ├── integrations.ts      # Типы интеграций
│   └── mcp-components.ts    # Типы MCP компонентов
└── schemas/
    └── database.sql         # Схема базы данных
```

## 🔧 Конфигурация

### Переменные окружения

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# ОРД Яндекса
ORD_API_KEY=your_ord_api_key
ORD_CLIENT_ID=your_ord_client_id

# ЮКасса
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_WEBHOOK_SECRET=your_webhook_secret

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# 21st.dev MCP ⭐
MCP_API_KEY=your_mcp_api_key
MCP_PROJECT_ID=your_mcp_project_id
```

### 21st.dev MCP базовая конфигурация

```json
{
  "designSystem": "tailwind-shadcn",
  "componentLibrary": "shadcn/ui",
  "theme": "modern-saas",
  "colorScheme": "light-dark",
  "responsiveBreakpoints": ["mobile", "tablet", "desktop"],
  "accessibilityLevel": "WCAG-AA",
  "animations": "subtle",
  "performanceMode": "optimized"
}
```

## 📊 Основные модули

### 1. Аутентификация через Telegram
- OAuth 2.0 интеграция с Telegram
- JWT токены через Supabase Auth
- Middleware для защищенных маршрутов
- **UI генерируется через MCP** с modern дизайном

### 2. Управление каналами
- Подключение множественных Telegram каналов
- Роли: владелец канала, админ канала
- Мониторинг статуса каналов через Bot API
- **Dashboard UI через MCP** с real-time статусами

### 3. Рекламные размещения (упрощенная модель)
- Единая форма создания размещений (вместо отдельных кампаний/креативов)
- Автоматическая маркировка через ОРД Яндекса
- Планирование публикаций через Telegram Bot API
- **Intuitive UI через MCP** с drag-n-drop и preview

### 4. Аналитика
- Сбор метрик через Telegram Bot API (каждые 15 минут)
- **Дашборды с визуализацией через MCP**
- Экспорт отчетов в Excel
- Публичные ссылки для рекламодателей

### 5. Платежная система
- Подписочная модель через ЮКасса
- Тарифные планы: Базовый (3490₽), Профессиональный (6990₽), Корпоративный (12990₽)
- Автоматическое продление подписок
- **Payment UI через MCP** с secure дизайном

## 🏗️ 10 этапов разработки

### 🏗️ Этап 1: Инфраструктура (Задачи 1-6)
- Next.js проект с TypeScript и Tailwind
- Supabase база данных с RLS
- Docker окружение для разработки
- **21st.dev MCP настройка и конфигурация** ⭐

### 🔐 Этап 2: Аутентификация (Задачи 7-10)
- Telegram OAuth интеграция
- Middleware для защищенных маршрутов
- **UI авторизации через MCP генерацию**
- Система ролей и разрешений

### 📺 Этап 3: Управление каналами (Задачи 11-14)
- Telegram Bot API сервис
- Backend управления каналами с правами доступа
- API интеграция для frontend
- **UI управления каналами через MCP**

### 📋 Этап 4: Договоры (Задачи 15-17)
- Backend управления договорами
- File upload система (PDF/DOC)
- API интеграция с hooks
- **UI управления договорами через MCP**

### 🎯 Этап 5: Рекламные размещения (Задачи 18-22)
- Backend модель размещений (упрощенная от campaigns)
- API рекламных размещений с CRUD
- API интеграция для frontend
- **UI создания и управления размещениями через MCP**

### 🔗 Этап 6: Интеграции (Задачи 23-26)
- ОРД Яндекса базовая интеграция и автоматическая маркировка
- Telegram Bot API публикация и планирование
- Webhook система и мониторинг интеграций

### 📊 Этап 7: Аналитика (Задачи 27-30)
- Backend аналитики через Telegram API
- Экспорт Excel и публичные ссылки
- API интеграция аналитики
- **UI аналитики и дашбордов через MCP**

### 💰 Этап 8: Платежная система (Задачи 31-34)
- Backend платежной системы с ЮКасса
- Webhook обработка и документы
- API интеграция платежей
- **UI платежей и подписок через MCP**

### 🔔 Этап 9: Уведомления (Задачи 35-38)
- Backend уведомлений (Telegram + email)
- Настройки уведомлений
- API интеграция уведомлений
- **UI настроек уведомлений через MCP**

### 🎨 Этап 10: Финальная полировка (Задачи 39-46)
- Оптимизация производительности
- Comprehensive тестирование
- Security audit и hardening
- Production deployment
- Documentation и onboarding
- MVP launch preparation
- Post-launch мониторинг

## 🎯 Готовые промпты для AI-разработки

В файле [todo.md](./todo.md) содержится **45 детальных задач** с готовыми промптами для Cursor/Windsurf:

### Как использовать:
1. **Откройте файл todo.md** и найдите нужную задачу
2. **Скопируйте готовый промпт** из раздела "Промпт для Cursor/Windsurf"
3. **Вставьте в Cursor/Windsurf** и выполните задачу
4. **Следуйте последовательности** этапов (1→2→3→...→10)

### Пример промпта:
```
Создать базовую настройку Next.js 14 проекта с TypeScript, Tailwind CSS и shadcn/ui.

Создать файлы:
- package.json с зависимостями
- next.config.js с оптимизацией
- tailwind.config.js с shadcn/ui
- tsconfig.json в строгом режиме
- .env.example с переменными
- components.json для shadcn/ui

Технические требования:
- Next.js 14 с App Router
- TypeScript strict mode
- Tailwind CSS с shadcn/ui integration
- Поддержка абсолютных импортов
- ESLint и Prettier настройка
```

### Преимущества готовых промптов:
- ⚡ **Быстрый старт** - сразу начинайте разработку
- 🎯 **Конкретные задачи** - четкий список файлов для создания
- 🔗 **Минимальные зависимости** - задачи можно выполнять почти независимо
- 🤖 **AI-оптимизированы** - промпты протестированы с Cursor/Windsurf

## 🎯 Целевые метрики

### Масштабирование
- **Старт**: 10 пользователей, 200 размещений/месяц
- **Цель через год**: 100 пользователей, 2500 размещений/месяц

### Производительность
- Response time API < 500ms
- Uptime > 99.5%
- Время загрузки страниц < 2s
- **MCP UI generation < 30s** ⭐

### Development метрики
- **Время разработки**: 45 задач × 60 минут = ~45 часов
- **AI assistance**: 80%+ кода через AI-инструменты
- **UI generation**: 100% через MCP
- **Manual coding**: <20% (только бизнес-логика)

## 🚀 Деплой

### Vercel (рекомендуется)
```bash
npm install -g vercel
vercel --prod
```

### Supabase production
```bash
npx supabase db push
npx supabase functions deploy
```

### Environment variables
Убедитесь, что все переменные из `.env.example` настроены в production, включая MCP API ключи.

## 📚 Документация

- [Архитектура](./architecture.md) - детальное описание архитектуры с MCP интеграцией
- [PRD](./prd.md) - продуктовые требования и пользовательские сценарии
- [Цели проекта](./goals.md) - бизнес-цели и технические метрики
- [Задачи разработки](./todo.md) - **45 задач с готовыми промптами** ⭐

## 🔗 Полезные ссылки

### Основные технологии
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [21st.dev MCP](https://21st.dev/) - **AI UI генерация** ⭐
- [shadcn/ui](https://ui.shadcn.com/) - компоненты

### Интеграции
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [ОРД Яндекса API](https://ord.yandex.ru/)
- [ЮКасса API](https://yookassa.ru/developers)

### AI-инструменты
- [Cursor IDE](https://cursor.sh/) - **AI-первый редактор** ⭐
- [Windsurf](https://windsurf.ai/) - **AI coding assistant** ⭐

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

---

## 🚀 Готовы начать разработку с AI?

1. **Настройте 21st.dev MCP** в своей IDE
2. **Откройте todo.md** и найдите Задачу 1
3. **Скопируйте готовый промпт** и вставьте в Cursor/Windsurf
4. **Начинайте разработку** поэтапно

**TGeasy будет готов к MVP через ~45 часов разработки с AI! 🚀**