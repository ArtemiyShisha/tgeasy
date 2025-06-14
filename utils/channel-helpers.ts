import { 
  ChannelWithPermissions, 
  TelegramChannelPermissions, 
  PermissionCheckResult,
  ChannelFilters 
} from '@/types/channel-ui';

// Permission checking utilities
export function canUserAccessChannel(
  userId: string, 
  channel: ChannelWithPermissions
): boolean {
  return channel.user_id === userId && (channel.isCreator || channel.isAdministrator);
}

export function hasPermission(
  permissions: TelegramChannelPermissions | undefined,
  permission: keyof TelegramChannelPermissions
): PermissionCheckResult {
  if (!permissions) {
    return {
      hasPermission: false,
      reason: 'Permissions not loaded'
    };
  }

  if (permission === 'telegram_status') {
    return {
      hasPermission: permissions.telegram_status === 'creator' || permissions.telegram_status === 'administrator',
      reason: permissions.telegram_status === 'creator' ? 'User is creator' : 
              permissions.telegram_status === 'administrator' ? 'User is administrator' : 
              'User is not creator or administrator'
    };
  }

  const hasAccess = Boolean(permissions[permission]);
  
  return {
    hasPermission: hasAccess,
    reason: hasAccess ? `Permission ${permission} granted` : `Permission ${permission} denied`,
    requiredLevel: permissions.telegram_status === 'creator' ? 'creator' : 'administrator'
  };
}

export function isCreator(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.telegram_status === 'creator';
}

export function isAdministrator(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.telegram_status === 'administrator';
}

export function canPost(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.can_post_messages ?? false;
}

export function canEdit(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.can_edit_messages ?? false;
}

export function canDelete(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.can_delete_messages ?? false;
}

export function canChangeInfo(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.can_change_info ?? false;
}

export function canInviteUsers(permissions?: TelegramChannelPermissions): boolean {
  return permissions?.can_invite_users ?? false;
}

// Telegram permissions mapping
export function mapTelegramPermissions(
  telegramMember: any
): TelegramChannelPermissions {
  const status = telegramMember.status;
  const permissions = telegramMember.permissions || {};

  return {
    telegram_status: status === 'creator' ? 'creator' : 'administrator',
    can_post_messages: status === 'creator' || permissions.can_post_messages || false,
    can_edit_messages: status === 'creator' || permissions.can_edit_messages || false,
    can_delete_messages: status === 'creator' || permissions.can_delete_messages || false,
    can_change_info: status === 'creator' || permissions.can_change_info || false,
    can_invite_users: status === 'creator' || permissions.can_invite_users || false,
    last_synced_at: new Date(),
  };
}

export function getPermissionLevel(permissions?: TelegramChannelPermissions): 'creator' | 'administrator' | 'none' {
  if (!permissions) return 'none';
  return permissions.telegram_status;
}

// UI formatting utilities
export function formatPermissionsForUI(permissions?: TelegramChannelPermissions): {
  status: string;
  badge: 'creator' | 'admin' | 'none';
  permissions: Array<{ key: string; label: string; enabled: boolean; icon: string }>;
} {
  if (!permissions) {
    return {
      status: 'Нет доступа',
      badge: 'none',
      permissions: []
    };
  }

  const status = permissions.telegram_status === 'creator' ? 'Создатель' : 'Администратор';
  const badge = permissions.telegram_status === 'creator' ? 'creator' : 'admin';

  const permissionsList = [
    {
      key: 'can_post_messages',
      label: 'Публикация сообщений',
      enabled: permissions.can_post_messages || false,
      icon: '📝'
    },
    {
      key: 'can_edit_messages',
      label: 'Редактирование сообщений',
      enabled: permissions.can_edit_messages || false,
      icon: '✏️'
    },
    {
      key: 'can_delete_messages',
      label: 'Удаление сообщений',
      enabled: permissions.can_delete_messages || false,
      icon: '🗑️'
    },
    {
      key: 'can_change_info',
      label: 'Изменение информации',
      enabled: permissions.can_change_info || false,
      icon: 'ℹ️'
    },
    {
      key: 'can_invite_users',
      label: 'Приглашение пользователей',
      enabled: permissions.can_invite_users || false,
      icon: '👥'
    }
  ];

  return {
    status,
    badge,
    permissions: permissionsList
  };
}

// Channel filtering utilities
export function filterChannelsByPermissions(
  channels: ChannelWithPermissions[],
  permission: string
): ChannelWithPermissions[] {
  switch (permission) {
    case 'creator':
      return channels.filter(channel => channel.isCreator);
    
    case 'administrator':
      return channels.filter(channel => channel.isAdministrator);
    
    case 'can_post':
      return channels.filter(channel => channel.canPost);
    
    case 'can_edit':
      return channels.filter(channel => channel.canEdit);
    
    case 'can_delete':
      return channels.filter(channel => channel.canDelete);
    
    default:
      return channels;
  }
}

export function applyChannelFilters(
  channels: ChannelWithPermissions[],
  filters: ChannelFilters
): ChannelWithPermissions[] {
  let filtered = [...channels];

  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(channel => {
      switch (filters.status) {
        case 'connected':
          return channel.is_active === true;
        case 'disconnected':
          return channel.is_active === false;
        case 'error':
          return channel.error_message !== null;
        default:
          return true;
      }
    });
  }

  // Permission filter
  if (filters.permission) {
    filtered = filterChannelsByPermissions(filtered, filters.permission);
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(channel => 
      channel.channel_title.toLowerCase().includes(searchLower) ||
      (channel.channel_username && channel.channel_username.toLowerCase().includes(searchLower))
    );
  }

  // Sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.channel_title.toLowerCase();
          bValue = b.channel_title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        case 'member_count':
          // Note: member_count might come from separate API
          aValue = 0; // Will be populated from channel status
          bValue = 0;
          break;
        case 'last_activity':
          aValue = a.last_checked_at ? new Date(a.last_checked_at) : new Date(0);
          bValue = b.last_checked_at ? new Date(b.last_checked_at) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return filtered;
}

// Validation utilities
export function isValidChannelUsername(username: string): boolean {
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '');
  
  // Telegram username rules: 5-32 characters, alphanumeric + underscores
  const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
  return usernameRegex.test(cleanUsername);
}

export function isValidInviteLink(link: string): boolean {
  const inviteLinkRegex = /^https:\/\/t\.me\/joinchat\/[a-zA-Z0-9_-]+$/;
  return inviteLinkRegex.test(link);
}

export function normalizeChannelInput(input: string): {
  type: 'username' | 'invite_link';
  value: string;
  isValid: boolean;
} {
  const trimmed = input.trim();

  // Check if it's an invite link
  if (trimmed.startsWith('https://t.me/joinchat/')) {
    return {
      type: 'invite_link',
      value: trimmed,
      isValid: isValidInviteLink(trimmed)
    };
  }

  // Treat as username
  const username = trimmed.replace(/^@/, '');
  return {
    type: 'username',
    value: username,
    isValid: isValidChannelUsername(username)
  };
}

// Error handling utilities
export function getErrorMessage(error: any): string {
  if (error.code) {
    switch (error.code) {
      case 'CHANNEL_NOT_FOUND':
        return 'Канал не найден. Проверьте username или ссылку.';
      case 'BOT_NOT_ADMIN':
        return 'Бот не является администратором канала. Добавьте бота в администраторы.';
      case 'USER_NOT_ADMIN':
        return 'У вас нет прав администратора в этом канале.';
      case 'PERMISSION_DENIED':
        return 'Недостаточно прав для выполнения операции.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Превышен лимит запросов. Попробуйте позже.';
      default:
        return error.message || 'Произошла ошибка при обработке запроса.';
    }
  }

  return error.message || 'Неизвестная ошибка';
}

// Time formatting utilities
export function formatLastSync(date?: Date): string {
  if (!date) return 'Никогда';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Только что';
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU');
}

export function getPermissionsSyncStatus(permissions?: TelegramChannelPermissions): {
  status: 'synced' | 'outdated' | 'never' | 'error';
  message: string;
  needsSync: boolean;
} {
  if (!permissions) {
    return {
      status: 'never',
      message: 'Права не синхронизированы',
      needsSync: true
    };
  }

  if (permissions.sync_error) {
    return {
      status: 'error',
      message: `Ошибка синхронизации: ${permissions.sync_error}`,
      needsSync: true
    };
  }

  const now = new Date();
  const lastSync = new Date(permissions.last_synced_at);
  const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  if (diffHours > 24) {
    return {
      status: 'outdated',
      message: `Синхронизировано ${formatLastSync(lastSync)}`,
      needsSync: true
    };
  }

  return {
    status: 'synced',
    message: `Синхронизировано ${formatLastSync(lastSync)}`,
    needsSync: false
  };
} 