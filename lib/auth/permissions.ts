/**
 * Упрощенная система разрешений TGeasy
 * Основана на Telegram-native правах доступа
 * 
 * ⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ: Отказ от сложной системы ролей TGeasy
 * в пользу синхронизации с Telegram API
 */

/**
 * Базовые роли пользователей (упрощенные)
 */
export enum UserRole {
  USER = 'user',     // Обычный пользователь (все авторизованные)
  ADMIN = 'admin'    // Администратор системы (только для техподдержки)
}

/**
 * Telegram статусы пользователей в каналах (из Telegram API)
 */
export enum TelegramUserStatus {
  CREATOR = 'creator',           // Создатель канала (владелец)
  ADMINISTRATOR = 'administrator' // Администратор канала
}

/**
 * Telegram права в каналах (из getChatMember API)
 */
export interface TelegramChannelPermissions {
  telegram_status: TelegramUserStatus
  can_post_messages: boolean      // → может создавать размещения
  can_edit_messages: boolean      // → может редактировать размещения  
  can_delete_messages: boolean    // → может удалять размещения
  can_change_info: boolean        // → может изменять настройки канала в TGeasy
  can_invite_users: boolean       // → может приглашать пользователей в TGeasy
  can_pin_messages: boolean       // → дополнительные права
}

/**
 * Системные разрешения (упрощенные)
 */
export enum SystemPermission {
  // Базовые права авторизованного пользователя
  ACCESS_DASHBOARD = 'access_dashboard',
  VIEW_OWN_DATA = 'view_own_data',
  
  // Администрирование (только для техподдержки)
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_ALL_USERS = 'view_all_users'
}

/**
 * Карта разрешений для ролей пользователей (упрощенная)
 */
const ROLE_PERMISSIONS: Record<UserRole, SystemPermission[]> = {
  [UserRole.USER]: [
    SystemPermission.ACCESS_DASHBOARD,
    SystemPermission.VIEW_OWN_DATA
  ],
  
  [UserRole.ADMIN]: [
    // Админы имеют все разрешения
    ...Object.values(SystemPermission)
  ]
}

/**
 * Проверяет имеет ли роль определенное системное разрешение
 */
export function hasSystemPermission(role: UserRole, permission: SystemPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Mapping Telegram прав в TGeasy функциональность
 */
export function mapTelegramPermissionsToTGeasy(permissions: TelegramChannelPermissions) {
  return {
    // Основные права контента
    canCreatePosts: permissions.can_post_messages,
    canEditPosts: permissions.can_edit_messages,
    canDeletePosts: permissions.can_delete_messages,
    
    // Права управления каналом
    canManageChannel: permissions.can_change_info,
    canInviteUsers: permissions.can_invite_users,
    
    // Уровень доступа
    isCreator: permissions.telegram_status === TelegramUserStatus.CREATOR,
    isAdministrator: permissions.telegram_status === TelegramUserStatus.ADMINISTRATOR,
    
    // Полные права (creator имеет все)
    hasFullAccess: permissions.telegram_status === TelegramUserStatus.CREATOR
  }
}

/**
 * Проверяет может ли пользователь выполнить действие с каналом
 * на основе Telegram прав
 */
export function canPerformChannelAction(
  permissions: TelegramChannelPermissions,
  action: string
): boolean {
  const mappedPermissions = mapTelegramPermissionsToTGeasy(permissions)
  
  switch (action) {
    case 'create_posts':
      return mappedPermissions.canCreatePosts
    case 'edit_posts':
      return mappedPermissions.canEditPosts
    case 'delete_posts':
      return mappedPermissions.canDeletePosts
    case 'manage_channel':
      return mappedPermissions.canManageChannel
    case 'invite_users':
      return mappedPermissions.canInviteUsers
    case 'view_analytics':
      return true // Все администраторы могут смотреть аналитику
    case 'export_analytics':
      return mappedPermissions.hasFullAccess // Только creators
    case 'manage_contracts':
      return mappedPermissions.hasFullAccess // Только creators
    default:
      return false
  }
}

/**
 * Проверяет имеет ли пользователь доступ к каналу
 * (creator или administrator в Telegram)
 */
export function hasChannelAccess(permissions: TelegramChannelPermissions | null): boolean {
  if (!permissions) return false
  
  return permissions.telegram_status === TelegramUserStatus.CREATOR ||
         permissions.telegram_status === TelegramUserStatus.ADMINISTRATOR
}

/**
 * Получает уровень доступа пользователя к каналу
 */
export function getChannelAccessLevel(permissions: TelegramChannelPermissions | null): string {
  if (!permissions) return 'none'
  
  if (permissions.telegram_status === TelegramUserStatus.CREATOR) {
    return 'creator'
  }
  
  if (permissions.telegram_status === TelegramUserStatus.ADMINISTRATOR) {
    return 'administrator'
  }
  
  return 'none'
}

/**
 * Валидирует роль пользователя
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}

/**
 * Валидирует Telegram статус
 */
export function isValidTelegramStatus(status: string): status is TelegramUserStatus {
  return Object.values(TelegramUserStatus).includes(status as TelegramUserStatus)
}

/**
 * Получает роль пользователя по умолчанию
 */
export function getDefaultUserRole(): UserRole {
  return UserRole.USER
}

/**
 * Упрощенный интерфейс прав пользователя
 */
export interface UserPermissions {
  systemRole: UserRole
  userId: string
  
  // Системные права
  hasSystemPermission(permission: SystemPermission): boolean
  canAccessDashboard(): boolean
  isAdmin(): boolean
  
  // Channel-specific права проверяются отдельно через Telegram API
  // Не хранятся в этом объекте
}

/**
 * Создает объект прав пользователя (упрощенный)
 */
export function createUserPermissions(
  role: UserRole,
  userId: string
): UserPermissions {
  return {
    systemRole: role,
    userId,
    
    hasSystemPermission(permission: SystemPermission): boolean {
      return hasSystemPermission(role, permission)
    },
    
    canAccessDashboard(): boolean {
      return hasSystemPermission(role, SystemPermission.ACCESS_DASHBOARD)
    },
    
    isAdmin(): boolean {
      return role === UserRole.ADMIN
    }
  }
} 