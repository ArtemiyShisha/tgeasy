# Архитектура TGeasy

## Обзор архитектуры

TGeasy построен как современное **serverless SaaS-приложение** с **AI-First подходом**, использующее Vercel Functions для масштабируемости и **21st.dev MCP** для автоматической генерации UI компонентов. Проект полностью спроектирован для **нативной разработки** (без Docker) и разработки с AI-инструментами.

## Архитектурные принципы

### 1. AI-First Development
Архитектура полностью оптимизирована для разработки с AI-инструментами:
- **21st.dev MCP** интегрирован в презентационный слой
- **Модульная структура** для минимизации зависимостей между задачами
- **Готовые промпты** как часть архитектурной документации
- **Atomic tasks** по 30-120 минут для AI-инструментов
- **Type-safe development** для лучшей работы с AI

### 2. MCP-Driven UI Architecture
```
┌─────────────────────────────────────────┐
│        AI-Generated UI Layer            │
│     (21st.dev MCP + shadcn/ui)         │
├─────────────────────────────────────────┤
│        UI Requirements Layer            │
│    (Markdown specifications)            │
├─────────────────────────────────────────┤
│        React Hooks Layer               │
│      (API integrations)                 │
├─────────────────────────────────────────┤
│        Next.js App Router              │
│      (Route handlers)                   │
└─────────────────────────────────────────┘
```

### 3. Domain-Driven Design (упрощенная модель)
Приложение разделено на **9 основных доменов** с четкими границами:
- **Auth** - аутентификация через Telegram
- **Users** - базовые профили пользователей (упрощено)
- **Channels** - управление Telegram каналами с **Telegram-native правами**
- **Contracts** - работа с договорами и файлами
- **Posts** - рекламные размещения (упрощено от campaigns/creatives)
- **Analytics** - метрики через Telegram API
- **Payments** - платежная система ЮКасса
- **Notifications** - уведомления в Telegram и email
- **Integrations** - внешние API (ОРД, Telegram Bot, ЮКасса)

**⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ**: Отказ от сложной системы ролей в пользу **Telegram-native прав доступа**.

### ✅ Telegram-native права доступа (РЕАЛИЗОВАНО)

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО** в Задаче 10

### ✅ Backend управления каналами (РЕАЛИЗОВАНО)

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО** в Задаче 12 (9 файлов, ~2,100+ строк кода)

**Полная архитектура каналов с Telegram-native правами**:
```
┌─────────────────────────────────────────┐
│        Frontend UI Layer                │
│   ├── Channel Management Interface     │
│   ├── Permissions indicators           │
│   └── Telegram status badges           │
├─────────────────────────────────────────┤
│        API Layer (9 endpoints)         │
│   ├── GET /api/channels (с filtering)  │
│   ├── POST /api/channels/connect       │
│   ├── CRUD /api/channels/[id]          │
│   └── /api/channels/[id]/permissions   │
├─────────────────────────────────────────┤
│        Service Layer                    │
│   ├── ChannelService (main logic)      │
│   ├── ChannelManagement (bulk ops)     │
│   └── ChannelPermissionsService        │
├─────────────────────────────────────────┤
│        Repository Layer                 │
│   ├── ChannelRepository (DB ops)       │
│   └── Permissions filtering            │
├─────────────────────────────────────────┤
│        Telegram Integration             │
│   ├── Bot API Service                  │
│   ├── getChatAdministrators()          │
│   ├── getChatMember()                  │
│   └── Automatic sync                   │
├─────────────────────────────────────────┤
│        Database Layer                   │
│   ├── telegram_channels table          │
│   ├── channel_permissions table        │
│   └── Telegram-native права            │
└─────────────────────────────────────────┘
```

**Реализованные компоненты системы управления каналами (9 файлов)**:

**Types & Validation (2 файла)**:
- ✅ **`types/channel.ts`** (163 строки): Complete TypeScript типы для каналов, requests, responses
- ✅ **`utils/channel-validation.ts`** (257 строк): Username валидация, invite link parsing, Zod schemas

**Backend Services (3 файла)**:
- ✅ **`lib/repositories/channel-repository.ts`** (432 строки): Database operations с permissions filtering
- ✅ **`lib/services/channel-service.ts`** (372 строки): Main service integrating Telegram Bot API с БД операциями
- ✅ **`lib/services/channel-management.ts`** (370 строк): Bulk operations, monitoring, maintenance tasks

**API Endpoints (4 файла)**:
- ✅ **`app/api/channels/route.ts`** (90 строк): GET channels с rights-based filtering
- ✅ **`app/api/channels/connect/route.ts`** (63 строки): POST channel connection с automatic permissions sync
- ✅ **`app/api/channels/[id]/route.ts`** (173 строки): Individual channel CRUD operations с access checks
- ✅ **`app/api/channels/[id]/permissions/route.ts`** (187 строк): Telegram-native permissions management

**Реализованные компоненты системы прав (из Задачи 10)**:
- ✅ **Service Layer**: `lib/services/channel-permissions-service.ts`
- ✅ **Repository Layer**: `lib/repositories/channel-permissions-repository.ts`
- ✅ **Integration Layer**: `lib/integrations/telegram/permissions.ts`
- ✅ **API Layer**: `app/api/channels/[id]/permissions/route.ts`
- ✅ **Type System**: `types/channel-permissions.ts`
- ✅ **Utilities**: `utils/telegram-permissions.ts` + `utils/channel-permissions-helpers.ts`

**Mapping Telegram прав в TGeasy**:
- `telegram_status: 'creator'` → полные права в TGeasy
- `telegram_status: 'administrator'` + детальные права:
  - `can_post_messages` → может создавать размещения
  - `can_edit_messages` → может редактировать размещения
  - `can_delete_messages` → может удалять размещения
  - `can_change_info` → может изменять настройки канала в TGeasy
  - `can_invite_users` → может приглашать пользователей в TGeasy

**Синхронизация прав**:
```typescript
// Автоматическая синхронизация
const syncFlow = {
  trigger: 'Daily CRON job + Webhook updates',
  process: [
    'getChatAdministrators(channelId)',
    'Map Telegram permissions → TGeasy rights',
    'Bulk upsert в channel_permissions table',
    'Cleanup removed users',
    'Update last_synced_at timestamp'
  ],
  result: 'Users see only accessible channels'
}
```

**API Endpoints**:
- `GET /api/channels/[id]/permissions` - получение текущих прав
- `POST /api/channels/[id]/permissions` - синхронизация с Telegram
- `DELETE /api/channels/[id]/permissions` - удаление прав (только creator)

**Преимущества реализованного подхода**:
- 🚀 **Простота**: нет сложной системы ролей TGeasy
- 🔄 **Синхронизация**: права автоматически синхронизированы с Telegram
- 👥 **Понятность**: пользователи понимают свои права (как в Telegram)
- 🛡️ **Безопасность**: нельзя получить больше прав, чем в Telegram
- 📈 **Масштабируемость**: больше потенциальных пользователей (не только владельцы)
- ⚡ **Performance**: Bulk operations + caching для быстрой работы

### 4. Clean Architecture с MCP интеграцией
```
┌─────────────────────────────────────────┐
│        Presentation Layer               │
│   MCP Generated UI + Next.js App       │
│   ├── UI Requirements (Markdown)       │
│   ├── Generated Components (MCP)       │
│   ├── React Hooks (API integration)    │
│   └── Next.js Pages (App Router)       │
├─────────────────────────────────────────┤
│        Application Layer                │
│      API Routes + Services              │
│   ├── Vercel Serverless Functions      │
│   ├── Service Layer (Business Logic)   │
│   ├── Repository Pattern (Data Access) │
│   └── Integration Services (External)  │
├─────────────────────────────────────────┤
│         Domain Layer                    │
│      Business Logic + Entities          │
│   ├── Domain Models (TypeScript)       │
│   ├── Business Rules (Validation)      │
│   ├── Domain Events (State changes)    │
│   └── Value Objects (Immutable data)   │
├─────────────────────────────────────────┤
│       Infrastructure Layer              │
│    External Services + Database         │
│   ├── Supabase (через MCP интеграцию)  │
│   ├── Telegram Bot API                 │
│   ├── ОРД Яндекса API                  │
│   ├── ЮКасса API                       │
│   └── File Storage (Supabase Storage)  │
└─────────────────────────────────────────┘
```

### 5. SOLID принципы для AI разработки
- **Single Responsibility** - каждый модуль решает одну задачу (atomic tasks)
- **Open/Closed** - легко расширяемые интерфейсы для новых AI-задач
- **Liskov Substitution** - взаимозаменяемые реализации сервисов
- **Interface Segregation** - специфичные интерфейсы для каждого домена
- **Dependency Inversion** - зависимость от абстракций, не реализаций

## Supabase MCP интеграция

**⚠️ ВАЖНО**: В этом проекте **НЕТ локального Supabase**! Все взаимодействие с базой данных происходит через **Supabase MCP интеграцию**.

### Архитектура данных через MCP
```
┌─────────────────────────────────────────┐
│        Frontend (Next.js)              │
│   ├── lib/supabase/client.ts           │
│   └── lib/supabase/server.ts           │
├─────────────────────────────────────────┤
│        MCP Integration Layer            │
│   ├── mcp_supabase_* functions         │
│   ├── Remote Supabase instance         │
│   └── schemas/database.sql (local)     │
├─────────────────────────────────────────┤
│        Supabase Cloud                   │
│   ├── PostgreSQL Database              │
│   ├── Authentication                   │
│   ├── Storage                          │
│   └── Edge Functions                   │
└─────────────────────────────────────────┘
```

### Что ЕСТЬ в проекте:
- ✅ `schemas/database.sql` - полная схема БД
- ✅ `lib/supabase/` - клиенты для подключения
- ✅ `types/database.ts` - TypeScript типы
- ✅ MCP функции для работы с БД

### Что НЕТ в проекте:
- ❌ `supabase/` папка с конфигурацией
- ❌ `supabase/migrations/` - миграции
- ❌ Локальная установка Supabase CLI
- ❌ Docker контейнер с PostgreSQL

### Рабочий процесс с БД:
1. **Просмотр схемы**: читать `schemas/database.sql`
2. **Создание таблиц**: `mcp_supabase_apply_migration`
3. **Выполнение SQL**: `mcp_supabase_execute_sql`
4. **Генерация типов**: `mcp_supabase_generate_typescript_types`

## AI-First технологическая архитектура

### MCP-Driven Frontend архитектура
```typescript
// UI Generation Workflow
docs/ui-requirements/
├── auth.md              # Детальные требования для auth UI
├── channels.md          # Требования для channels management
├── posts.md             # Требования для posts creation/management
├── contracts.md         # Требования для contracts management
├── analytics.md         # Требования для analytics dashboards
└── payments.md          # Требования для payment interfaces

configs/
├── mcp-config.json      # Основная MCP конфигурация
├── mcp-auth.json        # MCP конфиг для auth компонентов
├── mcp-channels.json    # MCP конфиг для channels UI
├── mcp-posts.json       # MCP конфиг для posts UI
├── mcp-analytics.json   # MCP конфиг для analytics UI
└── mcp-payments.json    # MCP конфиг для payments UI

components/
├── ui/                  # shadcn/ui базовые компоненты
├── auth/               # MCP-генерируемые auth компоненты
├── channels/           # MCP-генерируемые channels компоненты
├── posts/              # MCP-генерируемые posts компоненты
├── contracts/          # MCP-генерируемые contracts компоненты
├── analytics/          # MCP-генерируемые analytics компоненты
└── payments/           # MCP-генерируемые payments компоненты
```

### Frontend с Next.js 14 + MCP
```typescript
app/
├── (auth)/                 # Группа маршрутов авторизации
│   ├── login/
│   │   └── page.tsx       # MCP-генерируемая страница логина
│   └── callback/
│       └── page.tsx       # MCP-генерируемая страница callback
├── (dashboard)/            # Защищенные маршруты дашборда
│   ├── page.tsx           # Главная страница дашборда (MCP)
│   ├── channels/          # Управление каналами
│   │   ├── page.tsx       # Список каналов (MCP)
│   │   └── [id]/edit/     # Редактирование канала (MCP)
│   ├── posts/             # Рекламные размещения
│   │   ├── page.tsx       # Список размещений (MCP)
│   │   ├── new/page.tsx   # Создание размещения (MCP)
│   │   └── [id]/edit/     # Редактирование размещения (MCP)
│   ├── contracts/         # Управление договорами
│   │   ├── page.tsx       # Список договоров (MCP)
│   │   └── upload/        # Загрузка договоров (MCP)
│   ├── analytics/         # Аналитика
│   │   ├── page.tsx       # Общая аналитика (MCP)
│   │   ├── posts/[id]/    # Аналитика поста (MCP)
│   │   └── export/        # Экспорт данных (MCP)
│   ├── payments/          # Платежи и подписки
│   │   ├── page.tsx       # Billing dashboard (MCP)
│   │   ├── plans/         # Тарифные планы (MCP)
│   │   └── invoices/      # История платежей (MCP)
│   └── settings/          # Настройки
│       ├── profile/       # Профиль пользователя (MCP)
│       ├── notifications/ # Настройки уведомлений (MCP)
│       └── channels/      # Настройки каналов (MCP)
├── public-stats/          # Публичные ссылки аналитики
│   └── [linkId]/page.tsx  # Публичная страница статистики
└── api/                   # API маршруты (Vercel Functions)
```

### Backend архитектура (Serverless)
```typescript
// Vercel Serverless Functions Architecture
api/
├── auth/                  # Аутентификация
│   ├── telegram/route.ts      # Telegram OAuth redirect
│   ├── callback/route.ts      # OAuth callback обработка
│   └── refresh/route.ts       # JWT token refresh
├── users/                 # Управление пользователями
│   ├── route.ts              # CRUD пользователей
│   ├── [id]/route.ts         # Операции с конкретным пользователем
│   └── [id]/permissions/     # Управление правами
├── channels/              # Управление каналами
│   ├── route.ts              # CRUD каналов
│   ├── connect/route.ts      # Подключение новых каналов
│   └── [id]/
│       ├── route.ts          # Операции с каналом
│       ├── permissions/      # Права доступа к каналу
│       └── stats/route.ts    # Статистика канала
├── contracts/             # Управление договорами
│   ├── route.ts              # CRUD договоров
│   ├── upload/route.ts       # Загрузка файлов
│   └── [id]/route.ts         # Операции с договором
├── posts/                 # Рекламные размещения
│   ├── route.ts              # CRUD размещений
│   ├── [id]/
│   │   ├── route.ts          # Операции с размещением
│   │   ├── media/route.ts    # Управление медиафайлами
│   │   ├── schedule/route.ts # Планирование публикации
│   │   ├── publish/route.ts  # Публикация в Telegram
│   │   └── ord-register/     # Регистрация в ОРД
├── analytics/             # Аналитика
│   ├── route.ts              # Общая аналитика
│   ├── posts/[id]/route.ts   # Аналитика поста
│   ├── channels/[id]/        # Аналитика канала
│   ├── export/route.ts       # Экспорт в Excel
│   ├── public-links/         # Публичные ссылки
│   └── collect/route.ts      # Сбор метрик (cron)
├── payments/              # Платежная система
│   ├── route.ts              # Создание платежей
│   ├── webhook/route.ts      # ЮКасса webhook
│   └── subscriptions/        # Управление подписками
├── notifications/         # Уведомления
│   ├── telegram/route.ts     # Telegram уведомления
│   ├── email/route.ts        # Email уведомления
│   └── settings/route.ts     # Настройки уведомлений
└── webhooks/              # Внешние webhooks
    ├── telegram/route.ts     # Telegram Bot webhook
    ├── yookassa/route.ts     # ЮКасса webhook
    └── ord/route.ts          # ОРД webhook (если есть)
```

## Схема базы данных (упрощенная)

### Основные таблицы для MVP
```sql
-- Пользователи и аутентификация
users                    # Пользователи системы
user_subscriptions       # Подписки пользователей
user_sessions           # Сессии пользователей

-- Каналы и права доступа  
telegram_channels       # Telegram каналы пользователей
channel_permissions     # Права доступа: owner, admin

-- Договоры
contracts               # Договоры с рекламодателями
contract_files          # Файлы договоров

-- Размещения (упрощенная модель)
posts                   # Рекламные размещения
post_media             # Медиафайлы размещений
post_schedule          # Планирование публикаций

-- Аналитика
post_analytics         # Метрики постов (Telegram API)
analytics_snapshots    # Снапшоты для исторических данных

-- Платежи
payments               # История платежей ЮКасса
subscriptions          # Активные подписки
invoices              # Счета для юридических лиц

-- Система
public_stats_links     # Публичные ссылки статистики
notification_settings # Настройки уведомлений
notification_logs     # Логи отправленных уведомлений
integration_logs      # Логи интеграций (ОРД, Telegram)
```

### Упрощение модели данных
**Было (сложно):** Campaigns → Creatives → Posts  
**Стало (просто):** Posts (с полями креатива внутри)

```sql
-- Упрощенная таблица posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel_id UUID REFERENCES telegram_channels(id),
  contract_id UUID REFERENCES contracts(id) NULL,
  
  -- Основная информация
  title VARCHAR(255) NOT NULL,
  status post_status DEFAULT 'draft',
  
  -- Контент креатива (все в одной таблице)
  creative_text TEXT NOT NULL,
  creative_images JSONB DEFAULT '[]',
  target_url TEXT NULL,
  
  -- ОРД информация
  advertiser_inn VARCHAR(12) NOT NULL,
  advertiser_name VARCHAR(255) NOT NULL,
  product_description TEXT NOT NULL,
  erid VARCHAR(50) NULL,
  ord_status ord_status DEFAULT 'pending',
  
  -- Планирование
  scheduled_at TIMESTAMPTZ NULL,
  published_at TIMESTAMPTZ NULL,
  telegram_message_id INTEGER NULL,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Интеграции архитектура

### 1. Telegram Bot API интеграция ✅ РЕАЛИЗОВАНО

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО** в Задаче 11

**Архитектура Telegram интеграции**:
```
┌─────────────────────────────────────────┐
│        Telegram Bot API Client          │
│   ├── Rate Limiting (30 req/sec)       │
│   ├── Retry Logic (exponential backoff)│
│   ├── Error Handling & Recovery        │
│   └── Token Bucket Algorithm           │
├─────────────────────────────────────────┤
│        Core API Functions               │
│   ├── getChat(chatId)                  │
│   ├── getChatAdministrators(chatId)    │
│   ├── getChatMember(chatId, userId)    │
│   ├── sendMessage(chatId, text)        │
│   └── getMe()                          │
├─────────────────────────────────────────┤
│        Permission Functions             │
│   ├── syncChannelPermissions()         │
│   ├── getUserChannelPermissions()      │
│   ├── mapTelegramPermissions()         │
│   └── isUserChannelAdmin()             │
├─────────────────────────────────────────┤
│        Webhook System                   │
│   ├── Event Routing                    │
│   ├── Permission Change Detection      │
│   ├── Signature Validation             │
│   └── Real-time Updates                │
└─────────────────────────────────────────┘
```

**Реализованные файлы**:
- ✅ **`lib/integrations/telegram/bot-api.ts`** (370 строк) - основной API клиент
- ✅ **`lib/integrations/telegram/permissions.ts`** (444 строки) - permissions API
- ✅ **`lib/integrations/telegram/webhooks.ts`** (474 строки) - webhook обработчик
- ✅ **`lib/integrations/telegram/types.ts`** - специализированные типы
- ✅ **`types/telegram.ts`** - полные Telegram API типы
- ✅ **`utils/telegram-helpers.ts`** - утилиты и error handling
- ✅ **`utils/telegram-permissions.ts`** - permission utilities

**Централизованный Telegram сервис**:
```typescript
class TelegramBotAPI {
  // Core API Functions ✅ РЕАЛИЗОВАНО
  async getChat(chatId: string): Promise<TelegramChat>
  async getChatAdministrators(chatId: string): Promise<TelegramChatAdministrator[]>
  async getChatMember(chatId: string, userId: number): Promise<TelegramChatMember>
  async sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<TelegramMessage>
  async getMe(): Promise<TelegramUser>
  
  // Permission Functions ✅ РЕАЛИЗОВАНО
  async syncChannelPermissions(channelId: string): Promise<PermissionSyncResult>
  async getUserChannelPermissions(userId: string, channelId: string): Promise<UserChannelPermissions>
  async mapTelegramPermissions(telegramMember: TelegramChatMember): Promise<TelegramPermissionMapping>
  async isUserChannelAdmin(userId: string, channelId: string): Promise<boolean>
  
  // Rate Limiting & Error Handling ✅ РЕАЛИЗОВАНО
  private rateLimiter: TokenBucket // 30 requests/second
  private retryWithBackoff<T>(operation: () => Promise<T>, maxAttempts: number = 3): Promise<T>
  private handleTelegramError(error: TelegramError): TelegramErrorResponse
  
  // Webhook Processing ✅ РЕАЛИЗОВАНО
  async processWebhook(update: TelegramUpdate): Promise<WebhookProcessResult>
  async validateWebhookSignature(body: string, signature: string): Promise<boolean>
}
```

**Security & Reliability Features ✅ РЕАЛИЗОВАНО**:
- **Rate Limiting**: Token bucket algorithm (30 req/sec с burst protection)
- **Retry Logic**: Exponential backoff с максимум 3 попытками
- **Error Handling**: Comprehensive error classification и recovery
- **Webhook Security**: Signature validation с secret tokens
- **Logging**: Detailed logging для monitoring и debugging

**Environment Variables**:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

**Готовность для следующих задач**:
- ✅ **Задача 12**: Backend каналов готов к интеграции с Telegram API
- ✅ **Задача 13**: API hooks готовы к использованию Telegram функций
- ✅ **Задача 25**: Publishing system готов к использованию sendMessage API

### 2. ОРД Яндекса интеграция (Планируется в Задаче 23)
```typescript
// ОРД сервис для автоматической маркировки
class ORDService {
  // Регистрация креативов
  async registerCreative(post: Post): Promise<{erid: string}>
  async updateCreative(erid: string, post: Post): Promise<void>
  async getCreativeStatus(erid: string): Promise<CreativeStatus>
  
  // Автоматическая обработка
  async autoRegisterOnPostCreate(post: Post): Promise<string>
  async addERIDToContent(content: string, erid: string): Promise<string>
}

// Автоматический trigger при создании поста
export async function onPostCreate(post: Post) {
  // 1. Регистрируем в ОРД
  const erid = await ordService.registerCreative(post)
  
  // 2. Обновляем пост с ERID
  await postRepository.update(post.id, { erid })
  
  // 3. Добавляем ERID в контент
  const updatedContent = await ordService.addERIDToContent(post.creative_text, erid)
  await postRepository.update(post.id, { creative_text: updatedContent })
}
```

### 3. ЮКасса платежная интеграция (Планируется в Задаче 31)
```typescript
// ЮКасса сервис
class YooKassaService {
  // Управление платежами
  async createPayment(amount: number, description: string, userId: string): Promise<Payment>
  async getPayment(paymentId: string): Promise<Payment>
  async processWebhook(event: YooKassaWebhookEvent): Promise<void>
  
  // Подписки
  async createSubscription(planId: string, userId: string): Promise<Subscription>
  async cancelSubscription(subscriptionId: string): Promise<void>
  async processSubscriptionPayment(subscription: Subscription): Promise<void>
  
  // Документооборот
  async generateInvoice(payment: Payment): Promise<Buffer>
  async sendInvoiceEmail(payment: Payment, email: string): Promise<void>
}

// Тарифные планы
enum SubscriptionPlan {
  BASIC = 'basic',      // 3490₽ - до 5 каналов, 50 размещений/месяц
  PRO = 'professional', // 6990₽ - до 15 каналов, 200 размещений/месяц  
  CORP = 'corporate'    // 12990₽ - до 50 каналов, 1000 размещений/месяц
}
```

## Паттерны проектирования для AI-разработки

### 1. Repository Pattern с TypeScript
```typescript
// Универсальный репозиторий паттерн для AI-генерации
interface Repository<T, CreateDTO, UpdateDTO> {
  create(data: CreateDTO): Promise<T>
  findById(id: string): Promise<T | null>
  findMany(filters?: Record<string, any>): Promise<T[]>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

// Пример для Posts
interface PostRepository extends Repository<Post, CreatePostDTO, UpdatePostDTO> {
  findByUserId(userId: string): Promise<Post[]>
  findByChannelId(channelId: string): Promise<Post[]>
  findScheduled(date: Date): Promise<Post[]>
  findByStatus(status: PostStatus): Promise<Post[]>
}
```

### 2. Service Layer Pattern
```typescript
// Сервисный слой с четкой бизнес-логикой
class PostService {
  constructor(
    private postRepo: PostRepository,
    private ordService: ORDService,
    private telegramService: TelegramService,
    private notificationService: NotificationService
  ) {}

  async createPost(data: CreatePostDTO): Promise<Post> {
    // 1. Валидация прав доступа
    await this.validateChannelAccess(data.channelId, data.userId)
    
    // 2. Создание поста
    const post = await this.postRepo.create(data)
    
    // 3. Автоматическая регистрация в ОРД
    const erid = await this.ordService.autoRegisterOnPostCreate(post)
    
    // 4. Обновление поста с ERID
    const updatedPost = await this.postRepo.update(post.id, { erid })
    
    // 5. Уведомление пользователя
    await this.notificationService.sendPostCreated(updatedPost)
    
    return updatedPost
  }

  async schedulePost(postId: string, scheduledAt: Date): Promise<void> {
    const post = await this.postRepo.findById(postId)
    if (!post) throw new Error('Post not found')
    
    // Планирование в Telegram
    await this.telegramService.schedulePost(
      post.channel_id,
      this.formatPostContent(post),
      scheduledAt
    )
    
    // Обновление статуса
    await this.postRepo.update(postId, { 
      scheduled_at: scheduledAt,
      status: 'scheduled' 
    })
  }
}
```

### 3. Factory Pattern для интеграций
```typescript
// Фабрика для создания API клиентов
class APIClientFactory {
  static createTelegramClient(): TelegramService {
    return new TelegramService(process.env.TELEGRAM_BOT_TOKEN!)
  }
  
  static createORDClient(): ORDService {
    return new ORDService(
      process.env.ORD_API_KEY!,
      process.env.ORD_CLIENT_ID!
    )
  }
  
  static createYooKassaClient(): YooKassaService {
    return new YooKassaService(
      process.env.YOOKASSA_SHOP_ID!,
      process.env.YOOKASSA_SECRET_KEY!
    )
  }
  
  static createSupabaseClient(): SupabaseClient {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
}
```

### 4. Hook Pattern для Frontend (AI-friendly)
```typescript
// Стандартизированные hooks для MCP генерации
export function useEntityCRUD<T, CreateDTO, UpdateDTO>(
  entityName: string,
  apiEndpoint: string
) {
  const { data, error, isLoading, mutate } = useSWR<T[]>(`/api/${apiEndpoint}`)
  
  const create = useCallback(async (data: CreateDTO): Promise<T> => {
    const response = await fetch(`/api/${apiEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`Failed to create ${entityName}`)
    const created = await response.json()
    mutate()
    return created
  }, [mutate])
  
  const update = useCallback(async (id: string, data: UpdateDTO): Promise<T> => {
    const response = await fetch(`/api/${apiEndpoint}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`Failed to update ${entityName}`)
    const updated = await response.json()
    mutate()
    return updated
  }, [mutate])
  
  const remove = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/${apiEndpoint}/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error(`Failed to delete ${entityName}`)
    mutate()
  }, [mutate])
  
  return {
    data: data || [],
    error,
    isLoading,
    create,
    update,
    remove,
    refresh: mutate
  }
}

// Использование для Posts
export const usePosts = () => useEntityCRUD<Post, CreatePostDTO, UpdatePostDTO>('post', 'posts')
```

## MCP Configuration Architecture

### Базовая MCP конфигурация
```json
// configs/mcp-config.json
{
  "project": {
    "name": "TGeasy",
    "type": "saas-dashboard",
    "primaryColor": "#3b82f6",
    "accentColor": "#10b981"
  },
  "designSystem": {
    "framework": "tailwind",
    "componentLibrary": "shadcn/ui",
    "theme": "modern-saas",
    "colorScheme": ["light", "dark"],
    "typography": "inter",
    "spacing": "8px-grid",
    "borderRadius": "medium"
  },
  "layout": {
    "type": "dashboard",
    "navigation": "