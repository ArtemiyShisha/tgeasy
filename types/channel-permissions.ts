/**
 * Типы для системы управления правами доступа на основе Telegram-native ролей
 */

export type TelegramUserStatus = 'creator' | 'administrator';

export interface ChannelPermission {
  id: string;
  channel_id: string;
  user_id: string;
  telegram_status: TelegramUserStatus;
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  last_synced_at: Date;
  sync_error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TelegramChatMember {
  user: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
  is_anonymous?: boolean;
  can_be_edited?: boolean;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
  can_promote_members?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  can_pin_messages?: boolean;
  can_manage_chat?: boolean;
  can_manage_video_chats?: boolean;
  can_manage_voice_chats?: boolean;
}

export interface TelegramChatAdministrator extends TelegramChatMember {
  status: 'creator' | 'administrator';
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
}

export interface ChannelPermissionsSync {
  channel_id: string;
  user_id: string;
  success: boolean;
  error?: string;
  permissions?: Partial<ChannelPermission>;
  synced_at: Date;
}

export interface UserChannelAccess {
  channel_id: string;
  user_id: string;
  has_access: boolean;
  telegram_status?: TelegramUserStatus;
  permissions?: ChannelPermission;
  access_level: 'none' | 'administrator' | 'creator';
}

export interface ChannelPermissionsSummary {
  channel_id: string;
  total_admins: number;
  total_creators: number;
  active_permissions: number;
  last_sync: Date;
  sync_errors: number;
  needs_sync: boolean;
}

export interface PermissionCheckResult {
  has_permission: boolean;
  reason?: string;
  permission_level: 'none' | 'administrator' | 'creator';
  telegram_status?: TelegramUserStatus;
}

export interface SyncChannelPermissionsRequest {
  channel_id: string;
  force_sync?: boolean;
}

export interface SyncChannelPermissionsResponse {
  success: boolean;
  channel_id: string;
  synced_permissions: number;
  removed_permissions: number;
  errors: string[];
  sync_duration_ms: number;
  last_synced_at: Date;
}

export interface BulkPermissionsSyncRequest {
  channel_ids: string[];
  force_sync?: boolean;
}

export interface BulkPermissionsSyncResponse {
  total_channels: number;
  successful_syncs: number;
  failed_syncs: number;
  results: SyncChannelPermissionsResponse[];
  total_duration_ms: number;
}

// Утилитарные типы
export type PermissionType = 
  | 'can_post_messages'
  | 'can_edit_messages'
  | 'can_delete_messages'
  | 'can_change_info'
  | 'can_invite_users';

export interface PermissionFilter {
  channel_id?: string;
  user_id?: string;
  telegram_status?: TelegramUserStatus;
  permission_type?: PermissionType;
  has_permission?: boolean;
  last_synced_after?: Date;
  has_sync_errors?: boolean;
}

export interface ChannelPermissionCreate {
  channel_id: string;
  user_id: string;
  telegram_status: TelegramUserStatus;
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
}

export interface ChannelPermissionUpdate {
  telegram_status?: TelegramUserStatus;
  can_post_messages?: boolean;
  can_edit_messages?: boolean;
  can_delete_messages?: boolean;
  can_change_info?: boolean;
  can_invite_users?: boolean;
  sync_error?: string;
} 