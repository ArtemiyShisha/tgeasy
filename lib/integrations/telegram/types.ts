/**
 * Дополнительные типы для Telegram Bot API интеграции
 * Специфичные для функционала управления каналами и правами
 */

// Переэкспортируем основные типы из channel-permissions для consistency
export type {
  TelegramChatMember,
  TelegramChatAdministrator,
  TelegramUserStatus,
  ChannelPermission,
  ChannelPermissionsSync,
  UserChannelAccess,
  ChannelPermissionsSummary,
  PermissionCheckResult,
  SyncChannelPermissionsRequest,
  SyncChannelPermissionsResponse,
  BulkPermissionsSyncRequest,
  BulkPermissionsSyncResponse,
  PermissionType,
  PermissionFilter,
  ChannelPermissionCreate,
  ChannelPermissionUpdate
} from '@/types/channel-permissions';

// Интерфейсы для Telegram Bot API специфичные для каналов
export interface TelegramChannelInfo {
  id: number;
  type: 'channel' | 'supergroup';
  title?: string;
  username?: string;
  description?: string;
  invite_link?: string;
  subscriber_count?: number;
  is_verified?: boolean;
  is_scam?: boolean;
  is_fake?: boolean;
}

export interface TelegramChannelStatistics {
  member_count: number;
  administrator_count: number;
  restricted_count: number;
  banned_count: number;
  online_count?: number;
}

export interface TelegramBotPermissions {
  can_be_edited: boolean;
  can_manage_chat: boolean;
  can_delete_messages: boolean;
  can_manage_video_chats: boolean;
  can_restrict_members: boolean;
  can_promote_members: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  can_pin_messages: boolean;
  can_post_messages?: boolean; // Только для каналов
  can_edit_messages?: boolean; // Только для каналов
}

export interface TelegramPermissionMapping {
  telegram_permission: keyof TelegramBotPermissions;
  tgeasy_permission: string;
  required_for_creator: boolean;
  required_for_administrator: boolean;
}

// Конфигурация для мониторинга каналов
export interface ChannelMonitoringConfig {
  channel_id: string;
  check_interval_minutes: number;
  monitor_member_count: boolean;
  monitor_permissions: boolean;
  alert_on_admin_changes: boolean;
  alert_on_bot_removal: boolean;
}

// Результат мониторинга канала
export interface ChannelMonitoringResult {
  channel_id: string;
  timestamp: Date;
  member_count: number;
  member_count_change: number;
  administrator_count: number;
  administrator_changes: string[];
  bot_status: 'admin' | 'member' | 'removed';
  errors: string[];
}

// Статистика использования Bot API
export interface BotApiUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  rate_limited_requests: number;
  average_response_time_ms: number;
  last_24h_requests: number;
  most_used_methods: Array<{
    method: string;
    count: number;
  }>;
}

// Конфигурация rate limiting
export interface RateLimitConfig {
  requests_per_second: number;
  burst_size: number;
  per_chat_limit: number;
  cooldown_period_ms: number;
}

// Результат проверки канала
export interface ChannelValidationResult {
  valid: boolean;
  exists: boolean;
  accessible: boolean;
  is_channel: boolean;
  bot_is_member: boolean;
  bot_is_admin: boolean;
  user_can_access: boolean;
  required_permissions_present: boolean;
  errors: string[];
  warnings: string[];
}

// Данные для подключения канала
export interface ChannelConnectionData {
  telegram_id: string; // @username или chat_id
  title: string;
  username?: string;
  description?: string;
  member_count: number;
  invite_link?: string;
  validation_result: ChannelValidationResult;
  initial_permissions: any[];
}

// Webhook события
export interface TelegramWebhookEvent {
  event_type: 'chat_member_update' | 'my_chat_member_update' | 'channel_post' | 'message';
  chat_id: string;
  user_id?: number;
  timestamp: Date;
  data: any;
  processed: boolean;
  error?: string;
}

// Конфигурация webhook
export interface WebhookConfig {
  url: string;
  secret_token?: string;
  allowed_updates: string[];
  max_connections: number;
  drop_pending_updates: boolean;
}

// Результат настройки webhook
export interface WebhookSetupResult {
  success: boolean;
  webhook_url: string;
  webhook_info?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    ip_address?: string;
    last_error_date?: number;
    last_error_message?: string;
  };
  error?: string;
}

// Константы для mapping прав
export const TELEGRAM_PERMISSION_MAPPINGS: TelegramPermissionMapping[] = [
  {
    telegram_permission: 'can_post_messages',
    tgeasy_permission: 'can_post_messages',
    required_for_creator: true,
    required_for_administrator: false
  },
  {
    telegram_permission: 'can_edit_messages',
    tgeasy_permission: 'can_edit_messages',
    required_for_creator: true,
    required_for_administrator: false
  },
  {
    telegram_permission: 'can_delete_messages',
    tgeasy_permission: 'can_delete_messages',
    required_for_creator: true,
    required_for_administrator: false
  },
  {
    telegram_permission: 'can_change_info',
    tgeasy_permission: 'can_change_info',
    required_for_creator: true,
    required_for_administrator: false
  },
  {
    telegram_permission: 'can_invite_users',
    tgeasy_permission: 'can_invite_users',
    required_for_creator: true,
    required_for_administrator: false
  }
];

// Статусы каналов
export type ChannelStatus = 'active' | 'inactive' | 'error' | 'bot_removed' | 'access_denied';

// Уровни логирования для Telegram API
export type TelegramLogLevel = 'debug' | 'info' | 'warn' | 'error';

// Интерфейс для логирования Telegram API вызовов
export interface TelegramApiLog {
  timestamp: Date;
  level: TelegramLogLevel;
  method: string;
  chat_id?: string;
  user_id?: number;
  request_params?: any;
  response_data?: any;
  error?: string;
  duration_ms: number;
  rate_limited: boolean;
}

// Опции для Telegram API клиента
export interface TelegramApiClientOptions {
  bot_token: string;
  base_url?: string;
  timeout_ms?: number;
  retry_attempts?: number;
  retry_delay_ms?: number;
  rate_limit_config?: RateLimitConfig;
  enable_logging?: boolean;
  log_level?: TelegramLogLevel;
}

// Результат batch операции
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    input: any;
    error: string;
  }>;
  total_processed: number;
  total_successful: number;
  total_failed: number;
  duration_ms: number;
}

// Фильтр для поиска каналов
export interface ChannelSearchFilter {
  query?: string;
  status?: ChannelStatus;
  user_id?: string;
  has_bot_admin?: boolean;
  min_members?: number;
  max_members?: number;
  created_after?: Date;
  last_activity_after?: Date;
}

// Результат поиска каналов
export interface ChannelSearchResult {
  channels: Array<{
    id: string;
    telegram_id: string;
    title: string;
    username?: string;
    member_count: number;
    status: ChannelStatus;
    user_permissions: string[];
    last_sync: Date;
  }>;
  total_count: number;
  page: number;
  per_page: number;
}

export default {}; 