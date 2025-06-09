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
  
  -- Планирование
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  telegram_message_id BIGINT,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE posts IS 'Рекламные размещения в каналах';
COMMENT ON COLUMN posts.creative_text IS 'Текст креатива (до 4096 символов в Telegram)';
COMMENT ON COLUMN posts.erid IS 'Уникальный токен, выдаваемый ОРД';

-- Медиафайлы для постов
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Файл
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document'
  file_size INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE post_media IS 'Медиафайлы (фото, видео), прикрепленные к постам';
COMMENT ON COLUMN post_media.sort_order IS 'Порядок отображения медиафайлов';

-- Аналитика постов
CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Метрики
  views INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  reactions JSONB, -- {'❤️': 10, '👍': 5}
  
  -- Производные метрики
  click_rate NUMERIC(5, 4) GENERATED ALWAYS AS (
    CASE WHEN views > 0 THEN (clicks::numeric / views) ELSE 0 END
  ) STORED,

  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE post_analytics IS 'Данные аналитики по каждому посту';
COMMENT ON COLUMN post_analytics.click_rate IS 'CTR - отношение кликов к просмотрам';

-- Публичные ссылки для отчетов
CREATE TABLE public_stats_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Настройки ссылки
  slug VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  password_hash VARCHAR(255), -- Хэш пароля
  
  -- Фильтры для отчета
  post_ids UUID[],
  channel_ids UUID[],
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0
);

COMMENT ON TABLE public_stats_links IS 'Публичные ссылки на статистику для рекламодателей';
COMMENT ON COLUMN public_stats_links.slug IS 'Уникальный идентификатор для URL';
COMMENT ON COLUMN public_stats_links.password_hash IS 'Хэш пароля для доступа к ссылке';

-- Платежи
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE RESTRICT,
  
  -- Информация о платеже
  yookassa_payment_id VARCHAR(255) UNIQUE,
  amount_kopecks INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
  status payment_status NOT NULL,
  
  -- Метаданные
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT payments_amount_positive CHECK (amount_kopecks > 0)
);

COMMENT ON TABLE payments IS 'История платежей пользователей';
COMMENT ON COLUMN payments.yookassa_payment_id IS 'ID платежа в системе ЮКасса';

-- Настройки уведомлений пользователя
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Настройки по типам уведомлений
  post_published BOOLEAN NOT NULL DEFAULT true,
  post_failed BOOLEAN NOT NULL DEFAULT true,
  ord_registered BOOLEAN NOT NULL DEFAULT true,
  ord_failed BOOLEAN NOT NULL DEFAULT true,
  subscription_expiring BOOLEAN NOT NULL DEFAULT true,
  payment_failed BOOLEAN NOT NULL DEFAULT true,
  channel_error BOOLEAN NOT NULL DEFAULT true,
  
  -- Каналы доставки
  enable_telegram BOOLEAN NOT NULL DEFAULT true,
  enable_email BOOLEAN NOT NULL DEFAULT false,
  
  -- Общие настройки
  do_not_disturb_from TIME,
  do_not_disturb_to TIME,
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE notification_settings IS 'Персональные настройки уведомлений для каждого пользователя';

-- Логи отправленных уведомлений
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Информация об уведомлении
  type notification_type NOT NULL,
  channel VARCHAR(10) NOT NULL, -- 'telegram' or 'email'
  content TEXT NOT NULL,
  
  -- Статус
  is_sent BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  
  -- Метаданные
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT notification_logs_channel_valid CHECK (channel IN ('telegram', 'email'))
);

COMMENT ON TABLE notification_logs IS 'Логи всех отправленных уведомлений';

-- ================================================================
-- СЛУЖЕБНЫЕ ТАБЛИЦЫ
-- ================================================================

-- Логи интеграций
CREATE TABLE integration_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Информация о логе
  service VARCHAR(50) NOT NULL, -- e.g., 'yookassa', 'ord_yandex', 'telegram_bot'
  level VARCHAR(10) NOT NULL, -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  payload JSONB, -- Тело запроса или ответа
  
  -- Связанные сущности
  related_user_id UUID REFERENCES users(id),
  related_post_id UUID REFERENCES posts(id),
  related_payment_id UUID REFERENCES payments(id),
  
  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT integration_logs_level_valid CHECK (level IN ('info', 'warning', 'error'))
);

COMMENT ON TABLE integration_logs IS 'Логи взаимодействия с внешними сервисами (ОРД, ЮКасса)';

-- Кэш
CREATE TABLE cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE cache IS 'Кэширование данных для уменьшения нагрузки на БД и API';

-- ================================================================
-- ИНДЕКСЫ
-- ================================================================

-- Для users
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Для user_subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- Для telegram_channels
CREATE INDEX idx_telegram_channels_user_id ON telegram_channels(user_id);
CREATE INDEX idx_telegram_channels_telegram_id ON telegram_channels(telegram_channel_id);
CREATE INDEX idx_telegram_channels_active ON telegram_channels(is_active);

-- Для channel_permissions
CREATE INDEX idx_channel_permissions_channel_id ON channel_permissions(channel_id);
CREATE INDEX idx_channel_permissions_user_id ON channel_permissions(user_id);

-- Для contracts
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_advertiser_inn ON contracts(advertiser_inn);

-- Для posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_channel_id ON posts(channel_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_ord_status ON posts(ord_status);

-- Составные индексы для posts
CREATE INDEX idx_posts_user_status ON posts(user_id, status);
CREATE INDEX idx_posts_channel_status ON posts(channel_id, status);
CREATE INDEX idx_posts_status_scheduled ON posts(status, scheduled_at) WHERE status = 'scheduled';

-- Для post_media
CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_sort_order ON post_media(post_id, sort_order);

-- Для post_analytics
CREATE INDEX idx_post_analytics_post_id ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_created_at ON post_analytics(created_at);

-- Составной индекс для аналитики
CREATE INDEX idx_analytics_post_date ON post_analytics(post_id, created_at);

-- Для public_stats_links
CREATE INDEX idx_public_stats_links_user_id ON public_stats_links(user_id);
CREATE INDEX idx_public_stats_links_active ON public_stats_links(is_active);
CREATE INDEX idx_public_stats_links_expires_at ON public_stats_links(expires_at);

-- Для payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_yookassa_id ON payments(yookassa_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Для notification_logs
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Для integration_logs
CREATE INDEX idx_integration_logs_service ON integration_logs(service);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at);
CREATE INDEX idx_integration_logs_user_id ON integration_logs(related_user_id);
CREATE INDEX idx_integration_logs_post_id ON integration_logs(related_post_id);

-- Для cache
CREATE INDEX idx_cache_expires_at ON cache(expires_at);

-- Полнотекстовый поиск
CREATE INDEX idx_posts_title_fts ON posts USING gin(to_tsvector('russian', title));
CREATE INDEX idx_posts_creative_text_fts ON posts USING gin(to_tsvector('russian', creative_text));
CREATE INDEX idx_contracts_title_fts ON contracts USING gin(to_tsvector('russian', title));

-- ================================================================
-- ХРАНИМЫЕ ПРОЦЕДУРЫ И ФУНКЦИИ
-- ================================================================

-- ----------------------------------------------------------------
-- -- Функция для автоматического обновления `updated_at`
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Автоматически обновляет поле updated_at при изменении строки.';

-- ----------------------------------------------------------------
-- -- Функция для получения статистики по каналу
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_channel_stats(channel_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE(total_views BIGINT, total_clicks BIGINT, total_shares BIGINT, total_posts BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pa.views), 0)::BIGINT, 
    COALESCE(SUM(pa.clicks), 0)::BIGINT, 
    COALESCE(SUM(pa.shares), 0)::BIGINT,
    COUNT(p.id)::BIGINT
  FROM posts p
  LEFT JOIN post_analytics pa ON pa.post_id = p.id
  WHERE 
    p.channel_id = channel_uuid AND
    p.published_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_channel_stats(UUID, INTEGER) IS 'Возвращает агрегированную статистику для канала за указанный период.';

-- ----------------------------------------------------------------
-- -- Функция для очистки просроченного кэша
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Запуск очистки кэша раз в час
SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache()');

-- ================================================================
-- ТРИГГЕРЫ
-- ================================================================

-- Автоматическое обновление `updated_at` для таблиц
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

-- ----------------------------------------------------------------
-- -- Триггер для расчета CTR в post_analytics
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_click_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.views > 0 THEN
    -- Поле click_rate теперь является GENERATED, поэтому триггер не нужен для его обновления.
    -- Оставляем функцию-заглушку, чтобы не переписывать логику, если она понадобится.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер больше не нужен, так как click_rate - это `GENERATED ALWAYS AS ... STORED`
-- CREATE TRIGGER calculate_post_analytics_ctr
--   BEFORE INSERT OR UPDATE ON post_analytics
--   FOR EACH ROW EXECUTE PROCEDURE calculate_click_rate();

-- ----------------------------------------------------------------
-- -- Триггер для создания дефолтных настроек уведомлений
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_settings
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE create_default_notification_settings();

-- ================================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ================================================================

-- ----------------------------------------------------------------
-- -- Представление для постов с аналитикой
-- ----------------------------------------------------------------
CREATE VIEW posts_with_analytics AS
SELECT 
  p.*,
  COALESCE(pa.views, 0) AS views,
  COALESCE(pa.clicks, 0) AS clicks,
  COALESCE(pa.shares, 0) AS shares,
  pa.click_rate
FROM posts p
LEFT JOIN (
  SELECT 
    post_id,
    SUM(views) AS views,
    SUM(clicks) AS clicks,
    SUM(shares) AS shares,
    MAX(click_rate) AS click_rate
  FROM post_analytics
  GROUP BY post_id
) pa ON p.id = pa.post_id;

-- ----------------------------------------------------------------
-- -- Представление для активных подписок
-- ----------------------------------------------------------------
CREATE VIEW active_user_subscriptions AS
SELECT 
  us.*,
  u.telegram_username
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
WHERE us.status = 'active' AND us.expires_at > NOW();

-- ----------------------------------------------------------------
-- -- Представление для статистики каналов
-- ----------------------------------------------------------------
CREATE VIEW channel_statistics AS
SELECT 
  pwa.channel_id,
  tc.channel_title,
  SUM(pwa.views) AS total_views,
  SUM(pwa.clicks) AS total_clicks,
  AVG(pwa.click_rate) AS avg_click_rate,
  COUNT(pwa.id) AS total_posts
FROM posts_with_analytics pwa
JOIN telegram_channels tc ON tc.id = pwa.channel_id
GROUP BY pwa.channel_id, tc.channel_title;

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
-- КОНЕЦ СХЕМЫ
-- ================================================================ 