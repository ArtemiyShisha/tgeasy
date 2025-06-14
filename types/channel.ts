import { Database } from './database'
import { TelegramChat, TelegramChatMember } from './telegram'
import { ChannelPermission } from './channel-permissions'

// Base channel type from database - using telegram_channels table
export type Channel = Database['public']['Tables']['telegram_channels']['Row']
export type ChannelInsert = Database['public']['Tables']['telegram_channels']['Insert']
export type ChannelUpdate = Database['public']['Tables']['telegram_channels']['Update']

// Telegram permissions type alias for consistency
export type TelegramChannelPermissions = ChannelPermission

// Channel with permissions and user status
export interface ChannelWithPermissions extends Channel {
  user_permissions?: TelegramChannelPermissions
  telegram_chat?: TelegramChat
  member_count?: number
  last_post_at?: string
  posts_count?: number
}

// Channel connection request
export interface ChannelConnectionRequest {
  identifier: string // username (@channel) or invite link
  user_id: string
  telegram_id?: string // Telegram user ID для проверки прав
  verify_admin_rights?: boolean
}

// Channel connection response
export interface ChannelConnectionResponse {
  success: boolean
  channel?: ChannelWithPermissions
  error?: string
  error_code?: ChannelConnectionErrorCode
  telegram_data?: {
    chat: TelegramChat
    user_member?: TelegramChatMember
    bot_member?: TelegramChatMember
  }
}

// Error codes for channel operations
export enum ChannelConnectionErrorCode {
  INVALID_IDENTIFIER = 'invalid_identifier',
  CHANNEL_NOT_FOUND = 'channel_not_found',
  ACCESS_DENIED = 'access_denied',
  BOT_NOT_ADMIN = 'bot_not_admin',
  USER_NOT_ADMIN = 'user_not_admin',
  ALREADY_CONNECTED = 'already_connected',
  TELEGRAM_API_ERROR = 'telegram_api_error',
  VALIDATION_ERROR = 'validation_error'
}

// Channel status
export enum ChannelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING = 'pending'
}

// Channel verification data
export interface ChannelVerification {
  channel_id: string
  is_accessible: boolean
  bot_is_admin: boolean
  user_permissions: TelegramChannelPermissions | null
  member_count: number
  last_verified_at: string
  verification_error?: string
}

// Channel filters for API queries
export interface ChannelFilters {
  user_id?: string
  status?: ('active' | 'inactive' | 'error' | 'pending')[]
  telegram_status?: ('creator' | 'administrator')[]
  search?: string
  has_permissions?: string[] // e.g., ['can_post_messages', 'can_edit_messages']
  created_after?: string
  created_before?: string
  page?: number
  limit?: number
}

// Channel statistics
export interface ChannelStats {
  channel_id: string
  posts_count: number
  total_views: number
  total_clicks: number
  avg_engagement_rate: number
  last_post_at?: string
  growth_rate?: number
  subscriber_trend?: {
    current: number
    previous: number
    change_percent: number
  }
}

// Channel management operations
export interface ChannelManagementOperation {
  type: 'sync_permissions' | 'verify_status' | 'update_stats' | 'refresh_data'
  channel_id: string
  user_id: string
  options?: Record<string, any>
}

// Bulk channel operations
export interface BulkChannelOperation {
  operation: 'sync_permissions' | 'verify_status' | 'update_status'
  channel_ids: string[]
  user_id: string
  options?: Record<string, any>
}

// Channel validation result
export interface ChannelValidationResult {
  is_valid: boolean
  identifier_type: 'username' | 'invite_link' | 'chat_id'
  parsed_identifier: string
  errors: string[]
  warnings: string[]
}

// Channel sync result
export interface ChannelSyncResult {
  success: boolean
  channel_id: string
  permissions_updated: boolean
  stats_updated: boolean
  errors: string[]
  sync_timestamp: string
}

// API response types
export interface ChannelsListResponse {
  channels: ChannelWithPermissions[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ChannelResponse {
  channel: ChannelWithPermissions
}

export interface ChannelPermissionsResponse {
  permissions: TelegramChannelPermissions
  last_synced_at: string
  sync_source: 'telegram_api' | 'webhook' | 'manual'
}

// WebSocket events for real-time updates
export interface ChannelWebSocketEvent {
  type: 'channel_updated' | 'permissions_changed' | 'status_changed' | 'stats_updated'
  channel_id: string
  user_id: string
  data: any
  timestamp: string
} 