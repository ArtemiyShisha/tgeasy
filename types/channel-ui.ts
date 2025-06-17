import { Tables } from './database';
import { BotStatus } from './channel';

// Type aliases for better readability
export type Channel = Tables<'telegram_channels'>;
export type ChannelPermission = Tables<'channel_permissions'>;

// UI-specific channel data with permissions
export interface ChannelWithPermissions extends Channel {
  permissions?: ChannelPermission;
  isCreator: boolean;
  isAdministrator: boolean;
  canPost: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeInfo: boolean;
  canInviteUsers: boolean;
}

// Channel status for monitoring
export interface ChannelStatus {
  id: string;
  isOnline: boolean;
  isConnected: boolean;
  lastCheck: Date;
  memberCount: number;
  lastError?: string;
  telegramPermissions?: TelegramChannelPermissions;
}

// Telegram-native permissions
export interface TelegramChannelPermissions {
  telegram_status: 'creator' | 'administrator';
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
  last_synced_at: Date;
  sync_error?: string;
}

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason: string;
  requiredLevel?: 'creator' | 'administrator';
}

// Channel connection state
export interface ChannelConnectionState {
  isConnecting: boolean;
  error?: string;
  step: 'idle' | 'validating' | 'connecting' | 'syncing' | 'completed';
  progress?: number;
}

// Channel filters
export interface ChannelFilters {
  status?: 'all' | 'connected' | 'disconnected' | 'error';
  permission?: string;
  search?: string;
  sortBy?: 'title' | 'created_at' | 'member_count' | 'last_activity';
  sortOrder?: 'asc' | 'desc';
}

// API response types
export interface ChannelsListResponse {
  channels: ChannelWithPermissions[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ChannelConnectionResponse {
  success: boolean;
  channel: ChannelWithPermissions;
  message?: string;
  warnings?: string[];
}

export interface ChannelAnalytics {
  id: string;
  memberCount: number;
  growthRate?: number;
  lastActivity?: Date;
  engagementRate?: number;
  topPosts?: Array<{
    id: string;
    views: number;
    likes: number;
    shares: number;
    date: Date;
  }>;
}

export interface ChannelError {
  code: string;
  message: string;
  retryable: boolean;
  details?: any;
}

// Hook options
export interface UseChannelsOptions {
  filters?: ChannelFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseChannelStatusOptions {
  pollingInterval?: number;
  enabled?: boolean;
}

export interface UseChannelPermissionsOptions {
  autoSync?: boolean;
  syncInterval?: number;
}

// UI Component Props
export interface ChannelCardProps {
  channel: ChannelWithPermissions;
  onUpdate?: (channel: ChannelWithPermissions) => void;
  onDisconnect?: (channelId: string) => void;
  showPermissions?: boolean;
  actions?: React.ReactNode;
}

export interface ChannelListProps {
  channels: ChannelWithPermissions[];
  loading?: boolean;
  error?: string;
  filters?: ChannelFilters;
  onFiltersChange?: (filters: ChannelFilters) => void;
  onChannelSelect?: (channel: ChannelWithPermissions) => void;
  onChannelUpdate?: (channel: ChannelWithPermissions) => void;
  onChannelDisconnect?: (channelId: string) => void;
}

export interface ChannelConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (usernameOrLink: string) => Promise<void>;
  connecting?: boolean;
  error?: string;
}

export interface ChannelPermissionsDisplayProps {
  permissions: TelegramChannelPermissions;
  compact?: boolean;
  showSyncStatus?: boolean;
  onSync?: () => void;
}

export interface ChannelStatusIndicatorProps {
  status: ChannelStatus;
  showDetails?: boolean;
  onRefresh?: () => void;
}

// Form types
export interface ChannelConnectionForm {
  input: string;
  type: 'username' | 'invite_link';
  isValid: boolean;
}

export interface ChannelUpdateForm {
  settings: {
    auto_publish?: boolean;
    post_template?: string;
    scheduling_enabled?: boolean;
    moderation_enabled?: boolean;
  };
  notifications: {
    on_new_members?: boolean;
    on_post_published?: boolean;
    on_error?: boolean;
  };
}

// Event types
export interface ChannelEvent {
  type: 'connected' | 'disconnected' | 'permissions_updated' | 'status_changed' | 'error';
  channelId: string;
  timestamp: Date;
  data?: any;
}

// Utility types
export type ChannelPermissionType = keyof Omit<TelegramChannelPermissions, 'telegram_status' | 'last_synced_at' | 'sync_error'>;

export type ChannelSortField = NonNullable<ChannelFilters['sortBy']>;

export type ChannelStatusType = NonNullable<ChannelFilters['status']>;

// Constants
export const CHANNEL_PERMISSION_OPTIONS: Array<{
  key: ChannelPermissionType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: 'can_post_messages',
    label: 'Публикация сообщений',
    description: 'Возможность публиковать новые сообщения в канале',
    icon: '📝'
  },
  {
    key: 'can_edit_messages',
    label: 'Редактирование сообщений',
    description: 'Возможность редактировать существующие сообщения',
    icon: '✏️'
  },
  {
    key: 'can_delete_messages',
    label: 'Удаление сообщений',
    description: 'Возможность удалять сообщения из канала',
    icon: '🗑️'
  },
  {
    key: 'can_change_info',
    label: 'Изменение информации',
    description: 'Возможность изменять название, описание и фото канала',
    icon: 'ℹ️'
  },
  {
    key: 'can_invite_users',
    label: 'Приглашение пользователей',
    description: 'Возможность приглашать новых подписчиков',
    icon: '👥'
  }
];

export const CHANNEL_STATUS_OPTIONS: Array<{
  key: ChannelStatusType;
  label: string;
  color: string;
  icon: string;
}> = [
  {
    key: 'all',
    label: 'Все каналы',
    color: 'gray',
    icon: '📋'
  },
  {
    key: 'connected',
    label: 'Подключенные',
    color: 'green',
    icon: '✅'
  },
  {
    key: 'disconnected',
    label: 'Отключенные',
    color: 'red',
    icon: '❌'
  },
  {
    key: 'error',
    label: 'С ошибками',
    color: 'orange',
    icon: '⚠️'
  }
];

export const CHANNEL_SORT_OPTIONS: Array<{
  key: ChannelSortField;
  label: string;
  icon: string;
}> = [
  {
    key: 'title',
    label: 'По названию',
    icon: '🔤'
  },
  {
    key: 'created_at',
    label: 'По дате добавления',
    icon: '📅'
  },
  {
    key: 'member_count',
    label: 'По количеству подписчиков',
    icon: '👥'
  },
  {
    key: 'last_activity',
    label: 'По последней активности',
    icon: '⏰'
  }
]; 