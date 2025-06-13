-- TGeasy Database Schema
-- Supabase PostgreSQL Schema для автоматизации рекламных кампаний в Telegram
-- Версия: 1.0.0
-- Дата создания: 2025-01-20

-- ================================================================
-- EXTENSIONS
-- ================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostgreSQL crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Cron jobs for scheduled tasks
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Full text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================================
-- CUSTOM TYPES (ENUMS)
-- ================================================================

-- Статусы постов/размещений
CREATE TYPE post_status AS ENUM (
  'draft',      -- Черновик
  'scheduled',  -- Запланировано
  'published',  -- Опубликовано
  'failed',      -- Ошибка публикации
  'archived'    -- Архивированный
);

-- Статусы регистрации в ОРД
CREATE TYPE ord_status AS ENUM (
  'pending',    -- Ожидает регистрации
  'registered', -- Зарегистрировано
  'failed',     -- Ошибка регистрации
  'expired'     -- Срок действия ERID истек
);

-- Тарифные планы подписок
CREATE TYPE subscription_plan AS ENUM (
  'FREE',         -- Бесплатный
  'BASIC',        -- Базовый: 3490₽, 5 каналов, 50 постов
  'PRO',          -- Профессиональный: 6990₽, 15 каналов, 200 постов
  'BUSINESS'      -- Корпоративный: 12990₽, 50 каналов, 1000 постов
);

-- Статусы подписок
CREATE TYPE subscription_status AS ENUM (
  'active',     -- Активная
  'canceled',   -- Отменена
  'past_due',   -- Просрочена
  'trialing'    -- Испытательный период
);

-- Роли доступа к каналам
CREATE TYPE channel_role AS ENUM (
  'owner',  -- Владелец канала (все права)
  'editor', -- Редактор (создание постов, просмотр аналитики)
  'viewer'  -- Просмотрщик (только просмотр)
);

-- Статусы платежей
CREATE TYPE payment_status AS ENUM (
  'pending',    -- Ожидает оплаты
  'succeeded',  -- Оплачено
  'failed',     -- Ошибка оплаты
  'refunded'    -- Возвращен
);

-- Типы уведомлений
CREATE TYPE notification_type AS ENUM (
  'post_created',      -- Пост создан
  'post_published',    -- Пост опубликован
  'post_failed',       -- Ошибка публикации
  'ord_registered',    -- ОРД зарегистрирован
  'ord_failed',        -- Ошибка ОРД
  'subscription_expiring', -- Подписка истекает
  'payment_failed',    -- Ошибка платежа
  'channel_connected', -- Канал подключен
  'channel_error'      -- Ошибка канала
);

-- ================================================================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- ================================================================

-- Пользователи системы (интеграция с Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Telegram данные
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(32),
  telegram_first_name VARCHAR(64),
  telegram_last_name VARCHAR(64),
  telegram_activated BOOLEAN NOT NULL DEFAULT false, -- Активирован ли через /start команду
  
  -- Профиль пользователя
  email VARCHAR(255),
  company_name VARCHAR(255),
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT users_telegram_id_positive CHECK (telegram_id > 0)
);

COMMENT ON TABLE users IS 'Пользователи системы, авторизованные через Telegram';
COMMENT ON COLUMN users.telegram_id IS 'ID пользователя в Telegram (уникальный)';
COMMENT ON COLUMN users.telegram_username IS 'Username в Telegram без @';
COMMENT ON COLUMN users.company_name IS 'Название компании пользователя';

-- Подписки пользователей
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Подписка
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  
  -- Даты
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Лимиты плана (кэшируются для производительности)
  max_channels INTEGER NOT NULL,
  max_posts_per_month INTEGER NOT NULL,
  price_kopecks INTEGER NOT NULL, -- Цена в копейках
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_subscriptions_expires_after_start CHECK (expires_at > started_at),
  CONSTRAINT user_subscriptions_positive_limits CHECK (
    max_channels > 0 AND max_posts_per_month > 0 AND price_kopecks > 0
  )
);

COMMENT ON TABLE user_subscriptions IS 'Подписки пользователей на тарифные планы';
COMMENT ON COLUMN user_subscriptions.price_kopecks IS 'Цена подписки в копейках (3490₽ = 349000 копеек)';

-- Telegram каналы пользователей
CREATE TABLE telegram_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Telegram данные
  telegram_channel_id VARCHAR(100) NOT NULL, -- Может быть @username или -100123456789
  channel_title VARCHAR(255) NOT NULL,
  channel_username VARCHAR(32), -- Без @, может быть NULL для приватных каналов
  
  -- Статус канала
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  error_message TEXT, -- Последняя ошибка при проверке канала
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, telegram_channel_id)
);

COMMENT ON TABLE telegram_channels IS 'Telegram каналы, подключенные пользователями';
COMMENT ON COLUMN telegram_channels.telegram_channel_id IS 'ID или username канала в Telegram';
COMMENT ON COLUMN telegram_channels.is_active IS 'Доступен ли канал для постинга';

-- Права доступа к каналам
CREATE TABLE channel_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role channel_role NOT NULL,
  
  -- Метаданные
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id), -- Кто выдал права
  
  -- Constraints
  UNIQUE(channel_id, user_id)
);

COMMENT ON TABLE channel_permissions IS 'Права доступа пользователей к каналам';
COMMENT ON COLUMN channel_permissions.granted_by IS 'ID пользователя, который выдал права';

-- Договоры с рекламодателями
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Информация о договоре
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Рекламодатель
  advertiser_name VARCHAR(255) NOT NULL,
  advertiser_inn VARCHAR(12) NOT NULL,
  advertiser_contact VARCHAR(255), -- Email или телефон
  
  -- Файлы договора
  file_path VARCHAR(500), -- Путь к файлу в Supabase Storage
  file_name VARCHAR(255),
  file_size INTEGER,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT contracts_inn_format CHECK (advertiser_inn ~ '^\d{10,12}$'),
  CONSTRAINT contracts_file_size_positive CHECK (file_size IS NULL OR file_size > 0)
);

COMMENT ON TABLE contracts IS 'Договоры с рекламодателями';
COMMENT ON COLUMN contracts.advertiser_inn IS 'ИНН рекламодателя (10 или 12 цифр)';
COMMENT ON COLUMN contracts.file_path IS 'Путь к файлу договора в Supabase Storage';

-- Рекламные размещения (упрощенная модель вместо campaigns + creatives)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES telegram_channels(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Основная информация
  title VARCHAR(255) NOT NULL,
  status post_status NOT NULL DEFAULT 'draft',
  
  -- Контент креатива (все в одной таблице для упрощения)
  creative_text TEXT NOT NULL,
  creative_images JSONB DEFAULT '[]', -- Массив URL изображений
  target_url TEXT, -- Ссылка на сайт рекламодателя
  
  -- ОРД информация (обязательная для публикации)
  advertiser_inn VARCHAR(12) NOT NULL,
  advertiser_name VARCHAR(255) NOT NULL,
  product_description TEXT NOT NULL,
  erid VARCHAR(50), -- ERID код от ОРД Яндекса
  ord_status ord_status DEFAULT 'pending',
  ord_error_message TEXT, -- Ошибка регистрации в ОРД
  
  -- Планирование и публикация
  scheduled_at TIMESTAMPTZ, -- Время запланированной публикации
  published_at TIMESTAMPTZ, -- Время фактической публикации
  telegram_message_id INTEGER, -- ID сообщения в Telegram после публикации
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT posts_creative_text_not_empty CHECK (length(trim(creative_text)) > 0),
  CONSTRAINT posts_creative_text_length CHECK (length(creative_text) <= 4096),
  CONSTRAINT posts_advertiser_inn_format CHECK (advertiser_inn ~ '^\d{10,12}$'),
  CONSTRAINT posts_scheduled_future CHECK (scheduled_at IS NULL OR scheduled_at > created_at),
  CONSTRAINT posts_erid_with_registered CHECK (
    (ord_status = 'registered' AND erid IS NOT NULL) OR 
    (ord_status != 'registered')
  )
);

COMMENT ON TABLE posts IS 'Рекламные размещения (упрощенная модель, объединяющая кампании и креативы)';
COMMENT ON COLUMN posts.creative_images IS 'JSON массив URLs изображений креатива';
COMMENT ON COLUMN posts.erid IS 'ERID код от ОРД Яндекса для маркировки рекламы';
COMMENT ON COLUMN posts.telegram_message_id IS 'ID сообщения в Telegram после публикации';

-- Медиафайлы постов (отдельная таблица для лучшей нормализации)
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Файл
  file_path VARCHAR(500) NOT NULL, -- Путь в Supabase Storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- MIME type
  
  -- Метаданные
  sort_order INTEGER DEFAULT 0, -- Порядок отображения
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT post_media_file_size_positive CHECK (file_size > 0),
  CONSTRAINT post_media_supported_types CHECK (
    file_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')
  )
);

COMMENT ON TABLE post_media IS 'Медиафайлы рекламных размещений';

-- Аналитика постов (собирается через Telegram Bot API)
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Метрики Telegram
  views INTEGER DEFAULT 0,
  forwards INTEGER DEFAULT 0,
  
  -- Метрики переходов (если есть target_url)
  clicks INTEGER DEFAULT 0,
  click_rate DECIMAL(5,4), -- CTR в процентах (0.0000 - 100.0000)
  
  -- Временная метка
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT post_analytics_positive_metrics CHECK (
    views >= 0 AND forwards >= 0 AND clicks >= 0
  ),
  CONSTRAINT post_analytics_valid_ctr CHECK (
    click_rate IS NULL OR (click_rate >= 0 AND click_rate <= 100)
  )
);

COMMENT ON TABLE post_analytics IS 'Аналитические данные постов, собираемые через Telegram Bot API';
COMMENT ON COLUMN post_analytics.click_rate IS 'CTR в процентах (clicks/views * 100)';

-- Публичные ссылки для экспорта статистики
CREATE TABLE public_stats_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Настройки ссылки
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Фильтры данных
  channel_ids JSONB, -- Массив UUID каналов (NULL = все каналы)
  date_from DATE,
  date_to DATE,
  
  -- Доступ
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ, -- NULL = не истекает
  access_count INTEGER DEFAULT 0, -- Счетчик просмотров
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT public_stats_links_valid_date_range CHECK (
    date_from IS NULL OR date_to IS NULL OR date_to >= date_from
  )
);

COMMENT ON TABLE public_stats_links IS 'Публичные ссылки для предоставления статистики рекламодателям';

-- История платежей
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Платеж
  yookassa_payment_id VARCHAR(36) UNIQUE, -- ID платежа в ЮКасса
  amount_kopecks INTEGER NOT NULL, -- Сумма в копейках
  currency VARCHAR(3) DEFAULT 'RUB',
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Описание
  description TEXT,
  
  -- Метаданные ЮКасса
  payment_method JSONB, -- Данные о способе оплаты
  metadata JSONB, -- Дополнительные данные
  
  -- Даты
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ, -- Время подтверждения платежа
  
  -- Constraints
  CONSTRAINT payments_amount_positive CHECK (amount_kopecks > 0)
);

COMMENT ON TABLE payments IS 'История платежей через ЮКасса';
COMMENT ON COLUMN payments.amount_kopecks IS 'Сумма платежа в копейках';

-- Настройки уведомлений пользователей
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Telegram уведомления
  telegram_notifications BOOLEAN DEFAULT true,
  telegram_chat_id BIGINT, -- ID чата для уведомлений (может отличаться от user telegram_id)
  
  -- Email уведомления (опционально)
  email_notifications BOOLEAN DEFAULT false,
  email VARCHAR(255),
  
  -- Типы уведомлений
  notify_post_published BOOLEAN DEFAULT true,
  notify_post_failed BOOLEAN DEFAULT true,
  notify_ord_registered BOOLEAN DEFAULT false,
  notify_subscription_expiring BOOLEAN DEFAULT true,
  notify_payment_failed BOOLEAN DEFAULT true,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id),
  CONSTRAINT notification_settings_email_when_enabled CHECK (
    NOT email_notifications OR (email_notifications AND email IS NOT NULL)
  )
);

COMMENT ON TABLE notification_settings IS 'Настройки уведомлений пользователей';

-- Логи отправленных уведомлений
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Уведомление
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Доставка
  sent_via VARCHAR(20) NOT NULL, -- 'telegram' или 'email'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ, -- Время доставки (если известно)
  
  -- Статус
  is_successful BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Метаданные
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  metadata JSONB -- Дополнительные данные уведомления
);

COMMENT ON TABLE notification_logs IS 'Логи всех отправленных уведомлений';

-- Логи интеграций с внешними сервисами
CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Интеграция
  service VARCHAR(20) NOT NULL, -- 'telegram', 'ord', 'yookassa'
  operation VARCHAR(50) NOT NULL, -- 'send_message', 'register_creative', 'create_payment'
  
  -- Запрос
  request_data JSONB,
  request_headers JSONB,
  
  -- Ответ
  response_status INTEGER,
  response_data JSONB,
  response_headers JSONB,
  
  -- Статус
  is_successful BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms INTEGER, -- Время выполнения запроса в миллисекундах
  
  -- Связанные объекты
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT integration_logs_valid_service CHECK (
    service IN ('telegram', 'ord', 'yookassa', 'supabase')
  ),
  CONSTRAINT integration_logs_duration_positive CHECK (
    duration_ms IS NULL OR duration_ms >= 0
  )
);

COMMENT ON TABLE integration_logs IS 'Логи всех запросов к внешним сервисам для отладки';

-- Кэш данных для производительности
CREATE TABLE cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT cache_expires_in_future CHECK (expires_at > created_at)
);

COMMENT ON TABLE cache IS 'Кэш данных для улучшения производительности';

-- ================================================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ================================================================

-- Users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- Channels
CREATE INDEX idx_telegram_channels_user_id ON telegram_channels(user_id);
CREATE INDEX idx_telegram_channels_telegram_id ON telegram_channels(telegram_channel_id);
CREATE INDEX idx_telegram_channels_active ON telegram_channels(is_active);

-- Channel permissions
CREATE INDEX idx_channel_permissions_channel_id ON channel_permissions(channel_id);
CREATE INDEX idx_channel_permissions_user_id ON channel_permissions(user_id);

-- Contracts
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_advertiser_inn ON contracts(advertiser_inn);

-- Posts (критически важные для производительности)
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_channel_id ON posts(channel_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_ord_status ON posts(ord_status);

-- Composite индексы для сложных запросов
CREATE INDEX idx_posts_user_status ON posts(user_id, status);
CREATE INDEX idx_posts_channel_status ON posts(channel_id, status);
CREATE INDEX idx_posts_status_scheduled ON posts(status, scheduled_at) WHERE status = 'scheduled';

-- Post media
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_sort_order ON post_media(post_id, sort_order);

-- Analytics
CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_created_at ON post_analytics(created_at);

-- Composite для аналитических запросов
CREATE INDEX idx_analytics_post_date ON post_analytics(post_id, created_at);

-- Public stats links
CREATE INDEX idx_public_stats_links_user_id ON public_stats_links(user_id);
CREATE INDEX idx_public_stats_links_active ON public_stats_links(is_active);
CREATE INDEX idx_public_stats_links_expires_at ON public_stats_links(expires_at);

-- Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_yookassa_id ON payments(yookassa_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Notifications
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Integration logs
CREATE INDEX idx_integration_logs_service ON integration_logs(service);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX idx_integration_logs_user_id ON integration_logs(related_user_id);
CREATE INDEX idx_integration_logs_post_id ON integration_logs(related_post_id);

-- Cache
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Full-text search индексы
CREATE INDEX idx_posts_title_fts ON posts USING gin(to_tsvector('russian', title));
CREATE INDEX idx_posts_creative_text_fts ON posts USING gin(to_tsvector('russian', creative_text));
CREATE INDEX idx_contracts_title_fts ON contracts USING gin(to_tsvector('russian', title));

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Функция для получения ID текущего пользователя из JWT токена
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE SQL STABLE;

-- ----------------------------------------------------------------
-- -- Таблица: users
-- ----------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own data." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data." ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------
-- -- Таблица: user_subscriptions
-- ----------------------------------------------------------------
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions." ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: telegram_channels
-- ----------------------------------------------------------------
ALTER TABLE telegram_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own channels." ON telegram_channels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: channel_permissions
-- ----------------------------------------------------------------
ALTER TABLE channel_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channel owners can manage permissions." ON channel_permissions FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM telegram_channels 
    WHERE telegram_channels.id = channel_permissions.channel_id AND telegram_channels.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view permissions on their channels." ON channel_permissions FOR SELECT
USING (
  (
    EXISTS (
      SELECT 1 FROM telegram_channels 
      WHERE telegram_channels.id = channel_permissions.channel_id AND telegram_channels.user_id = auth.uid()
    )
  ) 
  OR 
  (auth.uid() = user_id)
);


-- ----------------------------------------------------------------
-- -- Таблица: contracts
-- ----------------------------------------------------------------
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own contracts." ON contracts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: posts
-- ----------------------------------------------------------------
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own posts." ON posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: post_media
-- ----------------------------------------------------------------
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage media for their own posts." ON post_media FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM posts WHERE posts.id = post_media.post_id AND posts.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------
-- -- Таблица: post_analytics
-- ----------------------------------------------------------------
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analytics for their own posts." ON post_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts WHERE posts.id = post_analytics.post_id AND posts.user_id = auth.uid()
  )
);
-- Разрешим вставку аналитики для сервисных ролей, но не для пользователей напрямую.
-- Для этого нужно будет использовать сервисный ключ (service_role_key) на бэкенде.

-- ----------------------------------------------------------------
-- -- Таблица: public_stats_links
-- ----------------------------------------------------------------
ALTER TABLE public_stats_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own public links." ON public_stats_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: payments
-- ----------------------------------------------------------------
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own payments." ON payments FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: notification_settings
-- ----------------------------------------------------------------
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notification settings." ON notification_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: notification_logs
-- ----------------------------------------------------------------
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notification logs." ON notification_logs FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- -- Таблица: integration_logs
-- ----------------------------------------------------------------
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own integration logs." ON integration_logs FOR SELECT USING (auth.uid() = related_user_id);

-- ================================================================
-- FUNCTIONS & STORED PROCEDURES
-- ================================================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ language 'plpgsql';

-- Функция для расчета лимитов подписки
CREATE OR REPLACE FUNCTION get_user_subscription_limits(user_uuid UUID)
RETURNS TABLE (
  max_channels INTEGER,
  max_posts_per_month INTEGER,
  current_channels INTEGER,
  current_posts_this_month INTEGER,
  can_add_channel BOOLEAN,
  can_create_post BOOLEAN
) AS $
BEGIN
  RETURN QUERY
  WITH subscription_data AS (
    SELECT us.max_channels, us.max_posts_per_month
    FROM user_subscriptions us
    WHERE us.user_id = user_uuid 
      AND us.status = 'active'
      AND us.expires_at > NOW()
    ORDER BY us.expires_at DESC
    LIMIT 1
  ),
  usage_data AS (
    SELECT 
      COUNT(DISTINCT tc.id)::INTEGER as channels_count,
      COUNT(DISTINCT CASE 
        WHEN p.created_at >= date_trunc('month', NOW()) 
        THEN p.id 
      END)::INTEGER as posts_this_month
    FROM telegram_channels tc
    LEFT JOIN posts p ON p.channel_id = tc.id
    WHERE tc.user_id = user_uuid AND tc.is_active = true
  )
  SELECT 
    COALESCE(sd.max_channels, 0) as max_channels,
    COALESCE(sd.max_posts_per_month, 0) as max_posts_per_month,
    COALESCE(ud.channels_count, 0) as current_channels,
    COALESCE(ud.posts_this_month, 0) as current_posts_this_month,
    COALESCE(ud.channels_count, 0) < COALESCE(sd.max_channels, 0) as can_add_channel,
    COALESCE(ud.posts_this_month, 0) < COALESCE(sd.max_posts_per_month, 0) as can_create_post
  FROM subscription_data sd
  CROSS JOIN usage_data ud;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для создания поста с начальной аналитикой
CREATE OR REPLACE FUNCTION create_post_with_analytics(
  post_data JSONB,
  initial_stats JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $
DECLARE
  new_post_id UUID;
BEGIN
  -- Создаем пост
  INSERT INTO posts (
    user_id, channel_id, contract_id, title, creative_text, 
    creative_images, target_url, advertiser_inn, advertiser_name, 
    product_description, scheduled_at
  ) VALUES (
    (post_data->>'user_id')::UUID,
    (post_data->>'channel_id')::UUID,
    (post_data->>'contract_id')::UUID,
    post_data->>'title',
    post_data->>'creative_text',
    COALESCE(post_data->'creative_images', '[]'::JSONB),
    post_data->>'target_url',
    post_data->>'advertiser_inn',
    post_data->>'advertiser_name',
    post_data->>'product_description',
    (post_data->>'scheduled_at')::TIMESTAMPTZ
  )
  RETURNING id INTO new_post_id;
  
  -- Создаем начальную запись аналитики
  INSERT INTO post_analytics (post_id, views, forwards, clicks)
  VALUES (
    new_post_id,
    COALESCE((initial_stats->>'views')::INTEGER, 0),
    COALESCE((initial_stats->>'forwards')::INTEGER, 0),
    COALESCE((initial_stats->>'clicks')::INTEGER, 0)
  );
  
  RETURN new_post_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения статистики канала
CREATE OR REPLACE FUNCTION get_channel_stats(channel_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_posts INTEGER,
  published_posts INTEGER,
  total_views BIGINT,
  total_forwards BIGINT,
  total_clicks BIGINT,
  avg_views DECIMAL,
  avg_ctr DECIMAL
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(p.id)::INTEGER as total_posts,
    COUNT(CASE WHEN p.status = 'published' THEN 1 END)::INTEGER as published_posts,
    COALESCE(SUM(pa.views), 0)::BIGINT as total_views,
    COALESCE(SUM(pa.forwards), 0)::BIGINT as total_forwards,
    COALESCE(SUM(pa.clicks), 0)::BIGINT as total_clicks,
    COALESCE(AVG(pa.views), 0)::DECIMAL as avg_views,
    CASE 
      WHEN SUM(pa.views) > 0 THEN (SUM(pa.clicks)::DECIMAL / SUM(pa.views) * 100)
      ELSE 0
    END as avg_ctr
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE p.channel_id = channel_uuid
    AND p.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки истекшего кэша
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Автоматическое обновление updated_at для всех таблиц
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_telegram_channels_updated_at 
  BEFORE UPDATE ON telegram_channels 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
  BEFORE UPDATE ON notification_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger для автоматического расчета CTR в аналитике
CREATE OR REPLACE FUNCTION calculate_click_rate()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.views > 0 AND NEW.clicks IS NOT NULL THEN
    NEW.click_rate = (NEW.clicks::DECIMAL / NEW.views * 100);
  ELSE
    NEW.click_rate = NULL;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_post_analytics_ctr
  BEFORE INSERT OR UPDATE ON post_analytics
  FOR EACH ROW EXECUTE PROCEDURE calculate_click_rate();

-- Trigger для создания настроек уведомлений при создании пользователя
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO notification_settings (user_id, telegram_chat_id)
  VALUES (NEW.id, NEW.telegram_id);
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_settings
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE create_default_notification_settings();

-- ================================================================
-- SCHEDULED JOBS (через pg_cron)
-- ================================================================

-- Очистка истекшего кэша каждый час
SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');

-- Очистка старых логов интеграций (старше 30 дней) каждую неделю
SELECT cron.schedule(
  'cleanup-integration-logs', 
  '0 2 * * 0', 
  'DELETE FROM integration_logs WHERE created_at < NOW() - INTERVAL ''30 days'';'
);

-- Очистка старых логов уведомлений (старше 90 дней) каждую неделю
SELECT cron.schedule(
  'cleanup-notification-logs', 
  '0 3 * * 0', 
  'DELETE FROM notification_logs WHERE sent_at < NOW() - INTERVAL ''90 days'';'
);

-- ================================================================
-- SAMPLE DATA для разработки
-- ================================================================

-- Тестовый пользователь
INSERT INTO users (id, telegram_id, telegram_username, telegram_first_name, email, company_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  123456789,
  'testuser',
  'Test',
  'test@example.com',
  'Test Company'
) ON CONFLICT (telegram_id) DO NOTHING;

-- Тестовая подписка
INSERT INTO user_subscriptions (
  user_id, plan, max_channels, max_posts_per_month, price_kopecks, expires_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PRO',
  15,
  200,
  699000,
  NOW() + INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- Тестовый канал
INSERT INTO telegram_channels (id, user_id, telegram_channel_id, channel_title, channel_username)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '@testchannel',
  'Test Channel',
  'testchannel'
) ON CONFLICT DO NOTHING;

-- Тестовый договор
INSERT INTO contracts (
  user_id, title, advertiser_name, advertiser_inn, description
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Договор с Test Advertiser',
  'ООО Тестовый рекламодатель',
  '1234567890',
  'Тестовый договор на размещение рекламы'
) ON CONFLICT DO NOTHING;

-- ================================================================
-- VIEWS для удобной работы с данными
-- ================================================================

-- Представление для полной информации о постах с аналитикой
CREATE VIEW posts_with_analytics AS
SELECT 
  p.*,
  tc.channel_title,
  tc.channel_username,
  c.title as contract_title,
  c.advertiser_name as contract_advertiser,
  pa.views,
  pa.forwards,
  pa.clicks,
  pa.click_rate,
  pa.created_at as analytics_updated_at
FROM posts p
JOIN telegram_channels tc ON tc.id = p.channel_id
LEFT JOIN contracts c ON c.id = p.contract_id
LEFT JOIN LATERAL (
  SELECT * FROM post_analytics 
  WHERE post_id = p.id 
  ORDER BY created_at DESC 
  LIMIT 1
) pa ON true;

COMMENT ON VIEW posts_with_analytics IS 'Полная информация о постах с последней аналитикой';

-- Представление для активных подписок пользователей
CREATE VIEW active_user_subscriptions AS
SELECT 
  us.*,
  u.telegram_username,
  u.company_name,
  CASE 
    WHEN us.expires_at < NOW() + INTERVAL '7 days' THEN 'expiring'
    WHEN us.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END as subscription_health
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
WHERE us.status = 'active';

COMMENT ON VIEW active_user_subscriptions IS 'Активные подписки с информацией о пользователях';

-- Представление для статистики каналов
CREATE VIEW channel_statistics AS
SELECT 
  tc.*,
  COUNT(p.id) as total_posts,
  COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_posts,
  COUNT(CASE WHEN p.created_at >= date_trunc('month', NOW()) THEN 1 END) as posts_this_month,
  COALESCE(SUM(pa.views), 0) as total_views,
  COALESCE(SUM(pa.clicks), 0) as total_clicks,
  CASE 
    WHEN SUM(pa.views) > 0 THEN ROUND(SUM(pa.clicks)::DECIMAL / SUM(pa.views) * 100, 2)
    ELSE 0
  END as overall_ctr
FROM telegram_channels tc
LEFT JOIN posts p ON p.channel_id = tc.id
LEFT JOIN post_analytics pa ON pa.post_id = p.id
GROUP BY tc.id;

COMMENT ON VIEW channel_statistics IS 'Агрегированная статистика по каналам';

-- ================================================================
-- COMMENTS ДЛЯ ДОКУМЕНТАЦИИ
-- ================================================================

COMMENT ON DATABASE postgres IS 'TGeasy - Автоматизация рекламных кампаний в Telegram';

-- Дополнительные комментарии для ключевых концепций
COMMENT ON TYPE post_status IS 'Статусы жизненного цикла рекламного размещения';
COMMENT ON TYPE ord_status IS 'Статусы регистрации в ОРД Яндекса для маркировки рекламы';
COMMENT ON TYPE subscription_plan IS 'Тарифные планы подписок: FREE, BASIC, PRO, BUSINESS';

-- Комментарии для важных индексов
COMMENT ON INDEX idx_posts_user_status IS 'Оптимизация запросов постов пользователя по статусу';
COMMENT ON INDEX idx_posts_status_scheduled IS 'Быстрый поиск запланированных постов для публикации';
COMMENT ON INDEX idx_analytics_post_date IS 'Эффективные запросы аналитики по времени';

-- ================================================================
-- BACKUP & MAINTENANCE РЕКОМЕНДАЦИИ
-- ================================================================

/*
РЕКОМЕНДАЦИИ ПО ОБСЛУЖИВАНИЮ:

1. BACKUP СТРАТЕГИЯ:
   - Ежедневный backup всех данных
   - Еженедельный архив на внешнее хранилище
   - Тестирование восстановления ежемесячно

2. МОНИТОРИНГ:
   - Размер таблиц (особенно post_analytics, integration_logs)
   - Производительность ключевых запросов
   - Использование индексов

3. АРХИВИРОВАНИЕ:
   - post_analytics старше 1 года → archive таблица
   - integration_logs старше 3 месяцев → удаление
   - notification_logs старше 6 месяцев → удаление

4. ПАРТИЦИОНИРОВАНИЕ (при росте):
   - post_analytics по месяцам
   - integration_logs по месяцам
   - payments по годам

5. VACUUM и ANALYZE:
   - Автоматический vacuum включен
   - Ручной ANALYZE после больших изменений
   - REINDEX критических индексов ежемесячно
*/