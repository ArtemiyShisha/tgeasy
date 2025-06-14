# Задачи разработки TGeasy

## ⚠️ ВАЖНО ДЛЯ АГЕНТОВ: Serverless проект с MCP

**TGeasy - serverless проект с нативной разработкой!**

### Supabase через MCP интеграцию:
- ✅ **Схема БД**: `schemas/database.sql`
- ✅ **Клиенты**: `lib/supabase/`
- ❌ **НЕТ**: `supabase/migrations/`, локального CLI
- 📖 **Подробнее**: [docs/supabase-mcp-guide.md](./docs/supabase-mcp-guide.md)

### Тестирование через Vercel Preview:
- ✅ **Preview Deployments**: настроены для автоматического деплоя
- ✅ **Telegram OAuth тестирование**: через HTTPS URL
- ❌ **НЕТ локального туннелирования**: ngrok/localtunnel не используем
- 📖 **Подробнее**: [docs/vercel-preview-setup.md](./docs/vercel-preview-setup.md)

## Обзор разработки

### Подход к разработке
Проект разрабатывается поэтапно с использованием AI-инструментов (Cursor/Windsurf). Каждая задача спроектирована как атомарная единица работы, выполнимая за одну сессию с AI (30-90 минут).

### Принципы задач
- **Атомарность**: каждая задача независима и завершена
- **Конкретность**: точный список создаваемых файлов
- **Последовательность**: минимальные зависимости между задачами
- **AI-готовность**: четкие технические требования для промптов

### Технологический стек
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, **21st.dev MCP**
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Интеграции**: Telegram Bot API, ОРД Яндекса, ЮКасса

## Общий план этапов

### 🏗️ Этап 1: Инфраструктура (Задачи 1-6)
Базовая настройка проекта, база данных через MCP, нативная разработка, MCP настройка

### 🔐 Этап 2: Аутентификация (Задачи 7-10)
Telegram OAuth, Supabase Auth, защищенные маршруты, UI через MCP

### 📺 Этап 3: Управление каналами (Задачи 11-14)
Подключение Telegram каналов, права доступа, UI через MCP

### 📋 Этап 4: Договоры (Задачи 15-17)
Управление договорами с рекламодателями, UI интеграция

### 🎯 Этап 5: Рекламные размещения (Задачи 18-22)
Создание размещений, контент, медиафайлы, UI

### 🔗 Этап 6: Интеграции (Задачи 23-26)
ОРД Яндекса, Telegram Bot API, автопостинг

### 📊 Этап 7: Аналитика (Задачи 27-30)
Сбор метрик, дашборды, экспорт данных

### 💰 Этап 8: Платежная система (Задачи 31-34)
ЮКасса интеграция, подписки, тарифы

### 🔔 Этап 9: Уведомления (Задачи 35-38)
Telegram и email уведомления

### 🎨 Этап 10: Финальная полировка (Задачи 39-46)
Тестирование, оптимизация, деплой

---

## ЭТАП 1: ИНФРАСТРУКТУРА

### Задача 1: Инициализация Next.js проекта ✅ ЗАВЕРШЕНО

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Нет  
**Время**: 30 минут  

**Файлы для создания**:
- `package.json`
- `next.config.js`
- `tailwind.config.js`
- `tsconfig.json`
- `.env.example`
- `.gitignore`
- `components.json` (shadcn/ui)

**Описание**:
Создание базового Next.js 14 проекта с TypeScript, Tailwind CSS и shadcn/ui. Настройка конфигурационных файлов и структуры проекта.

**Технические требования**:
- Next.js 14 с App Router
- TypeScript строгий режим
- Tailwind CSS с shadcn/ui
- ESLint и Prettier
- Поддержка абсолютных импортов

**Критерии готовности**:
- [x] Проект успешно запускается с `npm run dev`
- [x] TypeScript компилируется без ошибок
- [x] Tailwind CSS стили работают
- [x] shadcn/ui готов к использованию
- [x] ESLint проходит без ошибок

**Промт**:
Создай базовый Next.js 14 проект для TGeasy - системы управления рекламой в Telegram каналах.

ТЕХНИЧЕСКИЙ СТЕК:
- Next.js 14 + App Router + TypeScript (строгий режим)
- Tailwind CSS + shadcn/ui
- ESLint + Prettier

ФАЙЛЫ:
- package.json (все зависимости)
- next.config.js (абсолютные импорты через @)
- tailwind.config.js + components.json (shadcn/ui)
- tsconfig.json + .env.example + .gitignore

ТРЕБОВАНИЯ:
- Проект запускается без ошибок
- Поддержка абсолютных импортов
- Настроенный линтинг и форматирование
- CSS переменные для темизации

РЕЗУЛЬТАТ: npm run dev работает, TypeScript компилируется чисто

---

### Задача 2: Схема базы данных Supabase ✅ ЗАВЕРШЕНО через MCP

**Модуль**: Database  
**Приоритет**: Критический  
**Зависимости**: Задача 1  
**Время**: 45 минут  

**⚠️ ВАЖНО**: Задача выполнена через **Supabase MCP интеграцию**! НЕ ищите локальные файлы!

**Файлы созданы**:
- ✅ `schemas/database.sql` - полная схема БД
- ✅ Таблицы созданы в **удаленном Supabase** через MCP
- ❌ НЕТ `supabase/migrations/` - работает через MCP!
- ✅ `types/database.ts` - сгенерированы через MCP

**Описание**:
Создание полной схемы базы данных с таблицами для пользователей, каналов, кампаний, креативов, аналитики и платежей. Настройка Row Level Security.

**Технические требования**:
- PostgreSQL схема для Supabase
- RLS (Row Level Security) политики
- Индексы для оптимизации запросов
- Связи между таблицами (foreign keys)
- TypeScript типы из схемы

**Критерии готовности**:
- [x] Все таблицы созданы без ошибок через MCP
- [x] RLS политики настроены через MCP
- [x] Индексы созданы через MCP
- [x] TypeScript типы сгенерированы через MCP
- [x] Схема сохранена в `schemas/database.sql`

**Промт**:
Создай схему PostgreSQL БД для TGeasy в Supabase.

ОСНОВНЫЕ СУЩНОСТИ:
- Users (пользователи с Telegram OAuth)
- Channels (Telegram каналы)
- Contracts (договоры с рекламодателями)
- Posts (рекламные размещения)
- Analytics (метрики размещений)
- Subscriptions (тарифы)
- Payments (платежи)

ФАЙЛЫ:
- schemas/database.sql (полная схема)
- supabase/migrations/20240101000000_initial_schema.sql
- types/database.ts (TypeScript типы)
- lib/supabase/types.ts

ТРЕБОВАНИЯ:
- UUID первичные ключи
- created_at/updated_at везде
- RLS политики для безопасности
- Индексы для производительности
- Foreign key связи
- Enum типы для статусов

РЕЗУЛЬТАТ: Схема создается без ошибок, типы генерируются

---

### Задача 3: Supabase клиент и конфигурация ✅ ЗАВЕРШЕНО через MCP
**Модуль**: Database  
**Приоритет**: Критический  
**Зависимости**: Задача 2  
**Время**: 30 минут  

**⚠️ ВАЖНО**: Подключение к Supabase работает через **MCP интеграцию**!

**Файлы созданы**:
- ✅ `lib/supabase/client.ts` - браузерный клиент
- ✅ `lib/supabase/server.ts` - серверный клиент  
- ✅ `lib/supabase/middleware.ts` - Next.js middleware
- ✅ Подключение к **удаленному Supabase** через MCP

**Описание**:
Настройка Supabase клиента для браузера и сервера, middleware для аутентификации, утилиты для работы с базой данных.

**Технические требования**:
- Отдельные клиенты для browser/server
- Правильная настройка переменных окружения
- Type-safe клиенты с TypeScript
- Middleware для Next.js
- Error handling

**Критерии готовности**:
- [x] Supabase клиент подключается через MCP
- [x] Browser и server клиенты работают
- [x] Переменные окружения настроены
- [x] TypeScript типы корректны  
- [x] MCP интеграция функционирует

**Промт**:
Настрой Supabase клиент для TGeasy с типизацией и SSR поддержкой.

ФАЙЛЫ:
- lib/supabase/client.ts (браузерный клиент)
- lib/supabase/server.ts (серверный клиент)
- lib/supabase/middleware.ts (Next.js middleware)
- utils/supabase.ts (утилиты)

ТРЕБОВАНИЯ:
- Отдельные клиенты для browser/server
- Полная TypeScript типизация из схемы
- Корректная обработка переменных окружения
- Cookie handling для сессий
- Error handling utilities

ПЕРЕМЕННЫЕ (.env.example):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

РЕЗУЛЬТАТ: Клиенты работают в браузере и на сервере

---

### Задача 4: Базовая структура проекта ✅ ЗАВЕРШЕНО

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Задача 1  
**Время**: 30 минут  

**Файлы для создания**:
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `lib/utils.ts`
- `types/index.ts`

**Описание**:
Создание базовой структуры папок и файлов проекта. Настройка главного layout, базовых UI компонентов, утилит.

**Технические требования**:
- Next.js 14 App Router структура
- Базовые shadcn/ui компоненты
- Global CSS с Tailwind
- Типизированные утилиты
- Consistent code style

**Критерии готовности**:
- [x] Структура папок соответствует архитектуре
- [x] Layout рендерится корректно
- [x] UI компоненты работают
- [x] Утилиты типизированы
- [x] Стили применяются правильно

**Промт**:
Создай базовую структуру и компоненты для TGeasy.

ФАЙЛЫ:
- app/layout.tsx (главный layout с провайдерами)
- app/page.tsx (лендинг с кнопкой "Войти через Telegram")
- app/globals.css (Tailwind + темная тема)
- components/ui/button.tsx + input.tsx (shadcn/ui базовые)
- lib/utils.ts (cn() helper)
- types/index.ts (общие типы)

ТРЕБОВАНИЯ:
- Next.js 14 App Router структура
- Dark/Light theme поддержка
- CSS переменные для цветов
- Typographic scale
- Простая landing page

РЕЗУЛЬТАТ: Чистая структура, компоненты работают

---

### Задача 5: Docker окружение для разработки ✅ ЗАВЕРШЕНО (ОПЦИОНАЛЬНО)

**Модуль**: Infrastructure  
**Приоритет**: ~~Средний~~ **ОПЦИОНАЛЬНЫЙ**  
**Зависимости**: Задача 1  
**Время**: 30 минут  

**⚠️ ВАЖНО**: Docker **НЕ ОБЯЗАТЕЛЕН** для этого проекта! Это serverless проект с нативной разработкой.

**Файлы созданы**:
- ✅ `docker-compose.yml` (опциональный)
- ✅ `Dockerfile.dev` (опциональный)
- ✅ `.dockerignore` (опциональный)
- ❌ НЕТ `scripts/docker-setup.sh` (не нужен)

**Описание**:
Настройка Docker окружения для локальной разработки. **НЕ ОБЯЗАТЕЛЬНО** - проект работает через `npm run dev`.

**Технические требования**:
- ~~Multi-stage Dockerfile для dev/prod~~
- ~~Volume mounting для hot reload~~
- ~~Environment variables~~
- ~~Database в отдельном контейнере~~ (используем MCP)
- ~~Scripts для быстрого запуска~~

**Критерии готовности**:
- [x] Docker файлы созданы (но НЕ ОБЯЗАТЕЛЬНЫ)
- [x] Нативная разработка работает: `npm run dev`
- [x] Serverless архитектура не требует Docker
- [x] MacBook friendly без Docker зависимостей

**Промт**:
Настрой Docker для локальной разработки TGeasy.

ФАЙЛЫ:
- docker-compose.yml (app + db + redis)
- Dockerfile.dev (multi-stage для dev/prod)
- .dockerignore
- scripts/docker-setup.sh

СЕРВИСЫ:
- app: Next.js с hot reload
- db: PostgreSQL 15
- redis: для кеширования

ТРЕБОВАНИЯ:
- Volume mounting для исходников
- Environment variables поддержка
- Health checks
- Автоматическая инициализация БД

РЕЗУЛЬТАТ: docker-compose up → приложение на localhost:3000

---

### Задача 6: Настройка 21st.dev MCP ✅ ЗАВЕРШЕНО

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Задача 4  
**Время**: 45 минут  

**Файлы для создания**:
- `configs/mcp-config.json`
- `lib/mcp/setup.ts`
- `docs/mcp-guidelines.md`
- `types/mcp-components.ts`

**Описание**:
Базовая настройка и конфигурация 21st.dev MCP для генерации UI компонентов на протяжении всей разработки.

**Технические требования**:
- MCP configuration setup
- Component generation guidelines
- Design system integration
- Type safety для generated components
- Performance optimization guidelines

**Критерии готовности**:
- [x] MCP настроен и работает
- [x] Component generation guidelines созданы
- [x] Design system интегрирован
- [x] Type safety обеспечен
- [x] Performance guidelines установлены

**Промт**:
Настрой 21st.dev MCP для генерации UI компонентов в TGeasy.

ФАЙЛЫ:
- configs/mcp-config.json (основная конфигурация)
- lib/mcp/setup.ts (инициализация)
- docs/mcp-guidelines.md (руководство по использованию)
- types/mcp-components.ts (типы для generated компонентов)

НАСТРОЙКИ MCP:
- Design system integration с Tailwind
- Component generation rules
- Performance guidelines
- Accessibility requirements
- Type safety для generated components

DESIGN SYSTEM:
- Color palette на основе Tailwind
- Typography scale + spacing system
- Component variants + icon system
- Naming conventions

РЕЗУЛЬТАТ: MCP готов для генерации UI на следующих этапах

---

## ЭТАП 2: АУТЕНТИФИКАЦИЯ

### Задача 7: Telegram OAuth интеграция ✅ ЗАВЕРШЕНО

**Модуль**: Auth  
**Приоритет**: Критический  
**Зависимости**: Задача 3  
**Время**: 60 минут  

**Файлы для создания**:
- `lib/auth/telegram.ts`
- `app/api/auth/telegram/route.ts`
- `app/api/auth/callback/route.ts`
- `types/auth.ts`
- `utils/telegram-auth.ts`

**Описание**:
Реализация аутентификации через Telegram OAuth. Создание API endpoints для авторизации и обработки callback.

**Технические требования**:
- Telegram OAuth 2.0 flow
- Безопасная проверка подписи
- JWT токены через Supabase Auth
- Session management
- Error handling

**Критерии готовности**:
- [x] Telegram OAuth redirect работает
- [x] Callback корректно обрабатывается
- [x] Пользователь создается в БД
- [x] JWT токены генерируются
- [x] Session сохраняется

**Промт**:
Создай полную интеграцию Telegram OAuth для аутентификации в TGeasy.

ЦЕЛЬ: Пользователи входят через Telegram, создается аккаунт в Supabase, устанавливается сессия.

ФАЙЛЫ:
- lib/auth/telegram.ts (OAuth логика)
- app/api/auth/telegram/route.ts (инициация OAuth)
- app/api/auth/callback/route.ts (обработка callback)
- types/auth.ts + utils/telegram-auth.ts

OAUTH FLOW:
1. /api/auth/telegram → redirect на Telegram OAuth
2. Telegram callback с данными пользователя
3. /api/auth/callback → проверка подписи + создание сессии
4. Redirect на dashboard

БЕЗОПАСНОСТЬ:
- Проверка hash подписи от Telegram
- Валидация timestamp (не старше 24 часов)
- CSRF защита + secure cookies

ПЕРЕМЕННЫЕ:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_BOT_SECRET
- NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

РЕЗУЛЬТАТ: OAuth flow работает от начала до конца

---

### Задача 8: Middleware для защищенных маршрутов ✅ ЗАВЕРШЕНО + ОБНОВЛЕНО

**Модуль**: Auth  
**Приоритет**: Критический  
**Зависимости**: Задача 7  
**Время**: 45 минут  

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Упрощена система ролей в пользу **Telegram-native прав доступа**.

**Файлы созданы/обновлены**:
- ✅ `middleware.ts` (уже был упрощен)
- ✅ `lib/auth/middleware.ts` (обновлен под новую архитектуру)
- ✅ `lib/auth/permissions.ts` (полностью переписан под Telegram-native подход)
- ✅ `utils/auth-helpers.ts` (создан заново с упрощенными утилитами)

**Описание**:
Создание middleware для проверки аутентификации пользователей на защищенных маршрутах. **Полностью переработана система прав** под Telegram-native подход.

**Технические требования**:
- Next.js middleware (только базовая аутентификация)
- Cookie-based session validation
- Route protection (authenticated/unauthenticated)
- **Telegram-native permissions** (на уровне API)
- Упрощенные утилиты аутентификации

**Критерии готовности**:
- [x] Неавторизованные перенаправляются на /login
- [x] Авторизованные получают доступ к dashboard
- [x] Cookie session валидируется через БД
- [x] **Система ролей упрощена** (user/admin)
- [x] **Telegram permissions** готовы для API интеграции
- [x] Performance оптимизирован

**Обновления под новую архитектуру**:
- **Middleware**: только базовая аутентификация (cookies проверка)
- **Permissions**: Telegram-native типы и mapping функции
- **Auth helpers**: упрощенные утилиты для UI
- **Channel права**: проверяются через Telegram API в endpoints

**Промт**:
Создай middleware для защиты маршрутов с упрощенной системой авторизации.

ФАЙЛЫ:
- middleware.ts (главный Next.js middleware)
- lib/auth/middleware.ts (логика аутентификации)
- lib/auth/permissions.ts (упрощенная система разрешений)
- utils/auth-helpers.ts

ЗАЩИЩЕННЫЕ МАРШРУТЫ:
- /dashboard/* → требует аутентификации
- /api/protected/* → требует токен

ПУБЛИЧНЫЕ МАРШРУТЫ:
- / (лендинг)
- /login, /api/auth/*
- /public-stats/* (публичная аналитика)

УПРОЩЕННАЯ ЛОГИКА:
- Проверка JWT токена из cookies
- Валидация сессии в Supabase
- **НЕТ сложной проверки ролей** в middleware
- Redirect неавторизованных на /login

ПРАВА НА УРОВНЕ API:
- **Channel permissions**: проверяются в API endpoints
- **Telegram-native права**: синхронизируются с Telegram API
- **Упрощенная модель**: authenticated user + channel-specific права

РЕЗУЛЬТАТ: Упрощенный middleware с Telegram-native правами на уровне API

---

### Задача 9: UI авторизации через MCP ✅ ЗАВЕРШЕНО

**Модуль**: Auth  
**Приоритет**: Критический  
**Зависимости**: Задача 6, 8  
**Время**: 60 минут → **ФАКТИЧЕСКИ: ~4 часа** (включая отладку и исправления)

**Файлы созданы**:
- ✅ `docs/ui-requirements/auth.md` - UI requirements
- ✅ `app/(auth)/login/page.tsx` - современная страница login через MCP
- ✅ `package.json` - добавлен framer-motion
- ✅ `app/globals.css` - стили для Telegram widget интеграции
- ✅ `components/auth/telegram-login-widget.tsx` - **ПЕРЕРАБОТАН** на direct bot flow
- ✅ `app/auth/complete/page.tsx` - страница завершения авторизации
- ✅ `app/api/auth/check/route.ts` - API для проверки авторизации
- ✅ `middleware.ts` - **ИСПРАВЛЕН** добавлен `/auth/complete` в public routes

**Описание**:
Генерация UI для процесса авторизации через Telegram с использованием 21st.dev MCP. Современный дизайн и UX.

**⚠️ ВАЖНЫЕ ИЗМЕНЕНИЯ В ПРОЦЕССЕ РАЗРАБОТКИ:**

**Проблема 1: Telegram Login Widget не работал**
- **Причина**: Новые пользователи не получали SMS коды для авторизации
- **Решение**: Заменили Telegram Login Widget на **direct bot authorization flow**

**Проблема 2: Mobile WebView изоляция**
- **Причина**: Авторизация в Telegram WebView не передавалась в основной браузер
- **Решение**: Добавили поддержку Telegram WebView API и специальную обработку

**Проблема 3: Middleware блокировал `/auth/complete`**
- **Причина**: Страница завершения авторизации была заблокирована middleware
- **Решение**: Добавили `/auth/complete` в список публичных маршрутов

**Проблема 4: Данные пользователя не сохранялись полностью**
- **Причина**: В webhook не сохранялись `username` и `last_name`
- **Решение**: Исправили обработку данных пользователя в webhook и callback

**ФИНАЛЬНАЯ АРХИТЕКТУРА АВТОРИЗАЦИИ:**

1. **Direct Bot Flow** (вместо Telegram Login Widget):
   ```
   Пользователь → Кнопка "Войти" → Открытие t.me/bot?start=auth_STATE → 
   Telegram Bot → Webhook → Создание пользователя → 
   Кнопка "Завершить вход" → /auth/complete → Dashboard
   ```

2. **Компоненты**:
   - `TelegramLoginWidget` - генерирует ссылку на бота с уникальным state
   - `/api/telegram/webhook` - обрабатывает команды бота, создает пользователей
   - `/auth/complete` - завершает авторизацию, устанавливает сессию
   - `/api/auth/check` - проверяет статус авторизации

3. **Безопасность**:
   - Уникальный `state` параметр для каждой авторизации
   - Проверка подписи Telegram webhook
   - Secure cookies для сессий
   - CSRF защита

**Технические требования**:
- ✅ UI requirements документация для MCP
- ✅ Telegram Bot integration вместо Login Widget
- ✅ Loading states и error handling
- ✅ Responsive дизайн
- ✅ Accessibility соблюдение
- ✅ Mobile WebView поддержка

**Критерии готовности**:
- [x] UI requirements документированы
- [x] Страницы сгенерированы через MCP
- [x] Telegram авторизация работает (через бота)
- [x] Loading и error states отображаются
- [x] Responsive на всех устройствах
- [x] Glassmorphism эффекты добавлены
- [x] Анимации с framer-motion
- [x] Темная/светлая тема
- [x] **PRODUCTION READY** - протестировано на Vercel

**Результаты деплоя**:
- ✅ **Production URL**: https://tgeasy-659ynk6tg-shishkinartemiy-gmailcoms-projects.vercel.app
- ✅ **Telegram Bot**: @tgeasy_oauth_bot настроен и работает
- ✅ **Webhook**: настроен на production URL
- ✅ **Авторизация**: полный flow работает на desktop и mobile
- ✅ **База данных**: пользователи сохраняются с полными данными

**Lessons Learned**:
1. **Telegram Login Widget** может не работать для новых пользователей - лучше использовать direct bot flow
2. **Mobile WebView** требует специальной обработки для передачи авторизации
3. **Middleware** нужно настраивать аккуратно чтобы не блокировать auth endpoints
4. **Webhook данные** нужно логировать для отладки проблем с сохранением пользователей
5. **MCP генерация** работает отлично для UI, но бизнес-логику нужно дорабатывать вручную

**Промт**:
Создай comprehensive UI для процесса авторизации используя 21st.dev MCP.

ЦЕЛЬ: Современный, профессиональный UI который произведет WOW эффект.

ФАЙЛЫ:
- docs/ui-requirements/auth.md (детальные требования для MCP)
- app/(auth)/login/page.tsx (через MCP)
- app/(auth)/callback/page.tsx (через MCP)
- app/(auth)/layout.tsx
- components/auth/ (через MCP)

UI REQUIREMENTS (auth.md):
ДИЗАЙН: Современный gradient background, glassmorphism, smooth animations
СТРАНИЦА ЛОГИНА: Центрированная карточка, Telegram Login Button, брендинг TGeasy
КОМПОНЕНТЫ: TelegramLoginButton, AuthCard, LoadingSpinner, AuthLayout
ИНТЕРАКТИВНОСТЬ: Hover эффекты, loading states, error handling, smooth transitions
CALLBACK: Loading spinner, success/error states, автоматический redirect

ТРЕБОВАНИЯ:
- Mobile-first responsive
- Dark theme поддержка
- Accessibility (ARIA labels, keyboard navigation)
- Error handling с toast уведомлениями

РЕЗУЛЬТАТ: Professional auth UI, готовый к production

---

### Задача 10: Telegram-native система прав доступа

**Модуль**: Users  
**Приоритет**: Критический  
**Зависимости**: Задача 9  
**Время**: 60 минут  

**Файлы для создания**:
- `lib/services/channel-permissions-service.ts`
- `lib/repositories/channel-permissions-repository.ts`
- `app/api/channels/[id]/permissions/route.ts`
- `lib/integrations/telegram/permissions.ts`
- `types/channel-permissions.ts`
- `utils/telegram-permissions.ts`

**Описание**:
Система управления правами доступа на основе Telegram-native ролей. Пользователи получают те же права в TGeasy, что и в Telegram каналах.

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Отказ от сложной системы ролей TGeasy в пользу синхронизации с Telegram API.

**Новый подход**:
1. **Показываем только доступные каналы**: пользователь видит только каналы, где он `creator` или `administrator`
2. **Наследование прав**: права в TGeasy = права в Telegram канале
3. **Автоматическая синхронизация**: периодическое обновление прав через Telegram API

**Технические требования**:
- Telegram API integration для проверки прав
- Синхронизация прав при подключении канала
- Периодическое обновление прав (daily cron)
- Channel-level permissions вместо user roles
- Упрощенная модель данных

**Критерии готовности**:
- [ ] Telegram API проверяет права пользователей
- [ ] Права синхронизируются при подключении канала
- [ ] Периодическое обновление прав работает
- [ ] Пользователи видят только доступные каналы
- [ ] Права наследуются из Telegram

**Telegram права и их mapping в TGeasy**:
```typescript
interface TelegramChannelPermissions {
  telegram_status: 'creator' | 'administrator';
  can_post_messages: boolean;      // → может создавать размещения
  can_edit_messages: boolean;      // → может редактировать размещения  
  can_delete_messages: boolean;    // → может удалять размещения
  can_change_info: boolean;        // → может изменять настройки канала в TGeasy
  can_invite_users: boolean;       // → может приглашать пользователей в TGeasy
}
```

**Упрощенная модель прав**:
- **Creator** → полные права в TGeasy (управление каналом + контент)
- **Administrator** → права согласно Telegram permissions (в основном контент)
- **Обычные пользователи** → не видят канал вообще

**Промт**:
Создай систему управления правами доступа на основе Telegram-native ролей для TGeasy.

ЦЕЛЬ: Упростить систему ролей, используя права пользователей из Telegram каналов.

ФАЙЛЫ:
- lib/services/channel-permissions-service.ts (синхронизация прав)
- lib/repositories/channel-permissions-repository.ts (работа с БД)
- app/api/channels/[id]/permissions/route.ts (API для прав)
- lib/integrations/telegram/permissions.ts (Telegram API для прав)
- types/channel-permissions.ts (типы прав)
- utils/telegram-permissions.ts (утилиты работы с правами)

АРХИТЕКТУРА ПРАВ:

Telegram API Integration:
- getChatMember(chatId, userId) → получение статуса пользователя
- getChatAdministrators(chatId) → список всех администраторов
- Проверка прав при подключении канала
- Периодическая синхронизация (daily cron job)

Channel Permissions Model:
```typescript
interface ChannelPermission {
  user_id: string;
  channel_id: string;
  telegram_status: 'creator' | 'administrator';
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  last_synced_at: timestamp;
}
```

ФУНКЦИОНАЛЬНОСТЬ:

syncChannelPermissions(channelId):
- Получение списка администраторов из Telegram
- Обновление прав в БД
- Удаление прав для пользователей, потерявших доступ

getUserChannels(userId):
- Возврат только каналов, где пользователь имеет права
- Фильтрация по telegram_status: creator | administrator

checkUserPermission(userId, channelId, permission):
- Проверка конкретного права пользователя
- Кеширование результатов для производительности

CRON JOBS:
- Ежедневная синхронизация прав всех каналов
- Обновление при изменениях в Telegram (webhook)
- Cleanup неактивных каналов

БЕЗОПАСНОСТЬ:
- Проверка прав на каждом API endpoint
- Валидация Telegram API responses
- Rate limiting для Telegram API calls

РЕЗУЛЬТАТ: Простая, надежная система прав, синхронизированная с Telegram

---

## ЭТАП 3: УПРАВЛЕНИЕ КАНАЛАМИ

### Задача 11: Telegram Bot API сервис

**Модуль**: Channels  
**Приоритет**: Критический  
**Зависимости**: Задача 10  
**Время**: 60 минут  

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Фокус на **Telegram-native права доступа** и синхронизацию прав.

**Файлы для создания**:
- `lib/integrations/telegram/bot-api.ts`
- `lib/integrations/telegram/types.ts`
- `lib/integrations/telegram/webhooks.ts`
- `lib/integrations/telegram/permissions.ts` ⭐ **НОВЫЙ**
- `utils/telegram-helpers.ts`
- `types/telegram.ts`

**Описание**:
Создание сервиса для работы с Telegram Bot API с акцентом на **получение и синхронизацию прав пользователей** в каналах.

**Технические требования**:
- Telegram Bot API client
- **Права пользователей API** (getChatMember, getChatAdministrators)
- Error handling и retry logic
- Rate limiting
- Webhook support
- TypeScript типы

**Критерии готовности**:
- [ ] API клиент подключается к Telegram
- [ ] Информация о каналах получается
- [ ] **Права пользователей синхронизируются** ⭐
- [ ] **Telegram статусы маппятся в TGeasy права** ⭐
- [ ] Rate limiting работает
- [ ] Ошибки обрабатываются

**Промт**:
Создай сервис для работы с Telegram Bot API с фокусом на Telegram-native права доступа.

ЦЕЛЬ: **Синхронизация прав пользователей** из Telegram каналов, получение информации о канале, мониторинг статуса.

ФАЙЛЫ:
- lib/integrations/telegram/bot-api.ts (основной клиент)
- lib/integrations/telegram/types.ts (типы Telegram API)
- lib/integrations/telegram/webhooks.ts (обработка вебхуков)
- lib/integrations/telegram/permissions.ts ⭐ (работа с правами)
- utils/telegram-helpers.ts
- types/telegram.ts

ОСНОВНОЙ ФУНКЦИОНАЛ:
- getChat(chatId) - информация о канале
- **getChatAdministrators(chatId) - список админов с правами** ⭐
- **getChatMember(chatId, userId) - детальные права пользователя** ⭐
- sendMessage(chatId, text) - отправка сообщений
- getMe() - информация о боте

**НОВЫЙ ФУНКЦИОНАЛ - ПРАВА**:
- **syncChannelPermissions(channelId)** - синхронизация прав канала
- **getUserChannelPermissions(userId, channelId)** - права пользователя
- **mapTelegramPermissions(telegramMember)** - mapping в TGeasy права
- **isUserChannelAdmin(userId, channelId)** - проверка админских прав

ERROR HANDLING:
- Rate limiting (30 requests/second)
- Retry logic с exponential backoff
- Обработка Telegram API ошибок
- Graceful degradation при недоступности

WEBHOOK SYSTEM:
- Регистрация webhook URL
- Валидация подписи webhook
- Event routing для разных типов обновлений
- **Обработка изменений прав пользователей** ⭐

ПЕРЕМЕННЫЕ:
- TELEGRAM_BOT_TOKEN
- TELEGRAM_WEBHOOK_SECRET
- NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

РЕЗУЛЬТАТ: Надежный сервис с **Telegram-native синхронизацией прав**

---

### Задача 12: Backend для управления каналами

**Модуль**: Channels  
**Приоритет**: Критический  
**Зависимости**: Задача 11  
**Время**: 90 минут  

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Интеграция с **Telegram-native правами доступа** из Задачи 10.

**Файлы для создания**:
- `lib/services/channel-service.ts`
- `lib/repositories/channel-repository.ts`
- `app/api/channels/route.ts`
- `app/api/channels/connect/route.ts`
- `app/api/channels/[id]/route.ts`
- `app/api/channels/[id]/permissions/route.ts` ⭐ **ОБНОВЛЕН**
- `lib/services/channel-management.ts`
- `utils/channel-validation.ts`
- `types/channel.ts`

**Описание**:
Полный backend для управления каналами с **автоматической синхронизацией Telegram-native прав**: подключение, CRUD операции, права доступа, мониторинг.

**Технические требования**:
- Channel connection и validation
- CRUD операции для каналов
- **Telegram-native permission management** ⭐
- **Автоматическая синхронизация прав** при подключении ⭐
- Admin rights verification
- Status monitoring

**Критерии готовности**:
- [ ] Каналы подключаются успешно
- [ ] CRUD операции работают
- [ ] **Telegram права синхронизируются автоматически** ⭐
- [ ] **Пользователи видят только доступные каналы** ⭐
- [ ] Permission management функционирует
- [ ] Status monitoring активен

**Промт**:
Создай полный backend для управления Telegram каналами с Telegram-native правами доступа.

ЦЕЛЬ: **Автоматическая синхронизация прав** из Telegram при подключении каналов.

ФАЙЛЫ:
- lib/services/channel-service.ts (бизнес-логика + синхронизация прав)
- lib/repositories/channel-repository.ts (работа с БД)
- app/api/channels/route.ts (основные CRUD + фильтрация по правам)
- app/api/channels/connect/route.ts (подключение + синхронизация прав)
- app/api/channels/[id]/route.ts (операции с конкретным каналом)
- app/api/channels/[id]/permissions/route.ts ⭐ (Telegram-native права)
- lib/services/channel-management.ts
- utils/channel-validation.ts
- types/channel.ts

**ОБНОВЛЕННЫЙ ПРОЦЕСС ПОДКЛЮЧЕНИЯ КАНАЛА**:
1. Пользователь предоставляет username или invite link
2. Проверка существования канала в Telegram
3. Проверка прав администратора у бота
4. **Проверка статуса пользователя в канале (creator/administrator)** ⭐
5. **Синхронизация детальных прав пользователя из Telegram** ⭐
6. Сохранение в БД + **автоматическая настройка Telegram-native прав** ⭐

API ENDPOINTS:
- GET /api/channels (**только каналы где user = creator/administrator**) ⭐
- POST /api/channels/connect (подключение + **синхронизация прав**) ⭐
- GET/PUT/DELETE /api/channels/[id] (**с проверкой Telegram прав**) ⭐
- POST /api/channels/[id]/verify (проверка статуса)
- **GET /api/channels/[id]/permissions** ⭐ (текущие Telegram права)
- **POST /api/channels/[id]/sync-permissions** ⭐ (принудительная синхронизация)

ВАЛИДАЦИЯ И ПРОВЕРКИ:
- Username format validation
- Invite link parsing
- Bot admin rights verification
- **User creator/administrator status verification** ⭐
- **Telegram permissions mapping validation** ⭐
- Channel accessibility check

**НОВЫЙ ФУНКЦИОНАЛ - ПРАВА**:
- **syncChannelPermissions(channelId)** - синхронизация прав канала
- **getUserAccessibleChannels(userId)** - только доступные каналы
- **validateUserChannelAccess(userId, channelId)** - проверка доступа
- **mapTelegramPermissionsToTGeasy(permissions)** - mapping прав

МОНИТОРИНГ:
- Channel status tracking
- Connection health checks
- **Admin rights monitoring с автоматической синхронизацией** ⭐
- Subscriber count updates
- **Permissions drift detection** ⭐

РЕЗУЛЬТАТ: Robust система с **автоматической Telegram-native синхронизацией прав**

---

### Задача 13: API интеграция для каналов

**Модуль**: Channels  
**Приоритет**: Критический  
**Зависимости**: Задача 12  
**Время**: 60 минут  

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Hooks адаптированы под **Telegram-native права доступа**.

**Файлы для создания**:
- `hooks/use-channels.ts` ⭐ **ОБНОВЛЕН**
- `hooks/use-channel-status.ts`
- `hooks/use-channel-permissions.ts` ⭐ **НОВЫЙ**
- `lib/api/channels-api.ts` ⭐ **ОБНОВЛЕН**
- `types/channel-ui.ts`
- `utils/channel-helpers.ts`

**Описание**:
React hooks и API клиент для работы с каналами с **автоматической фильтрацией по Telegram правам**. Подготовка для UI генерации через MCP.

**Технические требования**:
- React hooks с SWR/React Query
- API client с type safety
- **Автоматическая фильтрация каналов по правам** ⭐
- **Permissions hooks для UI** ⭐
- Error handling и loading states
- Optimistic updates
- Real-time synchronization

**Критерии готовности**:
- [ ] Hooks возвращают **только доступные каналы** ⭐
- [ ] **Permissions hooks работают** ⭐
- [ ] Loading и error states обрабатываются
- [ ] API клиент работает корректно
- [ ] Optimistic updates функционируют
- [ ] Ready для интеграции с MCP UI

**Промт**:
Создай React hooks и API клиент для работы с каналами с Telegram-native правами доступа.

ЦЕЛЬ: **Автоматическая фильтрация каналов** по Telegram правам пользователя.

ФАЙЛЫ:
- hooks/use-channels.ts (основной хук + фильтрация по правам)
- hooks/use-channel-status.ts (мониторинг статуса)
- hooks/use-channel-permissions.ts ⭐ (управление правами)
- lib/api/channels-api.ts (API клиент + permissions endpoints)
- types/channel-ui.ts (типы для UI + permissions)
- utils/channel-helpers.ts

**ОБНОВЛЕННЫЕ HOOKS**:

useChannels():
- **channels (только creator/administrator)**, loading, error, refetch ⭐
- connectChannel, updateChannel, disconnectChannel
- **filterByPermissions(permission)** ⭐ - фильтрация по конкретным правам
- Real-time synchronization с backend
- Optimistic updates для UI

useChannelStatus(channelId):
- status, isOnline, lastCheck, **telegramPermissions**, memberCount ⭐
- Real-time мониторинг статуса
- Refresh functionality

useChannelConnection():
- connect, isConnecting, error, validateChannel
- **syncPermissions** ⭐ - синхронизация прав после подключения
- Connection workflow management

**НОВЫЙ HOOK - ПРАВА**:
useChannelPermissions(channelId):
- **permissions, loading, error** ⭐
- **syncPermissions()** - принудительная синхронизация ⭐
- **hasPermission(permission)** - проверка конкретного права ⭐
- **isCreator, isAdministrator** - быстрые проверки статуса ⭐
- **canPost, canEdit, canDelete** - проверки контентных прав ⭐

ФУНКЦИОНАЛЬНОСТЬ:
- **Автоматическая фильтрация каналов по правам** ⭐
- Real-time synchronization
- Optimistic updates
- **Permissions caching с invalidation** ⭐
- Error handling с retry logic
- Loading states для всех операций
- Cache management

**ОБНОВЛЕННЫЙ API CLIENT**:
- getChannels (**только доступные**), connectChannel, getChannel
- updateChannel, disconnectChannel, verifyChannel
- **getChannelPermissions, syncChannelPermissions** ⭐
- **getUserAccessibleChannels** ⭐
- getChannelAnalytics

ERROR HANDLING:
- Network errors с retry
- Validation errors с user feedback
- **Permission denied errors с clear messaging** ⭐
- **Telegram API errors handling** ⭐
- Rate limit handling

**PERMISSIONS HELPERS**:
- **canUserAccessChannel(userId, channelId)** ⭐
- **mapTelegramPermissions(permissions)** ⭐
- **getPermissionLevel(permissions)** ⭐
- **formatPermissionsForUI(permissions)** ⭐

РЕЗУЛЬТАТ: Hooks с **автоматической Telegram-native фильтрацией** готовые для MCP UI

---

### Задача 14: UI управления каналами через MCP

**Модуль**: Channels  
**Приоритет**: Критический  
**Зависимости**: Задача 6, 13  
**Время**: 90 минут  

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: UI адаптирован под **Telegram-native права доступа**.

**Файлы для создания**:
- `docs/ui-requirements/channels.md` ⭐ **ОБНОВЛЕН**
- `app/(dashboard)/channels/page.tsx` (через MCP)
- `components/channels/` (сгенерированные через MCP)
- `configs/mcp-channels.json`

**Описание**:
Генерация полного UI для управления каналами через 21st.dev MCP с **отображением только доступных каналов** и **Telegram-native статусами**.

**Технические требования**:
- Comprehensive UI requirements для MCP
- Integration с **обновленными hooks** из задачи 13 ⭐
- Channel connection interface
- **Telegram permissions display** ⭐
- Status monitoring UI
- **Permission-based UI elements** ⭐

**Критерии готовности**:
- [ ] UI requirements **обновлены под Telegram права** ⭐
- [ ] UI сгенерирован через MCP
- [ ] Интеграция с **permissions hooks** работает ⭐
- [ ] **Показываются только доступные каналы** ⭐
- [ ] Channel connection UI функционирует
- [ ] **Telegram permissions отображаются** ⭐
- [ ] Status monitoring отображается

**Промт**:
Создай comprehensive UI для управления каналами с Telegram-native правами доступа используя 21st.dev MCP.

ЦЕЛЬ: **Показ только доступных каналов** с **Telegram permissions индикаторами**.

ФАЙЛЫ:
- docs/ui-requirements/channels.md (детальные требования для MCP)
- app/(dashboard)/channels/page.tsx (через MCP)
- components/channels/ (через MCP)
- configs/mcp-channels.json

**ОБНОВЛЕННЫЕ UI REQUIREMENTS (channels.md)**:

ГЛАВНАЯ СТРАНИЦА (/channels):
- Header: "Мои каналы" + count (**только доступные**), кнопка "Подключить канал" ⭐
- Search bar с real-time поиском
- **Фильтры: Все, Creator, Administrator, Активные, Неактивные** ⭐
- Responsive grid (1-4 колонки)

**ОБНОВЛЕННЫЙ CHANNEL CARD**:
- Avatar/Icon канала + название с @username
- **Telegram Status Badge (Creator/Administrator)** ⭐
- **Permissions indicators (can_post, can_edit, can_delete)** ⭐
- Status badge (подключен/отключен/ошибка)
- Subscriber count с иконкой
- Last activity timestamp
- Actions dropdown menu (**с учетом прав**) ⭐

**ОБНОВЛЕННОЕ ПОДКЛЮЧЕНИЕ КАНАЛА**:
- ConnectChannelModal с step-by-step wizard
- Input для username или invite link
- Real-time validation feedback
- **Проверка прав пользователя в канале** ⭐
- **Preview с отображением статуса (Creator/Administrator)** ⭐
- **Предупреждение если недостаточно прав** ⭐

**НОВЫЕ КОМПОНЕНТЫ - ПРАВА**:
- **TelegramStatusBadge** ⭐ (Creator/Administrator)
- **PermissionsIndicator** ⭐ (can_post, can_edit, can_delete icons)
- **PermissionsDeniedMessage** ⭐ (когда нет доступа)
- **PermissionsSyncButton** ⭐ (принудительная синхронизация)

ИНТЕРАКТИВНОСТЬ:
- Card hover transitions
- Loading spinners для async операций
- Success/error toast notifications
- Real-time updates статуса каналов
- **Permissions sync indicators** ⭐

**ОБНОВЛЕННЫЕ ФИЛЬТРЫ**:
- **По Telegram статусу**: Creator, Administrator
- **По правам**: Can Post, Can Edit, Can Delete
- По статусу подключения: Активные, Неактивные, Ошибки

RESPONSIVE:
- Desktop: Full grid layout с permissions indicators
- Tablet: Simplified table с touch targets
- Mobile: Card layout с swipe actions

ACCESSIBILITY:
- ARIA labels, keyboard navigation
- High contrast mode support
- Screen reader friendly
- **Permissions описания для screen readers** ⭐

**ОБНОВЛЕННЫЕ КОМПОНЕНТЫ для генерации**:
ChannelsPage, ChannelCard, ChannelGrid, ConnectChannelModal, 
ChannelFilters, ChannelSearch, ChannelActions, ChannelStatusBadge,
**TelegramStatusBadge, PermissionsIndicator, PermissionsDeniedMessage,
PermissionsSyncButton, ChannelPermissionsTooltip** ⭐

РЕЗУЛЬТАТ: **Telegram-native интерфейс** с автоматической фильтрацией по правам

---

## ЭТАП 4: ДОГОВОРЫ

### Задача 15: Backend управления договорами

**Модуль**: Contracts  
**Приоритет**: Высокий  
**Зависимости**: Задача 10  
**Время**: 75 минут  

**Файлы для создания**:
- `lib/repositories/contract-repository.ts`
- `app/api/contracts/route.ts`
- `app/api/contracts/[id]/route.ts`
- `app/api/contracts/upload/route.ts`
- `lib/services/contract-service.ts`
- `lib/services/file-upload-service.ts`
- `types/contract.ts`
- `utils/contract-validation.ts`

**Описание**:
Полная backend система для работы с договорами. API endpoints, файловые операции, поиск.

**Технические требования**:
- File upload к Supabase Storage
- PDF/DOC обработка и метаданные
- Search API с полнотекстовым поиском
- Permission checks
- Comprehensive error handling

**Критерии готовности**:
- [ ] CRUD операции работают
- [ ] Файлы загружаются и сохраняются
- [ ] Поиск возвращает релевантные результаты
- [ ] Права доступа проверяются
- [ ] Ошибки обрабатываются gracefully

**Промт**:
Создай полный backend для управления договорами с рекламодателями в TGeasy.

ЦЕЛЬ: Загрузка PDF/DOC файлов договоров, извлечение метаданных, поиск по содержимому.

ФАЙЛЫ:
- lib/repositories/contract-repository.ts (работа с БД)
- app/api/contracts/route.ts (CRUD операции)
- app/api/contracts/[id]/route.ts (операции с конкретным договором)
- app/api/contracts/upload/route.ts (загрузка файлов)
- lib/services/contract-service.ts (бизнес-логика)
- lib/services/file-upload-service.ts (обработка файлов)
- types/contract.ts
- utils/contract-validation.ts

СТРУКТУРА ДОГОВОРА:
- Основные поля: title, advertiser_name, inn, file_url, status
- Метаданные: file_size, mime_type, pageCount, extractedText
- Статусы: active, expired, draft
- Связь с размещениями

API ENDPOINTS:
- GET /api/contracts (список с пагинацией, фильтрацией, поиском)
- POST /api/contracts (создание без файла)
- POST /api/contracts/upload (загрузка файла + метаданные)
- GET/PUT/DELETE /api/contracts/[id]
- GET /api/contracts/search (полнотекстовый поиск)

FILE UPLOAD:
- Поддержка: PDF, DOC, DOCX (до 50MB)
- Загрузка в Supabase Storage
- Извлечение текста для поиска
- Генерация thumbnail превью
- Virus scanning (если доступен)

ВАЛИДАЦИЯ:
- Обязательные поля: title, advertiser_name, inn
- ИНН валидация (российский формат)
- File type и size validation
- Input sanitization

БЕЗОПАСНОСТЬ:
- Проверка прав доступа к файлам
- Secure file URLs с токенами
- Rate limiting для uploads

РЕЗУЛЬТАТ: Robust система управления договорами с quality file handling

---

### Задача 16: API интеграция для договоров

**Модуль**: Contracts  
**Приоритет**: Высокий  
**Зависимости**: Задача 15  
**Время**: 45 минут  

**Файлы для создания**:
- `hooks/use-contracts.ts`
- `lib/api/contracts-api.ts`
- `utils/file-upload-helpers.ts`
- `types/contract-ui.ts`

**Описание**:
React hooks и API клиент для работы с договорами. Подготовка для UI генерации через MCP.

**Технические требования**:
- File upload hooks с progress
- Search hooks с debouncing
- Error handling и loading states
- Optimistic updates для UI
- Type safety для всех операций

**Критерии готовности**:
- [ ] Хуки предоставляют типизированные данные
- [ ] File upload с progress tracking
- [ ] Search hooks работают с debouncing
- [ ] Error и loading states handled
- [ ] Ready для MCP UI генерации

**Промт**:
Создай React hooks и API клиент для работы с договорами в TGeasy frontend.

ФАЙЛЫ:
- hooks/use-contracts.ts (основной хук)
- lib/api/contracts-api.ts (API клиент)
- utils/file-upload-helpers.ts (утилиты загрузки)
- types/contract-ui.ts (типы для UI)

ОСНОВНЫЕ HOOKS:

useContracts(filters):
- contracts, loading, error, refetch
- searchContracts, createContract, updateContract, deleteContract
- Фильтрация и пагинация

useContractUpload():
- upload, uploading, progress, error, preview
- validateFile, resumable uploads
- Progress tracking с процентами

useContractSearch():
- search, results, loading, suggestions
- Debounced search queries (300ms)
- Search history

useContract(id):
- contract, loading, error
- download, update, delete функции

ФУНКЦИОНАЛЬНОСТЬ:

FILE UPLOAD:
- Chunked upload для больших файлов
- Resume upload functionality
- File validation перед загрузкой
- Error recovery с retry

SEARCH:
- Debounced queries
- Search suggestions с автокомплитом
- Filter combination
- Search history сохранение

DATA MANAGEMENT:
- Optimistic updates
- Cache management с invalidation
- Infinite scrolling для больших списков

API CLIENT МЕТОДЫ:
- getContracts, createContract, uploadContract
- getContract, updateContract, deleteContract
- searchContracts, downloadContract

РЕЗУЛЬТАТ: Hooks готовые для seamless интеграции с MCP UI

---

### Задача 17: UI управления договорами через MCP

**Модуль**: Contracts  
**Приоритет**: Высокий  
**Зависимости**: Задача 6, 16  
**Время**: 75 минут  

**Файлы для создания**:
- `docs/ui-requirements/contracts.md`
- `app/(dashboard)/contracts/page.tsx` (через MCP)
- `components/contracts/` (сгенерированные через MCP)
- `components/contracts/contract-selector.tsx`
- `configs/mcp-contracts.json`

**Описание**:
Генерация UI для управления договорами через MCP с интеграцией file upload функциональности.

**Технические требования**:
- Comprehensive UI requirements для MCP
- File upload interface generation
- Search interface creation
- Document preview components
- Contract selector для размещений

**Критерии готовности**:
- [ ] UI requirements документированы
- [ ] UI сгенерирован через MCP
- [ ] File upload interface работает
- [ ] Search functionality работает
- [ ] Contract selector готов для размещений

**Промт**:
Создай comprehensive UI для управления договорами используя 21st.dev MCP.

ЦЕЛЬ: Professional document management interface с trust-inspiring design.

ФАЙЛЫ:
- docs/ui-requirements/contracts.md (детальные требования для MCP)
- app/(dashboard)/contracts/page.tsx (через MCP)
- components/contracts/ (через MCP)
- components/contracts/contract-selector.tsx (для размещений)
- configs/mcp-contracts.json

UI REQUIREMENTS (contracts.md):

ГЛАВНАЯ СТРАНИЦА (/contracts):
- Header: "Договоры" + общее количество
- Primary CTA "Загрузить договор" с upload icon
- Advanced search bar с filters toggle
- Quick filters: Все, Активные, Истекающие, Истекшие

SEARCH & FILTERS:
- Expandable filters panel
- Text search с live suggestions
- Date range picker (создан/истекает)
- Advertiser name filter с autocomplete
- Status multiselect + file type filter

CONTRACTS LIST:
- Table layout с sortable columns
- Alternative card view toggle
- Pagination с показом общего количества
- Bulk actions selection

TABLE COLUMNS:
- Document (file icon + name + size)
- Advertiser (name + ИНН)
- Status (colored badge с icon)
- Created/Expires dates
- Actions dropdown

CONTRACT UPLOAD:
- Drag & drop zone с visual feedback
- File browser fallback
- Upload progress bar с percentage
- Metadata form: title, advertiser, ИНН, expiration date

CONTRACT SELECTOR (для размещений):
- Compact dropdown interface
- Search within contracts
- Recent contracts shortcuts
- Contract preview on hover

ИНТЕРАКТИВНОСТЬ:
- Drag & drop с visual drop zones
- Progress indicators
- File type icons (PDF, DOC, DOCX)
- Hover states для document preview

ACCESSIBILITY:
- Keyboard navigation
- Screen reader support
- High contrast режим

КОМПОНЕНТЫ для генерации:
ContractsPage, ContractTable, ContractCard, ContractUploadModal,
ContractPreviewModal, ContractFilters, ContractSearch, ContractSelector,
ContractStatusBadge, FileUploadZone, ContractActions

РЕЗУЛЬТАТ: Professional, trustworthy интерфейс для legal documents

---

## ЭТАП 5: РЕКЛАМНЫЕ РАЗМЕЩЕНИЯ

### Задача 18: Backend модель размещений

**Модуль**: Posts  
**Приоритет**: Критический  
**Зависимости**: Задача 14, 17  
**Время**: 60 минут  

**Файлы для создания**:
- `lib/repositories/post-repository.ts`
- `types/post.ts`
- `schemas/post-schema.ts`
- `utils/post-validation.ts`
- `lib/services/media-upload-service.ts`

**Описание**:
Создание модели данных для рекламных размещений. Включает контент, медиафайлы, информацию о рекламодателе, связь с договором и каналом.

**Технические требования**:
- Единая модель для всего размещения
- Статусы: черновик, запланировано, опубликовано
- Связи с каналами и договорами
- Поля для ОРД (ИНН, название, описание товара)
- Медиафайлы и текстовый контент

**Критерии готовности**:
- [ ] Таблица размещений создана
- [ ] Repository методы работают
- [ ] Статусы отслеживаются
- [ ] Связи с каналами и договорами
- [ ] Media upload система работает

**Промт**:
Создай backend модель данных для рекламных размещений в TGeasy.

ЦЕЛЬ: Центральная сущность системы - рекламное размещение с контентом, медиа, ОРД данными.

ФАЙЛЫ:
- lib/repositories/post-repository.ts (работа с БД)
- types/post.ts (типы размещений)
- schemas/post-schema.ts (Zod валидация)
- utils/post-validation.ts (валидация данных)
- lib/services/media-upload-service.ts (загрузка медиа)

СТРУКТУРА РАЗМЕЩЕНИЯ:
- Основные: content, media_urls, channel_id, contract_id
- ОРД данные: advertiser_inn, advertiser_name, product_description, erid
- Статусы: draft, scheduled, published, failed
- ОРД статусы: pending, registered, failed
- Планирование: scheduled_at, published_at, telegram_message_id

СТАТУСЫ ЖИЗНЕННОГО ЦИКЛА:
1. draft → пользователь редактирует
2. scheduled → запланировано к публикации
3. published → опубликовано в Telegram
4. failed → ошибка при публикации

REPOSITORY МЕТОДЫ:
- create, getById, getByUserId, getByChannelId
- update, delete, updateStatus
- getScheduledPosts, search

ВАЛИДАЦИЯ:
- content: 1-4000 символов
- advertiser_inn: российский формат (10/12 цифр)
- media_urls: максимум 10 файлов
- scheduled_at: не в прошлом

МЕДИАФАЙЛЫ:
- Изображения: JPEG, PNG, WebP (до 20MB)
- Видео: MP4, MOV, AVI (до 50MB)
- Документы: PDF (до 20MB)
- Автоматическое сжатие + thumbnail генерация

ИНДЕКСЫ:
- user_id + status для списков
- channel_id + published_at для аналитики
- scheduled_at для scheduler
- ord_status для ОРД интеграции

РЕЗУЛЬТАТ: Robust модель поддерживающая весь жизненный цикл размещений

---

### Задача 19: API рекламных размещений

**Модуль**: Posts  
**Приоритет**: Критический  
**Зависимости**: Задача 18  
**Время**: 90 минут  

**Файлы для создания**:
- `app/api/posts/route.ts`
- `app/api/posts/[id]/route.ts`
- `app/api/posts/[id]/media/route.ts`
- `app/api/posts/[id]/schedule/route.ts`
- `lib/services/post-service.ts`
- `lib/services/scheduler-service.ts`
- `lib/services/preview-service.ts`

**Описание**:
REST API для управления рекламными размещениями. CRUD операции, управление статусами, планирование, preview.

**Технические требования**:
- RESTful API design
- Input validation с Zod
- Permission checks
- Status workflow
- Scheduling system
- Preview generation

**Критерии готовности**:
- [ ] CRUD операции работают
- [ ] Валидация входных данных
- [ ] Права доступа проверяются
- [ ] Статусы обновляются корректно
- [ ] Scheduling API работает
- [ ] Preview генерируется

**Промт**:
Создай comprehensive REST API для управления рекламными размещениями в TGeasy.

ФАЙЛЫ:
- app/api/posts/route.ts (основные CRUD)
- app/api/posts/[id]/route.ts (операции с конкретным размещением)
- app/api/posts/[id]/media/route.ts (управление медиа)
- app/api/posts/[id]/schedule/route.ts (планирование)
- lib/services/post-service.ts (бизнес-логика)
- lib/services/scheduler-service.ts (планировщик)
- lib/services/preview-service.ts (генерация превью)

API ENDPOINTS:

GET /api/posts:
- Список с фильтрацией (status, channel_id, date_range, search)
- Пагинация (page, limit, total)
- Сортировка по дате, статусу

POST /api/posts:
- Создание размещения
- Валидация всех полей
- Связывание с каналом и договором

GET/PUT/DELETE /api/posts/[id]:
- Получение детальной информации
- Обновление (только draft статус)
- Soft delete с cleanup

POST /api/posts/[id]/media:
- Загрузка медиафайлов (FormData)
- Progress tracking
- Validation размера и формата

POST /api/posts/[id]/schedule:
- Планирование публикации
- Валидация времени
- Conflict detection

POST /api/posts/[id]/publish:
- Немедленная публикация
- Проверка готовности (ОРД статус)
- Telegram API integration

GET /api/posts/[id]/preview:
- Генерация превью для Telegram
- Character count + media count
- Estimated reach

SERVICES:

PostService:
- createPost, updatePost, deletePost
- schedulePost, publishPost, duplicatePost
- getPostAnalytics

SchedulerService:
- schedulePost, cancelScheduledPost
- getScheduledPosts, processScheduledPosts
- reschedulePost

PreviewService:
- generatePreview, estimateReach
- validateContent, formatForTelegram

ВАЛИДАЦИЯ:
- Права доступа к каналу
- ИНН рекламодателя
- Лимиты подписки пользователя
- Content moderation (базовые проверки)

RATE LIMITING:
- 100 posts/hour для создания
- 1000 requests/hour для чтения
- 10 media uploads/minute

РЕЗУЛЬТАТ: Production-ready API с comprehensive error handling

---

### Задача 20: API интеграция для размещений

**Модуль**: Posts  
**Приоритет**: Критический  
**Зависимости**: Задача 19  
**Время**: 75 минут  

**Файлы для создания**:
- `hooks/use-posts.ts`
- `hooks/use-post-form.ts`
- `hooks/use-scheduler.ts`
- `hooks/use-post-preview.ts`
- `lib/api/posts-api.ts`
- `types/post-ui.ts`
- `utils/post-helpers.ts`

**Описание**:
React hooks и API клиент для работы с размещениями. Подготовка для UI генерации через MCP.

**Технические требования**:
- Comprehensive hooks для CRUD операций
- Form state management hooks
- File upload progress tracking
- Real-time validation
- Optimistic updates
- Scheduling hooks

**Критерии готовности**:
- [ ] Хуки предоставляют типизированные данные
- [ ] Form hooks управляют состоянием
- [ ] File upload с progress tracking
- [ ] Validation hooks работают
- [ ] Scheduling hooks готовы
- [ ] Ready для MCP UI integration

**Промт**:
Создай React hooks и API клиент для работы с размещениями в TGeasy frontend.

ФАЙЛЫ:
- hooks/use-posts.ts (основной хук)
- hooks/use-post-form.ts (управление формой)
- hooks/use-scheduler.ts (планирование)
- hooks/use-post-preview.ts (превью)
- lib/api/posts-api.ts (API клиент)
- types/post-ui.ts (типы для UI)
- utils/post-helpers.ts (вспомогательные функции)

ОСНОВНЫЕ HOOKS:

usePosts(filters):
- posts, loading, error, refetch, loadMore, hasMore
- filters, setFilters
- createPost, updatePost, deletePost, duplicatePost

usePostForm(postId?):
- formData, setFormData, errors, isValid, isDirty
- save, reset, autoSave
- uploadMedia, removeMedia, mediaUploading, mediaProgress

useScheduler():
- schedule, unschedule, reschedule
- scheduledPosts, isScheduling
- getAvailableSlots, validateScheduleTime

usePostPreview(postData):
- preview, loading, generatePreview
- estimatedReach, characterCount, mediaCount
- refreshPreview

usePost(id):
- post, loading, error
- update, delete, publish, schedule, duplicate
- analytics

ФУНКЦИОНАЛЬНОСТЬ:

FORM MANAGEMENT:
- Real-time validation с debouncing
- Auto-save каждые 30 секунд
- Form state persistence в localStorage
- Optimistic updates
- Undo/Redo для content editing

MEDIA UPLOAD:
- Drag & drop с multiple files
- Progress tracking для каждого файла
- Preview generation для images/videos
- Error handling с retry
- Image compression перед upload

CONTENT EDITING:
- Rich text formatting support
- Telegram-specific formatting (bold, italic, links)
- Character counter с Telegram limits
- Hashtag и mention suggestions
- ERID автоматическая вставка

API CLIENT:
- getPosts, createPost, getPost, updatePost, deletePost
- uploadMedia, removeMedia
- schedulePost, publishPost, getPreview, duplicatePost

HELPERS:
- formatTelegramContent (markdown → HTML)
- validateINN (российский формат)
- getTelegramCharacterCount
- optimizeImage

РЕЗУЛЬТАТ: Hooks обеспечивающие smooth, responsive UX

---

### Задача 21: UI создания размещений через MCP

**Модуль**: Posts  
**Приоритет**: Критический  
**Зависимости**: Задача 6, 20  
**Время**: 120 минут  

**Файлы для создания**:
- `docs/ui-requirements/posts-form.md`
- `app/(dashboard)/posts/new/page.tsx` (через MCP)
- `components/posts/` (сгенерированные через MCP)
- `configs/mcp-posts-form.json`

**Описание**:
Генерация UI для создания рекламных размещений через MCP. Единая форма со всеми полями.

**Технические требования**:
- Comprehensive form UI requirements
- Media upload interface
- Contract selector integration
- Real-time preview
- Scheduling interface
- Validation UI

**Критерии готовности**:
- [ ] UI requirements документированы
- [ ] Форма сгенерирована через MCP
- [ ] Media upload interface работает
- [ ] Contract selector интегрирован
- [ ] Real-time preview функционирует
- [ ] Scheduling UI работает

**Промт**:
Создай comprehensive UI для создания рекламных размещений используя 21st.dev MCP.

ЦЕЛЬ: Intuitive, powerful interface для создания engaging рекламных размещений.

ФАЙЛЫ:
- docs/ui-requirements/posts-form.md (детальные требования для MCP)
- app/(dashboard)/posts/new/page.tsx (через MCP)
- components/posts/ (через MCP)
- configs/mcp-posts-form.json

UI REQUIREMENTS (posts-form.md):

LAYOUT (/posts/new):
- Split-screen: Editor (60%) + Preview (40%)
- Collapsible sidebar с настройками
- Floating action bar с primary actions
- Progress indicator для multi-step process

EDITOR SECTION:
- Content textarea с rich formatting toolbar
- Telegram-specific formatting shortcuts
- Character counter с visual indicator
- Auto-save indicator с timestamp
- Media upload zone integrated

PREVIEW SECTION:
- Live Telegram-style preview
- Channel branding display
- Estimated reach показ
- ERID placement preview
- Mobile/Desktop preview toggle

CORE COMPONENTS:

PostEditor:
- Rich text с Telegram formatting
- Toolbar: Bold, Italic, Code, Link
- Keyboard shortcuts (Ctrl+B, Ctrl+I)
- Auto-resize textarea
- Word/character counters

MediaUploadZone:
- Large drag & drop area
- Multiple file selection
- Preview thumbnails с remove buttons
- Upload progress bars
- Error states с retry options

ChannelSelector:
- Dropdown с search
- Channel avatars + subscriber counts
- Permission indicators
- Recent channels shortcuts

ContractSelector:
- Integration с contract selector component
- Quick preview on hover
- Recent contracts suggestions
- Optional field с clear indication

AdvertiserInfo:
- ИНН input с real-time validation
- Advertiser name с autocomplete
- Product description textarea
- ОРД compliance indicators

SchedulingPanel:
- Date & time picker
- Time zone indication
- Optimal posting time suggestions
- Calendar view с existing posts

PREVIEW SYSTEM:
- Authentic Telegram message styling
- Channel name и avatar
- Content rendering с formatting
- Media gallery preview
- ERID marking display

ИНТЕРАКТИВНОСТЬ:
- Live preview updates при typing
- Auto-save every 30 seconds
- Validation feedback immediate
- Real-time character counter

WORKFLOW STATES:
- Draft с auto-save
- Validation с progress bar
- Publishing с confirmation

RESPONSIVE:
- Desktop: Split-screen
- Tablet: Stacked с tabs
- Mobile: Single column с bottom sheet preview

КОМПОНЕНТЫ для генерации:
PostCreationPage, PostEditor, MediaUploadZone, TelegramPreview,
ChannelSelector, ContractSelector, AdvertiserInfoForm, SchedulingPanel,
PostFormActions, ValidationSummary, AutoSaveIndicator, CharacterCounter

РЕЗУЛЬТАТ: Intuitive, powerful creation interface

---

### Задача 22: UI управления размещениями через MCP

**Модуль**: Posts  
**Приоритет**: Критический  
**Зависимости**: Задача 21  
**Время**: 90 минут  

**Файлы для создания**:
- `docs/ui-requirements/posts-list.md`
- `app/(dashboard)/posts/page.tsx` (через MCP)
- `app/(dashboard)/posts/[id]/edit/page.tsx` (через MCP)
- `components/posts/list-components/` (через MCP)
- `configs/mcp-posts-list.json`

**Описание**:
Генерация UI для списка и управления размещениями через MCP. Фильтрация, поиск, редактирование.

**Технические требования**:
- List interface requirements
- Filtering и search UI
- Status management interface
- Edit form integration
- Bulk operations UI

**Критерии готовности**:
- [ ] List UI requirements документированы
- [ ] Список сгенерирован через MCP
- [ ] Фильтрация и поиск работают
- [ ] Edit interface функционирует
- [ ] Bulk operations UI готов

**Промт**:
Создай comprehensive UI для управления списком размещений используя 21st.dev MCP.

ЦЕЛЬ: Efficient, user-friendly interface для management рекламных размещений.

ФАЙЛЫ:
- docs/ui-requirements/posts-list.md (требования для списка)
- app/(dashboard)/posts/page.tsx (через MCP)
- app/(dashboard)/posts/[id]/edit/page.tsx (через MCP)
- components/posts/list-components/ (через MCP)
- configs/mcp-posts-list.json

UI REQUIREMENTS (posts-list.md):

ГЛАВНАЯ СТРАНИЦА (/posts):
- Header: "Размещения" с total count
- Primary CTA "Создать размещение"
- Quick stats: Published, Scheduled, Drafts
- Bulk actions toolbar

FILTERS & SEARCH:
- Global search с debouncing
- Status filter chips: Все, Черновики, Запланировано, Опубликовано
- Channel filter dropdown
- Date range picker
- ОРД status filter

POSTS LIST:
- Table view (default) и Card view toggle
- Sortable columns
- Infinite scroll loading
- Bulk selection checkboxes

TABLE COLUMNS:
- Selection checkbox
- Content preview (первые 100 символов)
- Channel (avatar + name)
- Status (badge + ОРД status)
- Schedule (published/scheduled date)
- Analytics (views/clicks если published)
- Actions dropdown

CARD VIEW:
- Compact card layout
- Content preview с media thumbnail
- Channel branding
- Status indicators
- Quick action buttons

BULK OPERATIONS:
- Selection counter (X из Y выбрано)
- Bulk actions: Publish, Schedule, Delete, Export
- Progress indicators для batch operations

QUICK ACTIONS:
- Edit, Duplicate, View Analytics
- Publish Now (если draft)
- Reschedule (если scheduled)
- Delete с confirmation

EDIT PAGE (/posts/[id]/edit):
- Same layout как creation
- Pre-filled form data
- Version history sidebar
- Change tracking indicators

PERFORMANCE:
- Virtual scrolling для больших списков
- Skeleton loader components
- Progressive loading

RESPONSIVE:
- Desktop: Full table layout
- Tablet: Simplified table
- Mobile: Card layout enforced

КОМПОНЕНТЫ для генерации:
PostsListPage, PostsTable, PostCard, PostFilters, PostSearch,
BulkActionsToolbar, PostActions, StatusBadge, PostsGrid,
EmptyPostsState, PostLoadingSkeleton, PostEditPage

РЕЗУЛЬТАТ: Efficient interface для management размещений

---

## ЭТАП 6: ИНТЕГРАЦИИ

### Задача 23: ОРД Яндекса - базовая интеграция

**Модуль**: Integrations  
**Приоритет**: Критический  
**Зависимости**: Задача 19  
**Время**: 90 минут  

**Файлы для создания**:
- `lib/integrations/ord/client.ts`
- `lib/integrations/ord/types.ts`
- `lib/integrations/ord/service.ts`
- `app/api/ord/register/route.ts`
- `utils/ord-helpers.ts`

**Описание**:
Базовая интеграция с ОРД Яндекса. Регистрация креативов, получение ERID кодов, обработка ошибок.

**Технические требования**:
- ОРД API client
- Автоматическая регистрация креативов
- Error handling и retry logic
- ERID code management
- Status tracking

**Критерии готовности**:
- [ ] API клиент подключается к ОРД
- [ ] Креативы регистрируются успешно
- [ ] ERID коды получаются
- [ ] Ошибки обрабатываются
- [ ] Статус регистрации отслеживается

**Промт**:
Создай интеграцию с ОРД Яндекса для автоматической регистрации рекламных креативов.

ЦЕЛЬ: Каждое размещение регистрируется в ОРД и получает ERID код для публикации.

ФАЙЛЫ:
- lib/integrations/ord/client.ts (клиент ОРД API)
- lib/integrations/ord/types.ts (типы данных ОРД)
- lib/integrations/ord/service.ts (сервис для работы с ОРД)
- app/api/ord/register/route.ts (API endpoint)
- utils/ord-helpers.ts (вспомогательные функции)

ОРД API ИНТЕГРАЦИЯ:
- registerCreative(data) → получение ERID
- getCreativeStatus(erid) → проверка статуса
- updateCreative(erid, updates) → обновление данных
- getRegistrationHistory() → история регистраций

ДАННЫЕ ДЛЯ РЕГИСТРАЦИИ:
- advertiser_inn, advertiser_name (обязательно)
- product_description, creative_text (обязательно)
- placement_urls (ссылки на каналы)
- advertiser_ogrn, product_category (опционально)

WORKFLOW:
1. Пост создается с данными рекламодателя
2. Автоматическая регистрация в ОРД
3. Получение ERID кода
4. Добавление ERID к контенту
5. Обновление статуса поста

ERROR HANDLING:
- Retry logic с exponential backoff
- Классификация ошибок (retryable/non-retryable)
- Graceful degradation при недоступности ОРД
- Detailed error logging

ПЕРЕМЕННЫЕ:
- ORD_API_KEY, ORD_API_URL
- ORD_RETRY_ATTEMPTS, ORD_TIMEOUT

ВАЛИДАЦИЯ:
- ИНН формат (10/12 цифр)
- Минимальная длина описания товара (10 символов)
- Корректность названия рекламодателя

РЕЗУЛЬТАТ: Robust интеграция с качественной обработкой ошибок

---

### Задача 24: Автоматическая маркировка ОРД

**Модуль**: Integrations  
**Приоритет**: Критический  
**Зависимости**: Задача 23  
**Время**: 60 минут  

**Файлы для создания**:
- `lib/services/ord-marking-service.ts`
- `app/api/posts/[id]/ord-register/route.ts`
- `hooks/use-ord-status.ts`
- `utils/erid-formatter.ts`

**Описание**:
Автоматическая регистрация размещений в ОРД при создании и добавление ERID маркировки к контенту.

**Технические требования**:
- Автоматический trigger при создании поста
- ERID вставка в контент
- Status hooks для UI
- Manual retry mechanism
- Validation rules

**Критерии готовности**:
- [ ] Автоматическая регистрация работает
- [ ] ERID добавляется к контенту
- [ ] Status hooks предоставляют данные для UI
- [ ] Manual retry функционирует
- [ ] Валидация данных для ОРД

**Промт**:
Создай систему автоматической регистрации размещений в ОРД и добавления ERID маркировки.

ФАЙЛЫ:
- lib/services/ord-marking-service.ts (автоматическая маркировка)
- app/api/posts/[id]/ord-register/route.ts (API для регистрации)
- hooks/use-ord-status.ts (React hook для статуса ОРД)
- utils/erid-formatter.ts (форматирование ERID в контенте)

АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ:
1. Trigger при создании/обновлении поста
2. Валидация данных для ОРД
3. Регистрация в ОРД API
4. Добавление ERID к контенту (#рекламаОРД ERID)
5. Обновление ord_status в БД

AUTO-TRIGGER SYSTEM:
- handlePostCreate() → проверка нужности ОРД → добавление в очередь
- requiresORDRegistration() → проверка обязательных полей
- Queue processing с priority и retry

QUEUE PROCESSING:
- Batch processing для избежания rate limits
- Retry failed registrations с увеличивающимися интервалами
- Max attempts limit с final failure handling
- User notifications при критических ошибках

REACT HOOK для UI:
- useORDStatus(postId) → status, loading, error
- registerInORD(force) → manual retry
- checkStatus() → проверка актуального статуса
- isRegistered, erid состояния

ERID FORMATTER:
- addToContent(content, erid) → добавление маркировки
- removeFromContent(content) → удаление маркировки
- extractERID(content) → извлечение ERID
- validateERID(erid) → проверка формата

CRON JOB:
- Обработка очереди каждые 5 минут
- Retry failed registrations каждые 15 минут
- Health monitoring ОРД интеграции

РЕЗУЛЬТАТ: Reliable система автоматической ОРД регистрации

---

### Задача 25: Telegram Bot API - публикация

**Модуль**: Integrations  
**Приоритет**: Критический  
**Зависимости**: Задача 11, 22  
**Время**: 90 минут  

**Файлы для создания**:
- `lib/services/telegram-publisher.ts`
- `app/api/posts/[id]/publish/route.ts`
- `lib/jobs/scheduled-publisher.ts`
- `app/api/telegram/webhook/route.ts`
- `lib/jobs/post-scheduler.ts`
- `lib/services/cron-service.ts`

**Описание**:
Публикация размещений в Telegram каналы. Немедленная и запланированная публикация, обработка результатов.

**Технические требования**:
- Message formatting для Telegram
- Media attachment handling
- Scheduled publishing
- Webhook processing
- Cron job system

**Критерии готовности**:
- [ ] Посты публикуются в каналы
- [ ] Медиа прикрепляется корректно
- [ ] Запланированная публикация работает
- [ ] Webhook обрабатывается
- [ ] Cron система функционирует

**Промт**:
Создай систему публикации размещений в Telegram каналы через Bot API.

ФАЙЛЫ:
- lib/services/telegram-publisher.ts (сервис публикации)
- app/api/posts/[id]/publish/route.ts (API endpoint)
- lib/jobs/scheduled-publisher.ts (обработка запланированных)
- app/api/telegram/webhook/route.ts (webhook для уведомлений)
- lib/jobs/post-scheduler.ts (планировщик задач)
- lib/services/cron-service.ts (CRON система)

TELEGRAM PUBLISHER:
- publishPost(postId) → публикация размещения
- formatMessage(post) → форматирование для Telegram
- sendToChannel(channelId, message) → отправка сообщения
- handlePublishError(postId, error) → обработка ошибок

MESSAGE FORMATTING:
- Применение Telegram HTML разметки
- Добавление ERID маркировки
- Подготовка медиафайлов
- Обработка текста + медиа групп

PUBLISHING WORKFLOW:
1. Валидация готовности к публикации
2. Форматирование контента для Telegram
3. Отправка в канал через Bot API
4. Обновление статуса в БД
5. Сбор initial метрик

SCHEDULED PUBLISHER:
- processScheduledPosts() → обработка запланированных
- getReadyForPublishing() → посты готовые к публикации
- handleScheduledPublishError() → retry/failure logic

API ENDPOINTS:
- POST /api/posts/[id]/publish → немедленная публикация
- GET /api/posts/[id]/preview → превью как в Telegram

WEBHOOK HANDLER:
- Обработка Telegram webhook events
- handleChannelPostUpdate() → обновление аналитики
- handleChatMemberUpdate() → изменения статуса бота

CRON SERVICE:
- Обработка запланированных публикаций (каждую минуту)
- Retry неудачных публикаций (каждые 15 минут)
- Сбор аналитики (каждые 5 минут)

RATE LIMITING:
- 30 messages/second для Telegram API
- Per-channel rate limiting
- Queue management для burst traffic

ERROR RECOVERY:
- Классификация ошибок (retryable/permanent)
- Automatic retry с backoff
- User notification при критических ошибках
- Fallback strategies

РЕЗУЛЬТАТ: Robust система публикации с comprehensive error handling

---

### Задача 26: Webhook и мониторинг интеграций

**Модуль**: Integrations  
**Приоритет**: Высокий  
**Зависимости**: Задача 25  
**Время**: 90 минут  

**Файлы для создания**:
- `app/api/webhooks/telegram/route.ts`
- `lib/services/webhook-processor.ts`
- `lib/services/integration-monitor.ts`
- `lib/services/error-handler.ts`
- `lib/services/retry-service.ts`
- `app/api/admin/integrations/health/route.ts`
- `hooks/use-integration-status.ts`
- `utils/health-checks.ts`

**Описание**:
Обработка webhooks, мониторинг интеграций и система обработки ошибок.

**Технические требования**:
- Webhook signature validation
- Event processing
- Health monitoring
- Error categorization
- Retry mechanisms
- Alert system

**Критерии готовности**:
- [ ] Webhook обрабатывается корректно
- [ ] Health monitoring работает
- [ ] Error handling функционирует
- [ ] Retry logic работает
- [ ] Status hooks готовы для UI

**Промт**:
Создай систему обработки webhooks и мониторинга всех интеграций в TGeasy.

ФАЙЛЫ:
- app/api/webhooks/telegram/route.ts (Telegram webhooks)
- lib/services/webhook-processor.ts (обработчик webhooks)
- lib/services/integration-monitor.ts (мониторинг интеграций)
- lib/services/error-handler.ts (централизованная обработка ошибок)
- lib/services/retry-service.ts (система повторных попыток)
- app/api/admin/integrations/health/route.ts (health check endpoint)
- hooks/use-integration-status.ts (React hook для статуса)
- utils/health-checks.ts (утилиты проверки)

WEBHOOK PROCESSOR:
- Регистрация handlers для разных источников
- processWebhook(source, payload, signature) → обработка
- Валидация подписей webhook
- Event routing и logging

WEBHOOK HANDLERS:
- TelegramWebhookHandler → channel posts, member updates
- ORDWebhookHandler → status updates, notifications
- YooKassaWebhookHandler → payment events

INTEGRATION MONITOR:
- checkAllIntegrations() → health check всех систем
- checkTelegram() → Bot API availability
- checkORD() → ОРД API status
- checkSupabase() → database connectivity

HEALTH CHECKS:
- Response time measurement
- Error rate tracking
- Service availability monitoring
- Performance metrics collection

ERROR HANDLER:
- handleError(integration, operation, error, context)
- Error classification (network, auth, rate_limit, validation)
- Recovery strategy selection
- Notification routing

RETRY SERVICE:
- executeWithRetry(operation, options)
- Exponential/linear backoff strategies
- isRetryable(error) → retry eligibility
- Max attempts with failure handling

HEALTH CHECK API:
- GET /api/admin/integrations/health → статус всех интеграций
- Response: healthy/unhealthy с details
- HTTP status codes: 200 (healthy), 503 (unhealthy)

REACT HOOK:
- useIntegrationStatus() → status, loading, refresh
- Автоматическая проверка каждые 5 минут
- Real-time status updates

ALERTING SYSTEM:
- sendAlert(type, integration, message, severity)
- Multiple notification channels
- Severity-based routing
- Alert deduplication

MONITORING METRICS:
- Integration response times
- Error rates по типам
- Success/failure ratios
- Performance trends

РЕЗУЛЬТАТ: Comprehensive система мониторинга с proactive error detection

---

## ЭТАП 7: АНАЛИТИКА

### Задача 27: Backend аналитики

**Модуль**: Analytics  
**Приоритет**: Критический  
**Зависимости**: Задача 25  
**Время**: 120 минут  

**Файлы для создания**:
- `lib/services/analytics-collector.ts`
- `lib/integrations/telegram/analytics.ts`
- `app/api/analytics/collect/route.ts`
- `lib/jobs/analytics-updater.ts`
- `app/api/analytics/route.ts`
- `app/api/analytics/posts/[id]/route.ts`
- `app/api/analytics/channels/[id]/route.ts`
- `lib/services/analytics-service.ts`
- `lib/repositories/analytics-repository.ts`
- `types/analytics.ts`

**Описание**:
Полная система сбора и предоставления аналитических данных через Telegram Bot API.

**Технические требования**:
- Telegram API analytics integration
- Periodic data collection (каждые 15 минут)
- Aggregated metrics API
- Time-based filtering
- Performance optimization

**Критерии готовности**:
- [ ] Метрики собираются автоматически
- [ ] API возвращает агрегированные данные
- [ ] Фильтрация по времени работает
- [ ] Performance оптимизирован
- [ ] Historical data сохраняется

**Промт**:
Создай полную систему сбора и анализа аналитических данных для TGeasy.

ЦЕЛЬ: Сбор метрик размещений через Telegram Bot API, агрегация данных, предоставление аналитики.

ФАЙЛЫ:
- lib/services/analytics-collector.ts (сбор метрик из Telegram)
- lib/integrations/telegram/analytics.ts (Telegram API для аналитики)
- app/api/analytics/collect/route.ts (endpoint для сбора)
- lib/jobs/analytics-updater.ts (периодическое обновление)
- app/api/analytics/route.ts (API для получения аналитики)
- app/api/analytics/posts/[id]/route.ts (аналитика поста)
- app/api/analytics/channels/[id]/route.ts (аналитика канала)
- lib/services/analytics-service.ts (бизнес-логика)
- lib/repositories/analytics-repository.ts (работа с БД)
- types/analytics.ts (типы данных)

СТРУКТУРА ДАННЫХ:
- PostAnalytics: views, reaches, clicks, shares, reactions, demographics
- ChannelAnalytics: subscriber_count, avg_views_per_post, engagement_rate, growth_rate
- AnalyticsAggregation: total_views, total_clicks, top_channels, performance_trend

ANALYTICS COLLECTOR:
- collectPostAnalytics(postId) → получение метрик из Telegram
- collectChannelAnalytics(channelId) → статистика канала
- bulkCollectAnalytics(filter) → batch processing с rate limiting

TELEGRAM ANALYTICS:
- getPostMetrics(chatId, messageId) → views, forwards, reactions
- getSubscriberCount(chatId) → количество подписчиков
- estimateReach() и estimateClicks() → дополнительные метрики

ANALYTICS SERVICE:
- getPostAnalytics(postId, dateRange) → отчет по посту
- getChannelAnalytics(channelId, dateRange) → отчет по каналу
- getDashboardAnalytics(userId, dateRange) → общий dashboard
- calculateDerivedMetrics() → CTR, engagement rate, virality rate

ANALYTICS UPDATER JOB:
- runPeriodicUpdate() → обновление каждые 15 минут
- getRecentPublishedPosts() → посты за последние 7 дней
- updatePostsAnalytics() и updateChannelsAnalytics()
- cleanupOldAnalytics() → очистка старых данных

API ENDPOINTS:
- GET /api/analytics → dashboard аналитика
- POST /api/analytics/collect → принудительный сбор
- GET /api/analytics/posts/[id] → аналитика поста
- GET /api/analytics/channels/[id] → аналитика канала

CRON JOBS:
- Analytics update каждые 15 минут
- Daily reports генерация в 9:00
- Cleanup old data еженедельно

РЕЗУЛЬТАТ: Robust система аналитики с efficient data collection

---

### Задача 28: Экспорт и публичные ссылки

**Модуль**: Analytics  
**Приоритет**: Критический  
**Зависимости**: Задача 27  
**Время**: 105 минут  

**Файлы для создания**:
- `lib/services/excel-export-service.ts`
- `app/api/analytics/export/route.ts`
- `utils/excel-formatters.ts`
- `lib/services/public-links-service.ts`
- `app/api/analytics/public-links/route.ts`
- `app/public-stats/[linkId]/page.tsx`
- `lib/repositories/public-links-repository.ts`

**Описание**:
Система экспорта данных в Excel и создания публичных ссылок для рекламодателей.

**Технические требования**:
- Excel file generation
- Custom date ranges
- Secure public link generation
- Branded public pages
- Expiration date handling

**Критерии готовности**:
- [ ] Excel файлы генерируются корректно
- [ ] Public links создаются безопасно
- [ ] Public pages оформлены
- [ ] Expiration dates соблюдаются
- [ ] Export functionality работает

**Промт**:
Создай систему экспорта аналитических данных в Excel и генерации публичных ссылок.

ФАЙЛЫ:
- lib/services/excel-export-service.ts (генерация Excel отчетов)
- app/api/analytics/export/route.ts (API для экспорта)
- utils/excel-formatters.ts (форматирование данных)
- lib/services/public-links-service.ts (управление публичными ссылками)
- app/api/analytics/public-links/route.ts (API для публичных ссылок)
- app/public-stats/[linkId]/page.tsx (публичная страница)
- lib/repositories/public-links-repository.ts (работа с БД)

EXCEL EXPORT:
- exportAnalytics(exportRequest) → генерация Excel файла
- addOverviewSheet() → лист с общими метриками
- addPostsSheet() → детальная таблица размещений
- addChannelsSheet() → статистика каналов
- addTrendsSheet() → графики трендов

EXCEL СТРУКТУРА:
- Overview: основные метрики, период, топ каналы
- Posts: таблица всех размещений с метриками
- Channels: сравнение каналов по показателям
- Trends: данные для построения графиков
- Форматирование: стили, цвета, формулы

PUBLIC LINKS:
- createPublicLink(request) → создание защищенной ссылки
- getPublicLinkData(linkId, password) → получение данных
- generatePublicAnalytics(config) → аналитика для публичного показа

PUBLIC LINK FEATURES:
- Password protection (опционально)
- Expiration date
- View limit
- Download enabled/disabled
- Custom branding (logo, colors, company name)

PUBLIC ANALYTICS PAGE:
- Branded публичная страница
- Ограниченные метрики для рекламодателей
- Password prompt если защищена
- Download button если разрешено

API ENDPOINTS:
- POST /api/analytics/export → генерация Excel
- POST /api/analytics/public-links → создание ссылки
- GET /api/analytics/public-links → список ссылок пользователя
- POST /api/public-stats/[linkId] → доступ к публичным данным

БЕЗОПАСНОСТЬ:
- Secure link ID generation (crypto.randomBytes)
- Password hashing для защищенных ссылок
- Access logging и view counting
- Expiration date enforcement

РЕЗУЛЬТАТ: Professional система экспорта с branded public links

---

### Задача 29: API интеграция аналитики

**Модуль**: Analytics  
**Приоритет**: Критический  
**Зависимости**: Задача 28  
**Время**: 60 минут  

**Файлы для создания**:
- `hooks/use-analytics.ts`
- `hooks/use-post-analytics.ts`
- `hooks/use-channel-analytics.ts`
- `hooks/use-export.ts`
- `hooks/use-public-links.ts`
- `lib/api/analytics-api.ts`
- `utils/analytics-helpers.ts`

**Описание**:
React hooks для работы с аналитикой. Подготовка для UI генерации через MCP.

**Технические требования**:
- Real-time analytics hooks
- Date range filtering hooks
- Chart data formatting
- Export functionality hooks
- Public links management hooks

**Критерии готовности**:
- [ ] Hooks предоставляют real-time данные
- [ ] Date filtering работает seamlessly
- [ ] Chart data правильно форматируется
- [ ] Export hooks готовы
- [ ] Public links hooks функционируют
- updateSettings(newSettings) → обновление настроек
- resetToDefaults() → сброс к дефолтам
- testNotification(type, channel) → тестовая отправка

useNotifications():
- notifications, loading, error
- markAsRead(notificationId) → отметка как прочитанная
- markAllAsRead() → отметка всех
- deleteNotification(id) → удаление
- getUnreadCount() → количество непрочитанных

useNotificationPreferences():
- preferences, loading, error
- updatePreference(type, enabled) → включение/выключение типа
- setChannelPreference(type, channel) → выбор канала для типа
- setFrequency(type, frequency) → частота уведомлений

useNotificationTest():
- testing, error
- sendTestNotification(type, channel) → тестовая отправка
- validateSettings() → проверка настроек

NOTIFICATION MANAGEMENT:
- Real-time уведомления через WebSocket/SSE
- In-app notification center
- Push notifications поддержка (подготовка)
- Notification history с фильтрацией

API CLIENT:
- getNotificationSettings(), updateNotificationSettings()
- getNotifications(), markNotificationAsRead()
- sendTestNotification(), getNotificationTemplates()

UI HELPERS:
- formatNotificationTime() → "2 минуты назад"
- getNotificationIcon(type) → иконка для типа
- getNotificationColor(type) → цвет для важности
- groupNotificationsByDate() → группировка по дате

NOTIFICATION TYPES UI:
- Success: зеленый, checkmark icon
- Error: красный, error icon  
- Warning: желтый, warning icon
- Info: синий, info icon
- Marketing: фиолетовый, star icon

REAL-TIME UPDATES:

WebSocket connection для live уведомлений
Toast notifications для важных событий
Badge counter для unread notifications
Sound notifications (опционально)

РЕЗУЛЬТАТ: Seamless notification experience с full user control

---

### Задача 38: UI настроек уведомлений через MCP

**Модуль**: Notifications  
**Приоритет**: Средний  
**Зависимости**: Задача 6, 37  
**Время**: 60 минут  

**Файлы для создания**:
- `docs/ui-requirements/notifications.md`
- `app/(dashboard)/settings/notifications/page.tsx` (через MCP)
- `components/notifications/` (сгенерированные через MCP)
- `configs/mcp-notifications.json`

**Описание**:
Генерация UI для настроек уведомлений через MCP.

**Технические требования**:
- Settings interface requirements
- Notification preference controls
- Template management UI
- Delivery tracking interface
- Test notification functionality

**Критерии готовности**:
- [ ] UI requirements документированы
- [ ] Settings UI сгенерирован через MCP
- [ ] Preference controls работают
- [ ] Template management доступен
- [ ] Test notifications функционируют

**Промт**:
Создай comprehensive UI для настроек уведомлений используя 21st.dev MCP.
ЦЕЛЬ: User-friendly interface для полного контроля над уведомлениями.
ФАЙЛЫ:

docs/ui-requirements/notifications.md (детальные требования для MCP)
app/(dashboard)/settings/notifications/page.tsx (страница настроек через MCP)
components/notifications/ (компоненты уведомлений через MCP)
configs/mcp-notifications.json (конфигурация MCP)

UI REQUIREMENTS (notifications.md):
ГЛАВНАЯ СТРАНИЦА (/settings/notifications):

Settings Header: "Настройки уведомлений" + test notification button
Notification Categories: группировка по типам (System, Marketing, Analytics)
Global Controls: "Включить все", "Отключить все", "Сбросить к умолчаниям"
Save Indicator: автосохранение с индикатором

NOTIFICATION CATEGORIES:
System Notifications:

Post Published ✅ Telegram + Email, Мгновенно
Post Failed ❌ Telegram, Мгновенно
ОРД Registered 🏷️ Telegram, Мгновенно
Channel Disconnected 📱 Telegram + Email, Мгновенно

Marketing Notifications:

Feature Updates 🆕 Email, Еженедельно
Tips & Tutorials 💡 Email, Еженедельно
Product News 📢 Email, Ежемесячно

Analytics Reports:

Daily Digest 📊 Email, Ежедневно
Weekly Summary 📈 Email, Еженедельно
Monthly Report 📋 Email, Ежемесячно

CONTROL COMPONENTS:
NotificationToggle:

Toggle switch с smooth animation
Disabled state для обязательных уведомлений
Loading state при сохранении

ChannelSelector:

Checkbox group: Telegram, Email
Icons для каждого канала
Disabled options если канал недоступен

FrequencySelector:

Radio buttons: Мгновенно, Ежедневно, Еженедельно, Ежемесячно
Contextual descriptions для каждой частоты

TestNotificationButton:

"Отправить тест" button
Loading state при отправке
Success/error feedback

NOTIFICATION CENTER:

In-app notification list
Real-time updates с WebSocket
Mark as read functionality
Notification history с фильтрацией
Clear all button

DO NOT DISTURB:

Time period selector
Timezone awareness
Emergency override settings
Weekend/weekday differences

DELIVERY STATUS:

DeliveryStatus indicator для каждого типа
Last sent timestamp
Failed delivery warnings
Retry failed deliveries button

ИНТЕРАКТИВНОСТЬ:

Auto-save changes без кнопки "Сохранить"
Real-time validation feedback
Preview changes before saving
Undo last change option

ACCESSIBILITY:

Screen reader friendly controls
High contrast mode support
Keyboard navigation
Clear labeling для all controls

RESPONSIVE:

Desktop: side-by-side layout с categories
Tablet: stacked categories с collapsible sections
Mobile: single column с priority settings first

КОМПОНЕНТЫ для генерации:
NotificationSettingsPage, NotificationCategories, NotificationToggle,
ChannelSelector, FrequencySelector, TestNotificationButton,
NotificationCenter, DoNotDisturbSettings, DeliveryStatus,
NotificationHistory, NotificationPreview
РЕЗУЛЬТАТ: Intuitive, comprehensive interface для notification management

---

## ЭТАП 10: ФИНАЛЬНАЯ ПОЛИРОВКА

### Задача 39: Оптимизация производительности

**Модуль**: Infrastructure  
**Приоритет**: Высокий  
**Зависимости**: Задача 34  
**Время**: 90 минут  

**Файлы для создания**:
- `lib/performance/optimization.ts`
- `utils/caching-strategies.ts`
- `configs/performance-config.ts`
- `docs/performance-guidelines.md`

**Описание**:
Комплексная оптимизация производительности приложения на frontend и backend.

**Технические требования**:
- Image optimization
- Code splitting optimization
- API response caching
- Database query optimization
- Bundle size analysis

**Критерии готовности**:
- [ ] Page load times < 2 секунд
- [ ] API response times < 500ms
- [ ] Bundle размеры оптимизированы
- [ ] Database queries эффективны
- [ ] Caching стратегии работают

**Промт**:
Создай комплексную оптимизацию производительности TGeasy для production.

ЦЕЛЬ: Page load times < 2 секунд, API response times < 500ms, optimal user experience.

ФАЙЛЫ:
- lib/performance/optimization.ts (оптимизация утилиты)
- utils/caching-strategies.ts (стратегии кеширования)
- configs/performance-config.ts (конфигурация производительности)
- docs/performance-guidelines.md (руководство по производительности)

FRONTEND ОПТИМИЗАЦИЯ:
- Image optimization: WebP conversion, lazy loading, responsive images
- Code splitting: dynamic imports, route-based splitting, component lazy loading
- Bundle analysis: webpack-bundle-analyzer, unused code elimination
- CSS optimization: critical CSS inlining, unused CSS removal
- Font optimization: preload, font-display swap

CACHING STRATEGIES:
- Browser caching: static assets с long TTL
- Service Worker: offline support, background sync
- React Query: server state caching с stale-while-revalidate
- CDN caching: Vercel Edge Network optimization
- Database query caching: Redis для frequently accessed data

API OPTIMIZATION:
- Database query optimization: proper indexing, query analysis
- Response compression: gzip/brotli compression
- API response caching: Redis/Vercel KV
- Pagination optimization: cursor-based для больших datasets
- Batch API requests: reduce round trips

PERFORMANCE MONITORING:
- Web Vitals tracking: LCP, CLS, FID measurement
- Real User Monitoring: performance metrics collection
- Synthetic monitoring: automated performance testing
- Error tracking: Sentry integration
- Analytics: user behavior analysis

OPTIMIZATION TECHNIQUES:
- Virtual scrolling для больших списков
- Intersection Observer для lazy loading
- RequestIdleCallback для non-critical tasks
- Web Workers для heavy computations
- Preloading critical resources

PERFORMANCE BUDGETS:
- Bundle size limits: main bundle < 250KB
- Image size limits: optimized images < 100KB
- API response time: < 500ms for 95th percentile
- Page load time: < 2 seconds for 95th percentile

РЕЗУЛЬТАТ: Production-ready performance с monitoring и optimization

---

### Задача 40: Comprehensive тестирование

**Модуль**: Testing  
**Приоритет**: Критический  
**Зависимости**: Задача 39  
**Время**: 120 минут  

**Файлы для создания**:
- `tests/unit/` (unit тесты)
- `tests/integration/` (integration тесты)
- `tests/e2e/` (end-to-end тесты)
- `configs/testing-config.ts`
- `docs/testing-strategy.md`

**Описание**:
Полное покрытие приложения тестами для обеспечения качества и надежности.

**Технические требования**:
- Unit tests для всех сервисов
- Integration tests для API
- E2E tests для critical paths
- Test coverage > 80%
- CI/CD integration

**Критерии готовности**:
- [ ] Unit tests покрывают 80%+ кода
- [ ] Integration tests проходят
- [ ] E2E tests покрывают main flows
- [ ] CI/CD pipeline настроен
- [ ] Test documentation создана

**Промт**:
Создай полное покрытие TGeasy тестами для обеспечения качества и надежности.

ЦЕЛЬ: Test coverage > 80%, automated testing pipeline, bug-free production deployment.

ФАЙЛЫ:
- tests/unit/ (unit тесты для всех компонентов)
- tests/integration/ (integration тесты для API)
- tests/e2e/ (end-to-end тесты для critical paths)
- configs/testing-config.ts (конфигурация тестирования)
- docs/testing-strategy.md (стратегия тестирования)

UNIT TESTING:
- React components: Jest + React Testing Library
- Services и utilities: comprehensive coverage
- API handlers: request/response validation
- Business logic: edge cases coverage
- Error handling: exception scenarios

INTEGRATION TESTING:
- API endpoints: request/response integration
- Database operations: CRUD operations validation
- External integrations: Telegram API, ОРД, ЮКасса mocking
- Authentication flow: complete auth cycle testing
- File upload: multipart form data handling

E2E TESTING:
- User registration → channel connection → post creation → publication
- Payment flow → subscription activation → feature access
- Analytics collection → export generation → public link sharing
- Error scenarios → recovery mechanisms → user feedback

TESTING INFRASTRUCTURE:
- Test database: isolated test environment
- Mock services: external API mocking
- Test fixtures: realistic test data
- CI/CD integration: automated test runs
- Test reporting: coverage reports, test results

PERFORMANCE TESTING:
- Load testing: concurrent user simulation
- Stress testing: system limits identification
- API rate limiting: throttling verification
- Database performance: query optimization validation

SECURITY TESTING:
- Authentication bypass attempts
- Authorization privilege escalation
- Input validation: SQL injection, XSS
- File upload security: malicious file detection
- API security: rate limiting, CORS validation

TEST AUTOMATION:
- GitHub Actions: automated test runs
- Pre-commit hooks: test validation
- Deployment gates: test passage requirements
- Regression testing: automated on releases

КАЧЕСТВО КОДА:
- ESLint: code quality rules
- TypeScript: strict type checking
- Prettier: code formatting consistency
- SonarQube: code quality analysis (опционально)

РЕЗУЛЬТАТ: Robust testing infrastructure с high confidence в code quality

---

### Задача 41: Security audit и hardening

**Модуль**: Security  
**Приоритет**: Критический  
**Зависимости**: Задача 40  
**Время**: 75 минут  

**Файлы для создания**:
- `docs/security-audit.md`
- `configs/security-config.ts`
- `lib/security/validators.ts`
- `utils/security-helpers.ts`

**Описание**:
Комплексный security audit и укрепление безопасности приложения.

**Технические требования**:
- Input validation hardening
- SQL injection prevention
- XSS protection
- CSRF tokens implementation
- Rate limiting enhancement

**Критерии готовности**:
- [ ] Security vulnerabilities исправлены
- [ ] Input validation усилена
- [ ] Protection mechanisms работают
- [ ] Rate limiting настроен
- [ ] Security documentation обновлена

**Промт**:
Создай comprehensive security audit и укрепление безопасности TGeasy.

ЦЕЛЬ: Production-ready security с защитой от common vulnerabilities.

ФАЙЛЫ:
- docs/security-audit.md (аудит безопасности)
- configs/security-config.ts (конфигурация безопасности)
- lib/security/validators.ts (валидаторы безопасности)
- utils/security-helpers.ts (утилиты безопасности)

SECURITY AUDIT CHECKLIST:

AUTHENTICATION & AUTHORIZATION:
- JWT token security: proper signing, expiration
- Session management: secure cookies, CSRF protection
- Password security: hashing, complexity requirements
- OAuth security: state parameter, PKCE implementation
- Role-based access: proper permission checks

INPUT VALIDATION:
- SQL injection prevention: parameterized queries, ORM usage
- XSS protection: input sanitization, CSP headers
- File upload security: type validation, size limits, virus scanning
- API input validation: Zod schemas, type checking
- Path traversal prevention: file access restrictions

DATA PROTECTION:
- Encryption at rest: sensitive data encryption
- Encryption in transit: HTTPS enforcement, TLS configuration
- Personal data handling: GDPR compliance preparation
- API key management: environment variables, rotation
- Database security: connection encryption, access controls

SECURITY HEADERS:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options: clickjacking protection
- X-Content-Type-Options: MIME type validation
- Referrer-Policy: information leakage prevention

RATE LIMITING & DDOS PROTECTION:
- API rate limiting: per-user, per-endpoint limits
- Brute force protection: login attempt limiting
- Resource exhaustion prevention: file upload limits
- Vercel Edge Functions: built-in DDoS protection

THIRD-PARTY SECURITY:
- Dependency scanning: automated vulnerability detection
- Telegram API security: webhook validation, bot token protection
- ЮКасса integration: webhook signature validation
- ОРД API: secure credential management

LOGGING & MONITORING:
- Security event logging: failed logins, permission violations
- Audit trails: critical action tracking
- Intrusion detection: suspicious activity monitoring
- Incident response: security breach procedures

COMPLIANCE:
- Russian data protection laws
- PCI DSS considerations (payment processing)
- GDPR preparation (EU users)
- Industry best practices

РЕЗУЛЬТАТ: Security-hardened application готовое для production

---

### Задача 42: Production deployment

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Задача 41  
**Время**: 90 минут  

**Файлы для создания**:
- `configs/production.env`
- `scripts/deploy.sh`
- `docs/deployment-guide.md`
- `configs/monitoring-setup.ts`

**Описание**:
Настройка production окружения и deployment pipeline.

**Технические требования**:
- Vercel production configuration
- Supabase production setup
- Environment variables configuration
- Monitoring и alerting setup
- Backup strategies

**Критерии готовности**:
- [ ] Production environment настроен
- [ ] Deployment pipeline работает
- [ ] Monitoring собирает метрики
- [ ] Alerting настроен
- [ ] Backup procedures установлены

**Промт**:
Создай production deployment pipeline и infrastructure для TGeasy.

ЦЕЛЬ: Seamless, reliable deployment с monitoring и rollback capabilities.

ФАЙЛЫ:
- configs/production.env (production переменные окружения)
- scripts/deploy.sh (deployment скрипт)
- docs/deployment-guide.md (руководство по деплою)
- configs/monitoring-setup.ts (настройка мониторинга)

PRODUCTION ENVIRONMENT:
- Vercel deployment: optimized build configuration
- Supabase production: database migration, RLS policies
- Domain configuration: custom domain, SSL certificate
- CDN setup: static asset optimization
- Environment variables: secure secret management

DEPLOYMENT PIPELINE:
- GitHub Actions: automated CI/CD pipeline
- Build optimization: production build с optimizations
- Database migrations: automated migration execution
- Health checks: post-deployment validation
- Rollback mechanism: quick recovery procedures

MONITORING SETUP:
- Application monitoring: error tracking, performance metrics
- Infrastructure monitoring: server health, resource usage
- User monitoring: real user metrics, session recording
- Business metrics: conversion rates, user engagement
- Alerting: critical issue notifications

BACKUP STRATEGIES:
- Database backups: automated daily backups
- File storage backups: media files protection
- Configuration backups: environment settings
- Code backups: version control, release tags
- Recovery procedures: disaster recovery plan

SCALABILITY PREPARATION:
- Horizontal scaling: stateless application design
- Database optimization: read replicas, connection pooling
- Caching layers: Redis/Vercel KV implementation
- Load balancing: traffic distribution
- Performance monitoring: bottleneck identification

DEPLOYMENT VERIFICATION:
- Smoke tests: critical functionality validation
- Performance tests: response time verification
- Security tests: vulnerability scanning
- Integration tests: external service connectivity
- User acceptance tests: final validation

PRODUCTION CHECKLIST:
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Monitoring systems active
- [ ] Backup procedures tested
- [ ] Error tracking configured
- [ ] Performance baselines established

РЕЗУЛЬТАТ: Production-ready deployment с comprehensive monitoring

---

### Задача 43: Documentation и onboarding

**Модуль**: Documentation  
**Приоритет**: Высокий  
**Зависимости**: Задача 42  
**Время**: 75 минут  

**Файлы для создания**:
- `docs/user-guide.md`
- `docs/admin-guide.md`
- `docs/api-documentation.md`
- `docs/troubleshooting.md`
- `docs/changelog.md`

**Описание**:
Создание comprehensive документации для пользователей и администраторов.

**Технические требования**:
- User onboarding guide
- Admin documentation
- API reference
- Troubleshooting guide
- Change management

**Критерии готовности**:
- [ ] User guide понятен и полный
- [ ] Admin documentation детальная
- [ ] API documentation актуальная
- [ ] Troubleshooting guide полезен
- [ ] Changelog поддерживается

**Промт**:
Создай comprehensive документацию для пользователей и администраторов TGeasy.

ЦЕЛЬ: Self-service onboarding, reduced support burden, improved user experience.

ФАЙЛЫ:
- docs/user-guide.md (руководство пользователя)
- docs/admin-guide.md (руководство администратора)
- docs/api-documentation.md (API документация)
- docs/troubleshooting.md (решение проблем)
- docs/changelog.md (журнал изменений)

USER GUIDE:
- Getting Started: регистрация, первые шаги
- Channel Management: подключение каналов, настройка прав
- Creating Posts: создание размещений, медиа, планирование
- Analytics: понимание метрик, экспорт данных
- Billing: тарифы, оплата, управление подпиской
- Troubleshooting: common issues, solutions

ADMIN GUIDE:
- System Administration: user management, permissions
- Monitoring: health checks, performance metrics
- Integrations: Telegram API, ОРД, ЮКасса configuration
- Security: access controls, audit logs
- Maintenance: backups, updates, scaling

API DOCUMENTATION:
- Authentication: OAuth flow, token management
- Endpoints: complete API reference
- Request/Response examples: real-world usage
- Error codes: troubleshooting guide
- Rate limits: usage guidelines
- SDKs: client libraries (future)

TROUBLESHOOTING GUIDE:
- Common Issues: solutions для frequent problems
- Error Messages: detailed explanations
- Performance Issues: optimization tips
- Integration Problems: external service issues
- Contact Support: escalation procedures

ONBOARDING FLOW:
- Welcome tutorial: interactive product tour
- Setup checklist: step-by-step configuration
- Video tutorials: visual learning resources
- Best practices: optimization recommendations
- Success metrics: measuring effectiveness

DOCUMENTATION FEATURES:
- Search functionality: find answers quickly
- Categorization: organized by topics
- Screenshots: visual guides
- Code examples: copy-paste ready
- FAQ section: frequently asked questions

MAINTENANCE:
- Version control: documentation updates
- User feedback: improvement suggestions
- Analytics: documentation usage tracking
- Regular updates: keeping content current

РЕЗУЛЬТАТ: Self-sufficient users с reduced support load

---

### Задача 44: MVP launch preparation

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Задача 43  
**Время**: 60 минут  

**Файлы для создания**:
- `docs/launch-checklist.md`
- `configs/launch-monitoring.ts`
- `scripts/health-checks.sh`
- `docs/rollback-procedures.md`

**Описание**:
Финальная подготовка к запуску MVP с comprehensive checklist и процедурами.

**Технические требования**:
- Launch checklist completion
- Health monitoring setup
- Rollback procedures preparation
- User support preparation
- Performance monitoring

**Критерии готовности**:
- [ ] Launch checklist выполнен
- [ ] Health checks работают
- [ ] Rollback procedures готовы
- [ ] Support система настроена
- [ ] MVP готов к launch

**Промт**:
Создай финальную подготовку к запуску MVP с comprehensive checklist.

ЦЕЛЬ: Successful MVP launch с минимальными post-launch issues.

ФАЙЛЫ:
- docs/launch-checklist.md (чеклист запуска)
- configs/launch-monitoring.ts (мониторинг запуска)
- scripts/health-checks.sh (проверки здоровья системы)
- docs/rollback-procedures.md (процедуры отката)

LAUNCH CHECKLIST:

PRE-LAUNCH VERIFICATION:
- [ ] All tests passing (unit, integration, e2e)
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation finalized
- [ ] Monitoring systems configured

INFRASTRUCTURE READINESS:
- [ ] Production environment configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured
- [ ] Backup systems operational

THIRD-PARTY INTEGRATIONS:
- [ ] Telegram Bot API configured
- [ ] ОРД Яндекса integration tested
- [ ] ЮКасса payment processing verified
- [ ] Email delivery service configured
- [ ] Analytics tracking implemented

BUSINESS READINESS:
- [ ] Pricing strategy finalized
- [ ] Terms of service updated
- [ ] Privacy policy published
- [ ] Support channels established
- [ ] Marketing materials prepared

LAUNCH MONITORING:
- Real-time error tracking
- Performance monitoring dashboard
- User onboarding metrics
- Conversion rate tracking
- System health indicators

ROLLBACK PROCEDURES:
- Database rollback scripts
- Application version rollback
- Configuration rollback
- DNS rollback procedures
- Communication plan

POST-LAUNCH ACTIVITIES:
- [ ] Monitor error rates (< 1%)
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Monitor support requests
- [ ] Analyze usage patterns

SUCCESS METRICS:
- User registration rate
- Channel connection success rate
- Post publication success rate
- Payment conversion rate
- User retention rate

РЕЗУЛЬТАТ: Confident MVP launch с comprehensive safety nets

---

### Задача 45: Post-launch monitoring и optimization

**Модуль**: Infrastructure  
**Приоритет**: Высокий  
**Зависимости**: Задача 44  
**Время**: 45 минут  

**Файлы для создания**:
- `lib/monitoring/post-launch.ts`
- `docs/optimization-plan.md`
- `configs/alerting-rules.ts`
- `utils/metrics-collection.ts`

**Описание**:
Настройка post-launch мониторинга и планирование дальнейших оптимизаций.

**Технические требования**:
- Real-time monitoring
- User behavior analytics
- Performance metrics collection
- Error tracking enhancement
- Optimization roadmap

**Критерии готовности**:
- [ ] Real-time monitoring активен
- [ ] User analytics собираются
- [ ] Performance metrics отслеживаются
- [ ] Error tracking настроен
- [ ] Optimization план создан

**Промт**:
Создай post-launch мониторинг и планирование дальнейших оптимизаций.

ЦЕЛЬ: Continuous improvement на основе real user data и feedback.

ФАЙЛЫ:
- lib/monitoring/post-launch.ts (post-launch мониторинг)
- docs/optimization-plan.md (план оптимизации)
- configs/alerting-rules.ts (правила алертов)
- utils/metrics-collection.ts (сбор метрик)

POST-LAUNCH MONITORING:

USER BEHAVIOR ANALYTICS:
- Feature adoption rates
- User journey analysis
- Drop-off points identification
- Conversion funnel optimization
- A/B testing framework

PERFORMANCE MONITORING:
- Real user monitoring (RUM)
- Core Web Vitals tracking
- API response time monitoring
- Database performance analysis
- Third-party service reliability

BUSINESS METRICS:
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate analysis
- Feature usage statistics

ERROR MONITORING:
- Error rate tracking
- Critical error alerting
- User impact assessment
- Root cause analysis
- Resolution time tracking

OPTIMIZATION ROADMAP:

SHORT-TERM (1-3 месяца):
- Performance optimizations
- Bug fixes и stability improvements
- User experience enhancements
- Feature usage analysis
- Support process optimization

MEDIUM-TERM (3-6 месяцев):
- Advanced analytics features
- API для third-party integrations
- Mobile app development
- Enterprise features
- Advanced automation

LONG-TERM (6-12 месяцев):
- AI-powered content optimization
- Multi-language support
- Advanced team collaboration
- White-label solutions
- International expansion

FEEDBACK COLLECTION:
- In-app feedback widget
- User interviews
- NPS surveys
- Support ticket analysis
- Feature request tracking

CONTINUOUS IMPROVEMENT:
- Weekly performance reviews
- Monthly feature planning
- Quarterly strategy reviews
- Annual platform evolution
- Customer success programs

РЕЗУЛЬТАТ: Data-driven optimization strategy с continuous improvement

---

### Задача 46: MVP Deployment и Go-Live

**Модуль**: Infrastructure  
**Приоритет**: Критический  
**Зависимости**: Задача 45  
**Время**: 60 минут  

**Файлы для создания**:
- `scripts/final-deploy.sh`
- `docs/go-live-checklist.md`
- `configs/production-final.env`
- `scripts/domain-setup.sh`

**Описание**:
Финальный деплой MVP в production с domain setup и go-live процедурами.

**Технические требования**:
- Production build deployment
- Custom domain configuration
- SSL certificate setup
- Final smoke tests
- Go-live announcement

**Критерии готовности**:
- [ ] Приложение доступно на production domain
- [ ] SSL сертификат работает
- [ ] Все функции протестированы на production
- [ ] Monitoring показывает здоровое состояние
- [ ] MVP officially live

**Промт**:
Выполни финальный деплой TGeasy MVP в production с полной настройкой.

ЦЕЛЬ: TGeasy MVP live на production domain с полной функциональностью.

ФАЙЛЫ:
- scripts/final-deploy.sh (финальный деплой скрипт)
- docs/go-live-checklist.md (чеклист запуска)
- configs/production-final.env (финальные production настройки)
- scripts/domain-setup.sh (настройка домена)

DEPLOYMENT STEPS:
1. Final production build с optimizations
2. Environment variables verification
3. Database migration на production
4. Static assets deployment to CDN
5. Custom domain configuration
6. SSL certificate installation
7. Health checks validation
8. Go-live announcement

DOMAIN SETUP:
- Custom domain configuration (tgeasy.com)
- DNS records setup (A, CNAME, MX)
- SSL certificate installation
- HTTPS redirect configuration
- WWW redirect setup

FINAL VERIFICATION:
- End-to-end user journey testing
- Payment flow verification
- Telegram integration testing
- ОРД integration validation
- Performance benchmarks confirmation

POST-DEPLOYMENT:
- Monitor error rates первые 24 часа
- Track user registration metrics
- Verify all integrations working
- Collect initial user feedback
- Prepare hotfix deployment если needed

ROLLBACK PLAN:
- DNS rollback к staging
- Application version rollback
- Database rollback если критично
- Communication plan для users

GO-LIVE CHECKLIST:
- [ ] Application deployed и доступно
- [ ] Custom domain работает
- [ ] SSL certificate active
- [ ] All features functional
- [ ] Monitoring systems active
- [ ] Support channels ready
- [ ] Marketing materials updated
- [ ] Team notified
- [ ] Users can register и use system

РЕЗУЛЬТАТ: TGeasy MVP officially live и доступно пользователям