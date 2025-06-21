# Архитектура TGeasy

## Обзор архитектуры

TGeasy построен как современное **serverless SaaS-приложение** с **HorizonUI-driven подходом**, использующее Vercel Functions для масштабируемости и **HorizonUI Design System** для создания профессиональных пользовательских интерфейсов. Проект полностью спроектирован для **нативной разработки** (без Docker) и разработки с AI-инструментами.

## Архитектурные принципы

### 1. Apple-Inspired Design System ✅ ОБНОВЛЕНО (Январь 2025)
Архитектура переориентирована на **Apple-style минимализм** с принципами дизайна Apple:
- **Minimal Color Palette** - фокус на белом, сером, черном с акцентными цветами
- **Content-First Approach** - контент важнее декоративных элементов
- **Subtle Interactions** - тонкие hover эффекты и transitions
- **Clean Typography** - четкая иерархия с Inter font family
- **Functional Beauty** - красота через функциональность, а не украшения
- **Professional Aesthetics** - подходящий для бизнес-пользователей

**🍎 ДИЗАЙН-ФИЛОСОФИЯ**: Переход от **яркого HorizonUI** к **сдержанному Apple-style** для создания профессионального, не отвлекающего интерфейса, ориентированного на продуктивность.

### 2. HorizonUI + shadcn/ui Driven Architecture ✅ РЕАЛИЗОВАНО
```
┌─────────────────────────────────────────┐
│        HorizonUI Presentation Layer     │
│    (Manual crafted + HorizonUI + shadcn)│
│   ├── Glassmorphism Components         │
│   ├── Modern Dashboard Layout          │
│   ├── Professional UI/UX               │
│   └── Enhanced User Experience         │
├─────────────────────────────────────────┤
│        Business Logic Layer            │
│      (React Hooks + Services)          │
│   ├── useChannels, useAuth hooks      │
│   ├── API integration layer           │
│   └── State management                │
├─────────────────────────────────────────┤
│        API Layer                       │
│      (Next.js App Router)              │
│   ├── RESTful API endpoints           │
│   ├── Authentication middleware       │
│   └── Database operations             │
├─────────────────────────────────────────┤
│        Data Layer                      │
│     (Supabase + External APIs)        │
│   ├── PostgreSQL Database             │
│   ├── Telegram Bot API                │
│   └── Third-party integrations        │
└─────────────────────────────────────────┘
```

**✅ HorizonUI интеграция (ПОЛНОСТЬЮ РЕАЛИЗОВАНА - Январь 2025)**:
- **Технологическая совместимость**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + HorizonUI
- **Professional Design System**: Modern glassmorphism, premium typography, smooth animations
- **Complete Component Library**: Dashboard, Cards, Forms, Tables, Navigation
- **MIT License**: Свободное использование HorizonUI boilerplate
- **Production Ready**: Deployed и протестировано на production environment

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

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО** в Задаче 12-14 (13 файлов, ~2,900+ строк кода)

**🎯 UX REDESIGN**: Переработана логика статусов каналов - **статус канала = статус бота**:
- 🟢 **АКТИВЕН** - бот подключен к каналу, готов к работе
- 🟡 **НАСТРОЙКА** - канал подключен к TGeasy, но бот еще не добавлен  
- 🔴 **ОТКЛЮЧЕН** - бот был подключен, но потерял доступ или удален

### ✅ Apple-Style Design System Implementation ✨ НОВЕЙШЕЕ (Январь 2025)

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО И ЗАДЕПЛОЕНО** - Январь 2025

### 🍎 Apple Design Principles Integration

**Философия дизайна основана на принципах Apple**:

#### **1. Минималистичная цветовая палитра**
```scss
// Primary Colors (Apple-inspired)
background: white, zinc-900 (dark mode)
text: zinc-900, zinc-100 (dark mode)  
borders: zinc-200, zinc-800 (dark mode)
accents: blue-600 (primary), emerald-600 (success), amber-600 (warning), red-600 (error)

// Subtle Backgrounds
cards: white with subtle shadows
hover: zinc-50, zinc-800/50 (dark mode)
disabled: zinc-100, zinc-800 (dark mode)
```

#### **2. Content-First Typography**
```scss
// Font Hierarchy (Inter family)
headings: font-semibold (не bold), черная типографика
body: font-normal, zinc-600/zinc-400 для вторичного текста
labels: text-sm, font-medium, zinc-500/zinc-400
captions: text-xs, zinc-400
```

#### **3. Subtle Interaction Design**
```scss
// Apple-style Hover States
cards: hover:shadow-lg transition-shadow duration-200
buttons: hover:bg-zinc-50 transition-colors duration-200
borders: hover:border-zinc-300 transition-colors

// No aggressive animations
- ❌ scale transforms
- ❌ glow effects  
- ❌ color-changing elements
- ✅ simple shadow changes
- ✅ smooth color transitions
```

#### **4. Functional Visual Hierarchy**
```scss
// Component Structure
primary-actions: blue-600 background
secondary-actions: zinc border with white background  
destructive-actions: red-600 text only
status-indicators: subtle colored backgrounds (emerald-50, amber-50, red-50)
```

### ✅ Apple-Style Channel Management Interface (РЕАЛИЗОВАНО) ✨ ОБНОВЛЕНО

**Статус**: **ПОЛНОСТЬЮ РЕАЛИЗОВАНО И ЗАДЕПЛОЕНО** - Январь 2025

**Архитектура современного интерфейса управления каналами**:
```
┌─────────────────────────────────────────┐
│        HorizonUI Channel Interface      │
│   ├── Glassmorphism Channel Cards      │
│   ├── Modern Statistics Dashboard      │
│   ├── Enhanced Filtering System        │
│   ├── Responsive Grid/Table Views      │
│   ├── Smooth Animations & Transitions  │
│   └── Russian Localization             │
├─────────────────────────────────────────┤
│        Smart Filtering Logic           │
│   ├── "Все" - all channels             │
│   ├── "Активные" - operational channels│
│   ├── "Настройка" - needs setup        │
│   └── Real-time status updates         │
├─────────────────────────────────────────┤
│        Interactive Components          │
│   ├── Status Indicators with Icons     │
│   ├── Permission Badges (Владелец)     │
│   ├── Action Dropdowns (simplified)    │
│   └── Connection Wizard Dialog         │
├─────────────────────────────────────────┤
│        Enhanced UX Features            │
│   ├── Optimistic UI Updates           │
│   ├── Error Handling & Recovery       │
│   ├── Loading States & Skeletons      │
│   └── Dark/Light Mode Support         │
└─────────────────────────────────────────┘
```

**🍎 Apple-Style Design Implementation (Январь 2025)**:

#### **Visual Design (Apple-Inspired)**:
- **Clean Card Design**: Белые карточки с тонкими тенями вместо glassmorphism
- **Neutral Avatars**: Серые avatar backgrounds с черной типографикой
- **Minimal Status Indicators**: Маленькие цветные точки без aggressive styling
- **Subtle Hover Effects**: Простые shadow transitions без movement
- **Content-Focused Layout**: Убраны декоративные градиенты и эффекты

#### **Упрощенный интерфейс**:
- ❌ **Убрана строка поиска** - не нужна для простого управления каналами
- ✅ **Только необходимые поля** - убраны "Last activity" и "Posts today"
- ✅ **Упрощенное меню действий** - только "Проверить статус бота" и "Отключить"
- ✅ **Русская локализация** - полный перевод интерфейса

#### **Smart Filtering System**:
```typescript
// Логика фильтрации каналов
const filterLogic = {
  'all': () => true, // Показать все каналы
  'active': (channel) => channel.is_active && isChannelOperational(channel.bot_status),
  'setup': (channel) => isChannelNeedsSetup(channel.bot_status) || !channel.is_active
};

// Статистика в реальном времени
const stats = {
  total: channels.length,
  connected: channels.filter(isActive).length,
  needsSetup: channels.filter(needsSetup).length,
  totalMembers: 0 // TODO: Integration с Telegram API
};
```

#### **Enhanced User Experience**:
- **Grid/Table Views**: Переключение между представлениями
- **Responsive Design**: Адаптивная верстка для всех устройств
- **Optimistic Updates**: Мгновенные UI обновления
- **Error Recovery**: Graceful rollback при ошибках
- **Loading States**: Современные loading индикаторы

**Production Deployment**: 
- **Apple-Style URL**: `https://tgeasy-nb7uadoju-shishkinartemiy-gmailcoms-projects.vercel.app`
- **Status**: ✅ Deployed и протестировано в Apple-style дизайне
- **Performance**: Улучшенная читаемость и профессиональный внешний вид
- **Design Philosophy**: Минимализм и функциональность в стиле Apple

**Реализованные компоненты (обновленные)**:
- ✅ **`components/channels/channel-management-interface.tsx`** (681+ строк): Complete HorizonUI interface
- ✅ **Enhanced Channel Cards** с glassmorphism эффектами
- ✅ **Smart Filtering** без поиска, с правильной логикой статусов
- ✅ **Connection Wizard** с modern dialog и validation
- ✅ **Statistics Dashboard** с real-time updates
- ✅ **Responsive Tables** для альтернативного представления

## Supabase MCP интеграция

**⚠️ ВАЖНО**: В этом проекте **НЕТ локального Supabase**! Все взаимодействие с базой данных происходит двумя способами:
- **Production код** использует **Supabase JavaScript Client**
- **Разработка** использует **Supabase MCP интеграцию** для AI-ассистента

### Архитектура данных
```
┌─────────────────────────────────────────┐
│        Frontend (Next.js)              │
│   ├── lib/supabase/client.ts           │ ← Production: Supabase JS Client
│   └── lib/supabase/server.ts           │ ← Production: Supabase JS Client
├─────────────────────────────────────────┤
│     Development Tools Layer            │
│   ├── mcp_supabase_* functions         │ ← Development: AI-assistant tools
│   ├── Cursor MCP integration           │ ← Development: Code generation
│   └── schemas/database.sql (local)     │ ← Development: Schema reference
├─────────────────────────────────────────┤
│        Supabase Cloud                   │
│   ├── PostgreSQL Database              │ ← Production: Real database
│   ├── Authentication                   │ ← Production: User auth
│   ├── Storage                          │ ← Production: File storage
│   └── Edge Functions                   │ ← Production: Serverless functions
└─────────────────────────────────────────┘
```

### Что ЕСТЬ в проекте:
- ✅ `schemas/database.sql` - полная схема БД
- ✅ `lib/supabase/` - Supabase JS клиенты для production
- ✅ `types/database.ts` - TypeScript типы
- ✅ MCP функции для AI-ассистированной разработки

### Что НЕТ в проекте:
- ❌ `supabase/` папка с конфигурацией
- ❌ `supabase/migrations/` - миграции
- ❌ Локальная установка Supabase CLI
- ❌ Docker контейнер с PostgreSQL

### Рабочий процесс с БД:
**Для разработки (через AI-ассистента)**:
1. **Просмотр схемы**: читать `schemas/database.sql`
2. **Создание таблиц**: `mcp_supabase_apply_migration`
3. **Выполнение SQL**: `mcp_supabase_execute_sql`
4. **Генерация типов**: `mcp_supabase_generate_typescript_types`

**Для production кода**:
1. **Подключение**: `createClient()` из `lib/supabase/server.ts`
2. **Запросы**: `supabase.from('table').select()` и т.д.
3. **Типизация**: импорт из `types/database.ts`

## AI-First технологическая архитектура

### HorizonUI-Driven Frontend архитектура
```typescript
// Manual UI Development Workflow с HorizonUI
docs/ui-requirements/
├── auth.md              # UI specifications для auth страниц
├── channels.md          # HorizonUI requirements для channels management
├── posts.md             # Professional UI для posts creation/management
├── contracts.md         # Interface requirements для contracts management
├── analytics.md         # Dashboard specifications для analytics
└── payments.md          # Modern UI для payment interfaces

components/
├── ui/                  # shadcn/ui базовые компоненты (обновленные)
├── layout/              # HorizonUI dashboard layout компоненты
├── auth/               # Handcrafted auth компоненты с HorizonUI стилями
├── channels/           # Professional channels UI с glassmorphism
├── posts/              # Modern posts management компоненты (planned)
├── contracts/          # Clean contracts UI компоненты (planned)
├── analytics/          # Advanced analytics dashboard компоненты (planned)
└── payments/           # Professional payments UI компоненты (planned)

styles/
├── globals.css         # HorizonUI global styles integration
├── components.css      # Custom component overrides
└── themes/             # Light/Dark theme configurations
```

### Frontend с Next.js 14 + HorizonUI
```typescript
app/
├── (auth)/                 # Группа маршрутов авторизации
│   ├── login/
│   │   └── page.tsx       # HorizonUI login страница с glassmorphism
│   └── callback/
│       └── page.tsx       # Professional OAuth callback обработка
├── (dashboard)/            # Защищенные маршруты дашборда с HorizonUI layout
│   ├── page.tsx           # ✅ Modern dashboard homepage
│   ├── channels/          # ✅ РЕАЛИЗОВАНО - Управление каналами
│   │   ├── page.tsx       # ✅ Professional channels management interface
│   │   └── [id]/edit/     # Channel настройки (planned)
│   ├── posts/             # Рекламные размещения (planned)
│   │   ├── page.tsx       # HorizonUI posts management interface
│   │   ├── new/page.tsx   # Modern post creation wizard
│   │   └── [id]/edit/     # Professional post editor
│   ├── contracts/         # Управление договорами (planned)
│   │   ├── page.tsx       # Clean contracts management interface
│   │   └── upload/        # Modern file upload с drag-and-drop
│   ├── analytics/         # Аналитика (planned)
│   │   ├── page.tsx       # Advanced analytics dashboard
│   │   ├── posts/[id]/    # Detailed post analytics
│   │   └── export/        # Professional data export interface
│   ├── payments/          # Платежи и подписки (planned)
│   │   ├── page.tsx       # Modern billing dashboard
│   │   ├── plans/         # Beautiful pricing plans interface
│   │   └── invoices/      # Professional invoices management
│   └── settings/          # Настройки (planned)
│       ├── profile/       # Modern user profile interface
│       ├── notifications/ # Clean notifications settings
│       └── channels/      # Advanced channel настройки
├── public-stats/          # Публичные ссылки аналитики
│   └── [linkId]/page.tsx  # Public stats с modern дизайном
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

## HorizonUI Design System Configuration

### Базовая HorizonUI конфигурация
```typescript
// Design System Configuration для TGeasy
export const horizonUIConfig = {
  project: {
    name: "TGeasy",
    type: "saas-dashboard",
    primaryColor: "#3b82f6", // blue-500
    accentColor: "#10b981",  // emerald-500
    brand: "modern-professional"
  },
  designSystem: {
    framework: "tailwind",
    componentLibrary: "shadcn/ui + HorizonUI",
    theme: "glassmorphism-saas",
    colorScheme: ["light", "dark"],
    typography: "Inter",
    spacing: "8px-grid",
    borderRadius: "modern", // rounded-lg standard
    effects: ["backdrop-blur", "gradients", "shadows"]
  },
  layout: {
    type: "dashboard",
    navigation: "glassmorphism-sidebar",
    header: "fixed-glassmorphism",
    content: "responsive-grid"
  },
  components: {
    cards: "glassmorphism-elevated",
    buttons: "horizon-modern",
    forms: "clean-professional",
    tables: "responsive-modern"
  }
}
```

## Статус реализации системы отключения каналов

### ✅ Завершенные компоненты (100% готово)

**Backend Architecture:**
- ✅ Multi-user disconnect система с PostgreSQL arrays
- ✅ Automatic reconnection через существующий connect API
- ✅ Comprehensive error handling и validation
- ✅ Production-ready authentication с fallback
- ✅ Database schema с `disconnected_by_users UUID[]`

**API Endpoints:**
- ✅ `POST /api/channels/[id]/disconnect` - отключение канала
- ✅ `POST /api/channels/connect` - подключение/переподключение канала
- ✅ Authentication integration с fallback для demo mode

**Frontend Integration:**
- ✅ Optimistic UI updates с rollback
- ✅ Seamless UX через dropdown menu и Add Channel dialog
- ✅ Error handling и user feedback
- ✅ React hooks с comprehensive state management

**Testing & Deployment:**
- ✅ Production tested на Vercel deployment
- ✅ Manual QA testing завершен успешно
- ✅ Disconnect functionality работает как expected
- ✅ Reconnection functionality работает как expected

### 🎯 User Experience Flow (Протестировано)

1. **Disconnect workflow**: Пользователь → Dropdown menu → "Disconnect" → Канал исчезает ✅
2. **Reconnect workflow**: Пользователь → "Add Channel" → Вводит @username → Канал переподключается автоматически ✅
3. **Multi-user safety**: Канал остается в БД для других пользователей ✅
4. **Error handling**: Корректные ошибки при invalid operations ✅

### 📊 Architecture Benefits Achieved

- 🔄 **Multi-user support**: Полная поддержка многопользовательских каналов
- 🗄️ **Data preservation**: Никакая data не теряется при disconnect/reconnect
- ⚡ **Performance**: Efficient PostgreSQL array operations
- 🎯 **User Experience**: Intuitive disconnect через меню, reconnect через обычный flow
- 🛡️ **Safety**: Comprehensive validation и error handling
- 🚀 **Production Ready**: Deployed и tested на production environment

**Итоговый статус**: Система отключения/переподключения каналов **ПОЛНОСТЬЮ РЕАЛИЗОВАНА И ПРОТЕСТИРОВАНА** ✅

## ✅ UI Development Strategy Evolution (ОБНОВЛЕНО)

**Статус**: **ПЕРЕХОД НА HORIZONUI-DRIVEN DEVELOPMENT** - Январь 2025

### Эволюция подхода к UI разработке

TGeasy завершил **архитектурный переход** от MCP автогенерации к **ручной разработке с HorizonUI Design System**. Этот подход обеспечивает лучший контроль качества, производительности и пользовательского опыта.

### 🎯 Архитектурная совместимость

**Технологический стек (100% совпадение)**:
- ✅ **Next.js 14** + **TypeScript** + **Tailwind CSS**
- ✅ **shadcn/ui** компоненты + **Radix UI** primitives
- ✅ **Supabase** интеграция + **App Router** структура
- ✅ **MIT License** - свободное использование

**Принципы проектирования**:
- ✅ **Component-driven development** с TypeScript strict mode
- ✅ **Atomic design** принципы для AI-генерации
- ✅ **Accessibility-first** подход с Radix UI
- ✅ **Mobile-responsive** дизайн

### 🎨 Реализованные UI компоненты

#### **1. Dashboard Header (Horizon UI стиль)**
```typescript
// components/layout/dashboard-header.tsx
- Glassmorphism эффекты: backdrop-blur-xl с полупрозрачностью
- Breadcrumb навигация: автоматическая генерация на основе маршрута
- Theme toggle: переключение между light/dark режимами
- User dropdown: улучшенный дизайн с avatar и settings
- Fixed positioning: правильный z-index для sidebar interaction
```

**Ключевые особенности**:
- **Modern glassmorphism**: `bg-white/70 backdrop-blur-xl border border-white/20`
- **Responsive design**: адаптивная верстка для всех устройств
- **Smooth animations**: transition эффекты для hover состояний
- **Accessibility**: полная поддержка keyboard navigation

#### **2. Enhanced Dashboard Layout**
```typescript
// app/(dashboard)/layout.tsx
- Glassmorphism sidebar: карточка с backdrop-blur эффектом
- Improved navigation: иконки Lucide с hover анимациями
- Brand identity: логотип с Zap иконкой и современной типографикой
- Mobile-first: responsive поведение с overlay sidebar
```

**Architectural improvements**:
- **Component separation**: четкое разделение header и sidebar логики
- **State management**: правильное управление состоянием sidebar
- **Performance**: оптимизированные re-renders через useCallback
- **Type safety**: полная типизация props и состояний

#### **3. Modern Channel Cards**
```typescript
// components/channels/channel-card.tsx
- Card redesign: gradients и glassmorphism эффекты
- Status indicators: цветовые схемы для different статусов
- Permission badges: визуальное отображение Telegram прав
- Interactive elements: hover эффекты и smooth transitions
```

**UX improvements**:
- **Visual hierarchy**: четкая структура информации
- **Status visualization**: интуитивные цветовые индикаторы
- **Action accessibility**: удобные dropdown меню для действий
- **Information density**: оптимальное количество информации на карточке

### 🔧 Технические компоненты

#### **Authentication Hook**
```typescript
// hooks/use-auth.ts
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// Полная интеграция с Supabase auth
// Автоматическое перенаправление при logout
// Error handling и recovery
```

#### **Component Library Extensions**
```typescript
// Добавленные shadcn/ui компоненты:
- Avatar: для user profile display
- Enhanced Button variants: для glassmorphism style
- Improved Card components: с modern spacing
- Theme Provider: для dark/light mode switching
```

### 📊 Design System архитектура

#### **Color Palette (Horizon UI based)**
```scss
// Основные цвета
primary: #3b82f6 (blue-500)
accent: #10b981 (emerald-500)
surface: #ffffff/70 (glassmorphism)
text: #1f2937 (gray-800)

// Dark mode
dark-surface: #111827/70 (gray-900 glassmorphism)
dark-text: #f9fafb (gray-50)
```

#### **Typography System**
```scss
// Font family: Inter (modern, readable)
// Font sizes: Tailwind scale (text-sm to text-4xl)
// Font weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
// Line heights: оптимизированы для readability
```

#### **Spacing & Layout**
```scss
// 8px grid system
spacing: 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem
// Container max-widths: 7xl (80rem) для dashboard content
// Responsive breakpoints: sm, md, lg, xl, 2xl
```

### 🚀 Production Deployment

**Deployment URL**: `https://tgeasy-avr4ev24t-shishkinartemiy-gmailcoms-projects.vercel.app`

**Build optimization**:
- ✅ **Static generation**: оптимизированные static pages
- ✅ **Tree shaking**: unused code elimination
- ✅ **Bundle size**: минимизированный JavaScript bundle
- ✅ **Performance**: Lighthouse scores improvement

**Compatibility testing**:
- ✅ **Desktop browsers**: Chrome, Firefox, Safari, Edge
- ✅ **Mobile devices**: iOS Safari, Android Chrome
- ✅ **Accessibility**: WCAG 2.1 compliance
- ✅ **Dark mode**: полная поддержка system preferences

### 🔄 Integration workflow

#### **Development Process**
1. **Analysis**: изучение Horizon UI boilerplate структуры
2. **Selective integration**: выборочное копирование relevant компонентов
3. **Adaptation**: адаптация под TGeasy domain requirements
4. **Testing**: comprehensive QA на development environment
5. **Production deployment**: direct deployment через Vercel

#### **Maintenance Strategy**
- **Component isolation**: каждый Horizon UI компонент изолирован
- **Update compatibility**: легкая возможность обновления shadcn/ui
- **Custom overrides**: TGeasy-specific стили в отдельных файлах
- **Documentation**: comprehensive component documentation

### 📈 Benefits Achieved

#### **User Experience**
- 🎨 **Modern aesthetics**: профессиональный, современный внешний вид
- ⚡ **Performance**: быстрые transitions и smooth animations
- 📱 **Mobile optimization**: отличная работа на всех устройствах
- 🌙 **Dark mode**: полная поддержка темной темы

#### **Developer Experience**
- 🔧 **Component reusability**: переиспользуемые UI компоненты
- 📝 **TypeScript integration**: полная типизация
- 🧪 **Easy testing**: изолированные, testable компоненты
- 📚 **Documentation**: четкая структура и naming conventions

#### **Business Value**
- 💼 **Professional appearance**: более credible для business users
- 🚀 **Faster development**: готовые UI patterns для новых features
- 🎯 **User retention**: improved UX ведет к better engagement
- 📊 **Competitive advantage**: modern UI против competitors

### 🔮 Future Development Strategy

#### **Phase 2: Enhanced HorizonUI Components**
- **Advanced Analytics**: Charts и dashboard widgets с HorizonUI стилями
- **Enhanced Forms**: Professional form components с validation
- **Posts Management**: UI для создания и редактирования рекламных размещений
- **Contract Management**: Interface для работы с договорами

#### **Phase 3: Domain Expansion**
- **Payments Interface**: ЮКасса интеграция с HorizonUI дизайном
- **Analytics Dashboard**: Comprehensive reporting с modern визуализацией
- **User Management**: Advanced пользовательские настройки
- **Mobile Optimization**: Enhanced responsive experience

#### **Development Approach**:
- ✅ **Manual Crafting**: Ручная разработка вместо автогенерации
- ✅ **HorizonUI Standards**: Следование design system guidelines
- ✅ **Quality Control**: Тщательное тестирование каждого компонента
- ✅ **Performance Focus**: Оптимизация bundle size и loading times

**Заключение**: Переход на **HorizonUI-driven development** обеспечивает **stable foundation** для долгосрочного развития TGeasy с focus на качество и производительность вместо скорости автогенерации.

## Соответствие требованиям ОРД (Операторы Рекламных Данных)

### Текущий статус соответствия
- ✅ Базовое управление договорами и рекламодателями
- ❌ Интеграция с ОРД для получения токенов (ERID)
- ❌ Передача данных в ЕРИР
- ❌ Система отчетности по рекламным кампаниям

### План доработки для полного соответствия:

#### Этап 1: Расширение модели данных
1. **Договоры:**
   - Добавить тип договора (самореклама/агентство/прямой)
   - Добавить код ККТУ (Классификатор категорий товаров и услуг)
   - Добавить информацию о площадках размещения
   - Добавить связь с рекламными кампаниями

2. **Рекламные кампании:**
   - Создать модель Campaign с токенами ERID
   - Отслеживание показов, кликов, бюджетов
   - Связь с договорами и площадками

#### Этап 2: Интеграция с ОРД
1. **API интеграции:**
   - VK ОРД (бесплатный)
   - Яндекс ОРД (бесплатный) 
   - МедиаСкаут (от 1000 руб/мес)
   - Первый ОРД (от 5000 руб/мес)

2. **Функции:**
   - Регистрация рекламодателей в ОРД
   - Получение токенов для креативов
   - Автоматическая маркировка постов

#### Этап 3: Система отчетности
1. **Ежемесячные отчеты в ОРД**
2. **Отслеживание статистики кампаний**
3. **Автоматическая передача данных в ЕРИР**

#### Этап 4: Автоматизация процессов
1. **Автоматическая маркировка постов с токенами**
2. **Уведомления о необходимости подачи отчетности**
3. **Проверка соответствия требованиям законодательства**

### Приоритетность задач:
1. **Высокий приоритет:** Интеграция с бесплатными ОРД (VK, Яндекс)
2. **Средний приоритет:** Расширение модели данных
3. **Низкий приоритет:** Полная автоматизация процессов

### 2025-02-10 — Incremental Architecture Update (v1.7.0)

#### Multi-user Telegram Channels
* **Shared ownership model**: один канал хранится в `telegram_channels`, а права каждого пользователя — в новой таблице `channel_permissions` (enum `creator`/`administrator` + флаги `can_post_messages`, …).
* **Локальное скрытие канала**: массив `disconnected_by_users UUID[]` внутри `telegram_channels` позволяет пользователю «отвязать» канал только из своего интерфейса (can reconnect later).
* **Endpoint flow**
  ```text
  POST /api/channels/connect      → создаёт или связывает канал, upsert в channel_permissions
  POST /api/channels/[id]/disconnect → удаляет запись permission, добавляет user_id в disconnected_by_users
  GET  /api/channels              → ChannelRepository.getUserChannels возвращает union(owned ∪ permissions) \ disconnected
  ```

#### Contracts – Безопасная выдача файлов
* Все файлы хранятся в bucket `contracts` (Supabase Storage) путём `<user_id>/<slugified_fileName>`.
* Публичные URL отключены → для доступа используется временный signed URL (1 час).
  * **API**: `GET /api/contracts/{id}/download` генерирует ссылку через `fileUploadService.getSignedUrl()` и делает 302 redirect.
* Frontend (`ContractCard`, `ContractTable`) вызывает `contractsApi.downloadContract`, который либо:
  1. скачивает Blob и создаёт `blob:` URL для Preview/Download,
  2. в будущем сможет открывать signed URL напрямую.

#### Auth & Security Notes
* Пока не настроен полноценный Supabase session через Telegram-callback, backend работает под **service-role**-клиентом, а идентификация выполняется по cookie `user_id` (see `getUserIdFromRequest`).  
  RLS остаётся защищённой, т.к. операции выполняет service-role, но данные всегда фильтруются по `user_id` в SQL/коде.

#### File-upload hardening
* Имя файла нормализуется до ASCII-slug: `timestamp_rand_slug.ext` → устраняет ошибку «Invalid key» в Storage.
* Телефонная валидация сервер-сайд: E.164 (11-15 цифр, optional +) — синхронизирована с клиентом.

> Эти изменения не затрагивают общую DDD-структуру, но уточняют механизмы **Channels** и **Contracts** доменов. Добавленные таблицы/поля отражены в `schemas/database.sql` и миграциях cloud-БД.
