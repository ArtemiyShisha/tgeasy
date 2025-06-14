/**
 * Утилиты для работы с правами доступа к каналам в UI компонентах
 */

import type {
  ChannelPermission,
  TelegramUserStatus,
  PermissionType,
  UserChannelAccess,
  ChannelPermissionsSummary
} from '@/types/channel-permissions';

/**
 * Проверяет, имеет ли пользователь конкретное право
 */
export function hasPermission(
  permission: ChannelPermission | null,
  type: PermissionType
): boolean {
  if (!permission) return false;
  
  // Creator имеет все права
  if (permission.telegram_status === 'creator') {
    return true;
  }
  
  // Проверяем конкретное право
  return permission[type] === true;
}

/**
 * Проверяет, является ли пользователь создателем канала
 */
export function isChannelCreator(permission: ChannelPermission | null): boolean {
  return permission?.telegram_status === 'creator';
}

/**
 * Проверяет, является ли пользователь администратором канала
 */
export function isChannelAdmin(permission: ChannelPermission | null): boolean {
  return permission?.telegram_status === 'administrator';
}

/**
 * Получает уровень доступа пользователя
 */
export function getAccessLevel(permission: ChannelPermission | null): 'creator' | 'administrator' | 'none' {
  if (!permission) return 'none';
  
  if (permission.telegram_status === 'creator') return 'creator';
  if (permission.telegram_status === 'administrator') return 'administrator';
  
  return 'none';
}

/**
 * Получает список доступных действий для пользователя
 */
export function getAvailableActions(permission: ChannelPermission | null): PermissionType[] {
  if (!permission) return [];
  
  const actions: PermissionType[] = [];
  
  if (hasPermission(permission, 'can_post_messages')) {
    actions.push('can_post_messages');
  }
  
  if (hasPermission(permission, 'can_edit_messages')) {
    actions.push('can_edit_messages');
  }
  
  if (hasPermission(permission, 'can_delete_messages')) {
    actions.push('can_delete_messages');
  }
  
  if (hasPermission(permission, 'can_change_info')) {
    actions.push('can_change_info');
  }
  
  if (hasPermission(permission, 'can_invite_users')) {
    actions.push('can_invite_users');
  }
  
  return actions;
}

/**
 * Форматирует статус пользователя для отображения
 */
export function formatUserStatus(status: TelegramUserStatus): string {
  switch (status) {
    case 'creator':
      return 'Создатель';
    case 'administrator':
      return 'Администратор';
    default:
      return 'Неизвестно';
  }
}

/**
 * Получает цвет для статуса пользователя
 */
export function getStatusColor(status: TelegramUserStatus): string {
  switch (status) {
    case 'creator':
      return 'text-purple-600 bg-purple-100';
    case 'administrator':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Форматирует название права для отображения
 */
export function formatPermissionName(permission: PermissionType): string {
  switch (permission) {
    case 'can_post_messages':
      return 'Публикация сообщений';
    case 'can_edit_messages':
      return 'Редактирование сообщений';
    case 'can_delete_messages':
      return 'Удаление сообщений';
    case 'can_change_info':
      return 'Изменение информации';
    case 'can_invite_users':
      return 'Приглашение пользователей';
    default:
      return permission;
  }
}

/**
 * Получает иконку для права
 */
export function getPermissionIcon(permission: PermissionType): string {
  switch (permission) {
    case 'can_post_messages':
      return '📝';
    case 'can_edit_messages':
      return '✏️';
    case 'can_delete_messages':
      return '🗑️';
    case 'can_change_info':
      return '⚙️';
    case 'can_invite_users':
      return '👥';
    default:
      return '❓';
  }
}

/**
 * Проверяет, нужна ли синхронизация прав
 */
export function needsPermissionSync(permission: ChannelPermission): boolean {
  // Если есть ошибка синхронизации
  if (permission.sync_error) {
    return true;
  }
  
  // Если синхронизация была более 24 часов назад
  const now = new Date();
  const diffHours = (now.getTime() - permission.last_synced_at.getTime()) / (1000 * 60 * 60);
  
  return diffHours >= 24;
}

/**
 * Форматирует время последней синхронизации
 */
export function formatLastSync(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'только что';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин. назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч. назад`;
  } else {
    return `${diffDays} дн. назад`;
  }
}

/**
 * Получает статус синхронизации
 */
export function getSyncStatus(permission: ChannelPermission): {
  status: 'success' | 'warning' | 'error';
  message: string;
  color: string;
} {
  if (permission.sync_error) {
    return {
      status: 'error',
      message: 'Ошибка синхронизации',
      color: 'text-red-600 bg-red-100'
    };
  }
  
  if (needsPermissionSync(permission)) {
    return {
      status: 'warning',
      message: 'Требуется синхронизация',
      color: 'text-yellow-600 bg-yellow-100'
    };
  }
  
  return {
    status: 'success',
    message: 'Синхронизировано',
    color: 'text-green-600 bg-green-100'
  };
}

/**
 * Фильтрует каналы по уровню доступа
 */
export function filterChannelsByAccess(
  channels: UserChannelAccess[],
  accessLevel?: 'creator' | 'administrator'
): UserChannelAccess[] {
  if (!accessLevel) return channels;
  
  return channels.filter(channel => channel.access_level === accessLevel);
}

/**
 * Сортирует каналы по приоритету (creator > administrator)
 */
export function sortChannelsByAccess(channels: UserChannelAccess[]): UserChannelAccess[] {
  return [...channels].sort((a, b) => {
    // Creator каналы идут первыми
    if (a.access_level === 'creator' && b.access_level !== 'creator') return -1;
    if (b.access_level === 'creator' && a.access_level !== 'creator') return 1;
    
    // Затем сортируем по channel_id (можно заменить на название канала если оно будет доступно)
    return a.channel_id.localeCompare(b.channel_id);
  });
}

/**
 * Получает сводную информацию о правах пользователя
 */
export function getUserPermissionsSummary(permissions: ChannelPermission[]): {
  totalChannels: number;
  creatorChannels: number;
  adminChannels: number;
  syncErrors: number;
  needsSync: number;
} {
  return {
    totalChannels: permissions.length,
    creatorChannels: permissions.filter(p => p.telegram_status === 'creator').length,
    adminChannels: permissions.filter(p => p.telegram_status === 'administrator').length,
    syncErrors: permissions.filter(p => p.sync_error).length,
    needsSync: permissions.filter(p => needsPermissionSync(p)).length,
  };
}

/**
 * Проверяет, может ли пользователь выполнить действие с размещением
 */
export function canPerformPostAction(
  permission: ChannelPermission | null,
  action: 'create' | 'edit' | 'delete' | 'publish'
): boolean {
  if (!permission) return false;
  
  switch (action) {
    case 'create':
    case 'publish':
      return hasPermission(permission, 'can_post_messages');
    case 'edit':
      return hasPermission(permission, 'can_edit_messages');
    case 'delete':
      return hasPermission(permission, 'can_delete_messages');
    default:
      return false;
  }
}

/**
 * Получает список ограничений для пользователя
 */
export function getUserRestrictions(permission: ChannelPermission | null): string[] {
  if (!permission) {
    return ['Нет доступа к каналу'];
  }
  
  const restrictions: string[] = [];
  
  if (!hasPermission(permission, 'can_post_messages')) {
    restrictions.push('Нельзя создавать размещения');
  }
  
  if (!hasPermission(permission, 'can_edit_messages')) {
    restrictions.push('Нельзя редактировать размещения');
  }
  
  if (!hasPermission(permission, 'can_delete_messages')) {
    restrictions.push('Нельзя удалять размещения');
  }
  
  if (!hasPermission(permission, 'can_change_info')) {
    restrictions.push('Нельзя изменять настройки канала');
  }
  
  if (!hasPermission(permission, 'can_invite_users')) {
    restrictions.push('Нельзя приглашать пользователей');
  }
  
  return restrictions;
} 