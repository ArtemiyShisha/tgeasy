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
  if (!member || typeof member !== 'object') {
    return false;
  }

  // Проверяем обязательные поля
  if (!member.user || typeof member.user.id !== 'number') {
    return false;
  }

  if (!member.status || typeof member.status !== 'string') {
    return false;
  }

  // Проверяем валидные статусы
  const validStatuses = ['creator', 'administrator', 'member', 'restricted', 'left', 'kicked'];
  if (!validStatuses.includes(member.status)) {
    return false;
  }

  return true;
}

/**
 * Проверяет, имеет ли пользователь определенное право
 */
export function hasPermission(
  member: TelegramChatMember, 
  permission: keyof Pick<TelegramChatMember, 'can_post_messages' | 'can_edit_messages' | 'can_delete_messages' | 'can_change_info' | 'can_invite_users'>
): boolean {
  // Создатель имеет все права по умолчанию
  if (member.status === 'creator') {
    return true;
  }

  // Администратор имеет право только если оно явно разрешено
  if (member.status === 'administrator') {
    return member[permission] === true;
  }

  return false;
}

/**
 * Получает все права пользователя в читаемом формате
 */
export function getUserPermissions(member: TelegramChatMember): {
  can_post_messages: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_change_info: boolean;
  can_invite_users: boolean;
} {
  if (member.status === 'creator') {
    return {
      can_post_messages: true,
      can_edit_messages: true,
      can_delete_messages: true,
      can_change_info: true,
      can_invite_users: true,
    };
  }

  if (member.status === 'administrator') {
    return {
      can_post_messages: member.can_post_messages ?? false,
      can_edit_messages: member.can_edit_messages ?? false,
      can_delete_messages: member.can_delete_messages ?? false,
      can_change_info: member.can_change_info ?? false,
      can_invite_users: member.can_invite_users ?? false,
    };
  }

  return {
    can_post_messages: false,
    can_edit_messages: false,
    can_delete_messages: false,
    can_change_info: false,
    can_invite_users: false,
  };
}

/**
 * Сравнивает права двух пользователей Telegram
 */
export function compareTelegramPermissions(
  oldMember: TelegramChatMember, 
  newMember: TelegramChatMember
): {
  changed: boolean;
  changes: Array<{
    permission: string;
    old_value: boolean;
    new_value: boolean;
  }>;
} {
  const oldPermissions = getUserPermissions(oldMember);
  const newPermissions = getUserPermissions(newMember);

  const changes: Array<{
    permission: string;
    old_value: boolean;
    new_value: boolean;
  }> = [];

  Object.keys(oldPermissions).forEach(permission => {
    const key = permission as keyof typeof oldPermissions;
    if (oldPermissions[key] !== newPermissions[key]) {
      changes.push({
        permission,
        old_value: oldPermissions[key],
        new_value: newPermissions[key]
      });
    }
  });

  return {
    changed: changes.length > 0,
    changes
  };
}

/**
 * Проверяет, является ли пользователь активным администратором
 */
export function isActiveAdmin(member: TelegramChatMember): boolean {
  return member.status === 'creator' || member.status === 'administrator';
}

/**
 * Получает уровень прав пользователя
 */
export function getPermissionLevel(member: TelegramChatMember): 'none' | 'administrator' | 'creator' {
  switch (member.status) {
    case 'creator':
      return 'creator';
    case 'administrator':
      return 'administrator';
    default:
      return 'none';
  }
}

/**
 * Форматирует информацию о пользователе для логирования
 */
export function formatUserInfo(member: TelegramChatMember): string {
  const user = member.user;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const username = user.username ? `@${user.username}` : '';
  const identifier = username || `ID:${user.id}`;
  
  return `${name} (${identifier}) - ${member.status}`;
}

/**
 * Получает сводную информацию о правах в канале
 */
export function getChannelPermissionsSummary(administrators: TelegramChatAdministrator[]): {
  total_admins: number;
  creators: number;
  administrators: number;
  permissions_breakdown: Record<string, number>;
} {
  const summary = {
    total_admins: administrators.length,
    creators: 0,
    administrators: 0,
    permissions_breakdown: {
      can_post_messages: 0,
      can_edit_messages: 0,
      can_delete_messages: 0,
      can_change_info: 0,
      can_invite_users: 0,
    }
  };

  administrators.forEach(admin => {
    if (admin.status === 'creator') {
      summary.creators++;
      // Создатель имеет все права
      Object.keys(summary.permissions_breakdown).forEach(permission => {
        (summary.permissions_breakdown as any)[permission]++;
      });
    } else {
      summary.administrators++;
      // Подсчитываем права администратора
      const permissions = getUserPermissions(admin);
      Object.entries(permissions).forEach(([permission, hasPermission]) => {
        if (hasPermission && permission in summary.permissions_breakdown) {
          (summary.permissions_breakdown as any)[permission]++;
        }
      });
    }
  });

  return summary;
}

/**
 * Валидирует права администратора
 */
export function validateAdminPermissions(member: TelegramChatMember): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isActiveAdmin(member)) {
    errors.push('User is not an administrator');
    return { valid: false, errors, warnings };
  }

  // Проверяем специфичные для администратора права
  if (member.status === 'administrator') {
    if (member.can_be_edited === false) {
      warnings.push('Administrator permissions cannot be edited');
    }

    if (member.is_anonymous === true) {
      warnings.push('Administrator is anonymous');
    }

    // Проверяем логические комбинации прав
    if (member.can_delete_messages && !member.can_restrict_members) {
      warnings.push('Admin can delete messages but cannot restrict members');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Создает безопасную копию данных участника без чувствительной информации
 */
export function sanitizeMemberData(member: TelegramChatMember): Partial<TelegramChatMember> {
  return {
    user: {
      id: member.user.id,
      is_bot: member.user.is_bot,
      first_name: member.user.first_name,
      last_name: member.user.last_name,
      username: member.user.username
    },
    status: member.status,
    can_post_messages: member.can_post_messages,
    can_edit_messages: member.can_edit_messages,
    can_delete_messages: member.can_delete_messages,
    can_change_info: member.can_change_info,
    can_invite_users: member.can_invite_users,
    is_anonymous: member.is_anonymous
  };
}

/**
 * Сортирует администраторов по уровню прав
 */
export function sortAdminsByPermissionLevel(admins: TelegramChatAdministrator[]): TelegramChatAdministrator[] {
  return [...admins].sort((a, b) => {
    // Создатели сначала
    if (a.status === 'creator' && b.status !== 'creator') return -1;
    if (b.status === 'creator' && a.status !== 'creator') return 1;
    
    // Затем по количеству прав
    const aPermissions = Object.values(getUserPermissions(a)).filter(Boolean).length;
    const bPermissions = Object.values(getUserPermissions(b)).filter(Boolean).length;
    
    return bPermissions - aPermissions;
  });
} 