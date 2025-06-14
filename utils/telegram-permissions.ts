/**
 * Утилиты для работы с Telegram правами доступа
 */

import type {
  TelegramChatMember,
  TelegramChatAdministrator,
  ChannelPermission,
  ChannelPermissionCreate,
  TelegramUserStatus,
  PermissionType,
  PermissionCheckResult,
  UserChannelAccess
} from '@/types/channel-permissions';

/**
 * Проверяет, является ли пользователь администратором или создателем канала
 */
export function isUserChannelAdmin(member: TelegramChatMember): boolean {
  return member.status === 'creator' || member.status === 'administrator';
}

/**
 * Проверяет, является ли пользователь создателем канала
 */
export function isUserChannelCreator(member: TelegramChatMember): boolean {
  return member.status === 'creator';
}

/**
 * Извлекает статус пользователя для TGeasy из Telegram статуса
 */
export function extractTelegramStatus(member: TelegramChatMember): TelegramUserStatus | null {
  if (member.status === 'creator') return 'creator';
  if (member.status === 'administrator') return 'administrator';
  return null;
}

/**
 * Маппинг Telegram permissions в TGeasy права доступа
 */
export function mapTelegramPermissionsToTGeasy(member: TelegramChatAdministrator): ChannelPermissionCreate {
  const telegramStatus = extractTelegramStatus(member);
  if (!telegramStatus) {
    throw new Error(`Invalid telegram status: ${member.status}`);
  }

  return {
    channel_id: '', // Будет заполнено в сервисе
    user_id: '', // Будет заполнено в сервисе
    telegram_status: telegramStatus,
    can_post_messages: member.can_post_messages ?? false,
    can_edit_messages: member.can_edit_messages ?? false,
    can_delete_messages: member.can_delete_messages ?? false,
    can_change_info: member.can_change_info ?? false,
    can_invite_users: member.can_invite_users ?? false,
  };
}

/**
 * Получает уровень доступа пользователя на основе его статуса
 */
export function getAccessLevel(telegramStatus?: TelegramUserStatus): UserChannelAccess['access_level'] {
  switch (telegramStatus) {
    case 'creator':
      return 'creator';
    case 'administrator':
      return 'administrator';
    default:
      return 'none';
  }
}

/**
 * Проверяет конкретное право пользователя
 */
export function checkUserPermission(
  permissions: ChannelPermission | null,
  permissionType: PermissionType
): PermissionCheckResult {
  if (!permissions) {
    return {
      has_permission: false,
      reason: 'User has no permissions for this channel',
      permission_level: 'none'
    };
  }

  const hasPermission = permissions[permissionType];
  
  return {
    has_permission: hasPermission,
    reason: hasPermission ? undefined : `User lacks ${permissionType} permission`,
    permission_level: getAccessLevel(permissions.telegram_status),
    telegram_status: permissions.telegram_status
  };
}

/**
 * Проверяет, может ли пользователь создавать размещения
 */
export function canUserCreatePosts(permissions: ChannelPermission | null): PermissionCheckResult {
  return checkUserPermission(permissions, 'can_post_messages');
}

/**
 * Проверяет, может ли пользователь редактировать размещения
 */
export function canUserEditPosts(permissions: ChannelPermission | null): PermissionCheckResult {
  return checkUserPermission(permissions, 'can_edit_messages');
}

/**
 * Проверяет, может ли пользователь удалять размещения
 */
export function canUserDeletePosts(permissions: ChannelPermission | null): PermissionCheckResult {
  return checkUserPermission(permissions, 'can_delete_messages');
}

/**
 * Проверяет, может ли пользователь управлять настройками канала в TGeasy
 */
export function canUserManageChannel(permissions: ChannelPermission | null): PermissionCheckResult {
  return checkUserPermission(permissions, 'can_change_info');
}

/**
 * Проверяет, может ли пользователь приглашать других пользователей
 */
export function canUserInviteUsers(permissions: ChannelPermission | null): PermissionCheckResult {
  return checkUserPermission(permissions, 'can_invite_users');
}

/**
 * Получает все активные права пользователя в удобном формате
 */
export function getUserActivePermissions(permissions: ChannelPermission | null): string[] {
  if (!permissions) return [];

  const activePermissions: string[] = [];
  
  if (permissions.can_post_messages) activePermissions.push('Публикация сообщений');
  if (permissions.can_edit_messages) activePermissions.push('Редактирование сообщений');
  if (permissions.can_delete_messages) activePermissions.push('Удаление сообщений');
  if (permissions.can_change_info) activePermissions.push('Управление каналом');
  if (permissions.can_invite_users) activePermissions.push('Приглашение пользователей');

  return activePermissions;
}

/**
 * Форматирует статус пользователя для отображения в UI
 */
export function formatTelegramStatus(status: TelegramUserStatus): string {
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
 * Проверяет, нужна ли синхронизация прав (старше 24 часов)
 */
export function needsPermissionsSync(lastSyncedAt: Date): boolean {
  const now = new Date();
  const diffHours = (now.getTime() - lastSyncedAt.getTime()) / (1000 * 60 * 60);
  return diffHours >= 24;
}

/**
 * Получает приоритет права для сортировки
 */
export function getPermissionPriority(permission: PermissionType): number {
  const priorities: Record<PermissionType, number> = {
    'can_post_messages': 1,
    'can_edit_messages': 2,
    'can_delete_messages': 3,
    'can_change_info': 4,
    'can_invite_users': 5,
  };
  
  return priorities[permission] || 999;
}

/**
 * Сравнивает два набора прав и возвращает изменения
 */
export function comparePermissions(
  oldPermissions: ChannelPermission | null,
  newPermissions: Partial<ChannelPermission>
): { changed: boolean; changes: string[] } {
  if (!oldPermissions) {
    return {
      changed: true,
      changes: ['Права созданы']
    };
  }

  const changes: string[] = [];
  const permissionTypes: PermissionType[] = [
    'can_post_messages',
    'can_edit_messages', 
    'can_delete_messages',
    'can_change_info',
    'can_invite_users'
  ];

  // Проверяем изменение статуса
  if (newPermissions.telegram_status && newPermissions.telegram_status !== oldPermissions.telegram_status) {
    changes.push(`Статус изменен с ${formatTelegramStatus(oldPermissions.telegram_status)} на ${formatTelegramStatus(newPermissions.telegram_status)}`);
  }

  // Проверяем изменения прав
  permissionTypes.forEach(permission => {
    if (newPermissions[permission] !== undefined && newPermissions[permission] !== oldPermissions[permission]) {
      const action = newPermissions[permission] ? 'добавлено' : 'удалено';
      changes.push(`Право "${permission}" ${action}`);
    }
  });

  return {
    changed: changes.length > 0,
    changes
  };
}

/**
 * Фильтрует список пользователей, оставляя только администраторов и создателей
 */
export function filterChannelAdmins(members: TelegramChatMember[]): TelegramChatAdministrator[] {
  return members.filter(isUserChannelAdmin) as TelegramChatAdministrator[];
}

/**
 * Создает читаемое описание ошибки синхронизации
 */
export function formatSyncError(error: string): string {
  const errorMappings: Record<string, string> = {
    'CHAT_NOT_FOUND': 'Канал не найден',
    'USER_NOT_PARTICIPANT': 'Пользователь не является участником канала',
    'CHAT_ADMIN_REQUIRED': 'Требуются права администратора',
    'BOT_NOT_ADMIN': 'Бот не является администратором канала',
    'RATE_LIMIT_EXCEEDED': 'Превышен лимит запросов к Telegram API',
    'NETWORK_ERROR': 'Ошибка сети при запросе к Telegram',
  };

  return errorMappings[error] || `Ошибка синхронизации: ${error}`;
}

/**
 * Валидирует данные члена чата из Telegram API
 */
export function validateTelegramChatMember(member: any): member is TelegramChatMember {
  return (
    member &&
    typeof member === 'object' &&
    member.user &&
    typeof member.user.id === 'number' &&
    typeof member.status === 'string' &&
    ['creator', 'administrator', 'member', 'restricted', 'left', 'kicked'].includes(member.status)
  );
} 