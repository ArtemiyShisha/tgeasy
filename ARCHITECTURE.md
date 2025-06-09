# Архитектура TGeasy

## Обзор архитектуры

TGeasy построен как современное SaaS-приложение с **AI-First подходом**, использующее serverless архитектуру для масштабируемости и **21st.dev MCP** для автоматической генерации UI компонентов. Проект полностью спроектирован для разработки с AI-инструментами.

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
- **Users** - управление пользователями и ролями
- **Channels** - управление Telegram каналами  
- **Contracts** - работа с договорами и файлами
- **Posts** - рекламные размещения (упрощено от campaigns/creatives)
- **Analytics** - метрики через Telegram API
- **Payments** - платежная система ЮКасса
- **Notifications** - уведомления в Telegram и email
- **Integrations** - внешние API (ОРД, Telegram Bot, ЮКасса)

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
│   ├── Supabase (PostgreSQL + Auth)     │
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

### 1. Telegram Bot API интеграция
```typescript
// Централизованный Telegram сервис
class TelegramService {
  // Управление каналами
  async getChannelInfo(channelId: string): Promise<ChannelInfo>
  async getChatAdministrators(channelId: string): Promise<ChatMember[]>
  async getUserPermissions(channelId: string, userId: number): Promise<ChatPermissions>
  
  // Публикация контента
  async sendMessage(channelId: string, content: PostContent): Promise<TelegramMessage>
  async schedulePost(channelId: string, content: PostContent, date: Date): Promise<string>
  async editMessage(channelId: string, messageId: number, content: PostContent): Promise<void>
  async deleteMessage(channelId: string, messageId: number): Promise<void>
  
  // Аналитика (каждые 15 минут)
  async getPostStats(channelId: string, messageId: number): Promise<PostStats>
  async getChannelStats(channelId: string): Promise<ChannelStats>
  
  // Уведомления
  async sendNotification(userId: number, message: string): Promise<void>
  
  // Webhook обработка
  async processWebhook(update: TelegramUpdate): Promise<void>
}
```

### 2. ОРД Яндекса интеграция
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

### 3. ЮКасса платежная интеграция
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