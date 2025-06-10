/**
 * Система разрешений TGeasy
 * Определяет роли пользователей и их права доступа
 */

/**
 * Основные роли в системе
 */
export enum UserRole {
  USER = 'user',     // Обычный пользователь
  ADMIN = 'admin'    // Администратор системы
}

/**
 * Разрешения на уровне системы
 */
export enum SystemPermission {
  // Управление пользователями
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Управление каналами
  MANAGE_CHANNELS = 'manage_channels',
  CREATE_CHANNELS = 'create_channels',
  VIEW_CHANNELS = 'view_channels',
  
  // Управление размещениями
  CREATE_POSTS = 'create_posts',
  MANAGE_POSTS = 'manage_posts',
  PUBLISH_POSTS = 'publish_posts',
  
  // Управление договорами
  MANAGE_CONTRACTS = 'manage_contracts',
  VIEW_CONTRACTS = 'view_contracts',
  
  // Аналитика
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_ANALYTICS = 'export_analytics',
  
  // Администрирование
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  
  // Платежи
  MANAGE_BILLING = 'manage_billing',
  VIEW_BILLING = 'view_billing'
}

/**
 * Разрешения на уровне канала
 */
export enum ChannelPermission {
  OWNER = 'owner',      // Владелец канала (все права)
  ADMIN = 'admin',      // Администратор канала (все кроме удаления)
  EDITOR = 'editor',    // Редактор (создание/редактирование постов)
  VIEWER = 'viewer'     // Просмотр (только аналитика)
}

/**
 * Карта разрешений для ролей пользователей
 */
const ROLE_PERMISSIONS: Record<UserRole, SystemPermission[]> = {
  [UserRole.USER]: [
    SystemPermission.VIEW_CHANNELS,
    SystemPermission.CREATE_CHANNELS,
    SystemPermission.MANAGE_CHANNELS,
    SystemPermission.CREATE_POSTS,
    SystemPermission.MANAGE_POSTS,
    SystemPermission.PUBLISH_POSTS,
    SystemPermission.VIEW_CONTRACTS,
    SystemPermission.MANAGE_CONTRACTS,
    SystemPermission.VIEW_ANALYTICS,
    SystemPermission.EXPORT_ANALYTICS,
    SystemPermission.VIEW_BILLING,
    SystemPermission.MANAGE_BILLING
  ],
  
  [UserRole.ADMIN]: [
    // Админы имеют все разрешения
    ...Object.values(SystemPermission)
  ]
}

/**
 * Иерархия разрешений канала (от меньшего к большему)
 */
const CHANNEL_PERMISSION_HIERARCHY = [
  ChannelPermission.VIEWER,
  ChannelPermission.EDITOR,
  ChannelPermission.ADMIN,
  ChannelPermission.OWNER
]

/**
 * Проверяет имеет ли роль определенное системное разрешение
 */
export function hasSystemPermission(role: UserRole, permission: SystemPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Проверяет имеет ли пользователь определенное разрешение канала
 */
export function hasChannelPermission(
  userChannelRole: ChannelPermission,
  requiredPermission: ChannelPermission
): boolean {
  const userLevel = CHANNEL_PERMISSION_HIERARCHY.indexOf(userChannelRole)
  const requiredLevel = CHANNEL_PERMISSION_HIERARCHY.indexOf(requiredPermission)
  
  return userLevel >= requiredLevel
}

/**
 * Получает все системные разрешения для роли
 */
export function getSystemPermissions(role: UserRole): SystemPermission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Проверяет может ли пользователь выполнить действие с ресурсом
 */
export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  requiredPermission: SystemPermission
): boolean {
  // Админы имеют доступ ко всему
  if (userRole === UserRole.ADMIN) {
    return true
  }
  
  // Проверяем системное разрешение
  if (!hasSystemPermission(userRole, requiredPermission)) {
    return false
  }
  
  // Пользователи имеют доступ только к своим ресурсам
  return userId === resourceOwnerId
}

/**
 * Определяет какие действия можно выполнять с каналом
 */
export function getChannelActions(permission: ChannelPermission): string[] {
  switch (permission) {
    case ChannelPermission.OWNER:
      return [
        'view', 'edit', 'delete', 'manage_permissions', 
        'create_posts', 'edit_posts', 'delete_posts', 'publish_posts',
        'view_analytics', 'export_analytics', 'manage_contracts'
      ]
    
    case ChannelPermission.ADMIN:
      return [
        'view', 'edit', 'manage_permissions',
        'create_posts', 'edit_posts', 'delete_posts', 'publish_posts',
        'view_analytics', 'export_analytics', 'manage_contracts'
      ]
    
    case ChannelPermission.EDITOR:
      return [
        'view', 'create_posts', 'edit_posts', 'publish_posts',
        'view_analytics'
      ]
    
    case ChannelPermission.VIEWER:
      return ['view', 'view_analytics']
    
    default:
      return []
  }
}

/**
 * Проверяет может ли пользователь выполнить действие с каналом
 */
export function canPerformChannelAction(
  permission: ChannelPermission,
  action: string
): boolean {
  const allowedActions = getChannelActions(permission)
  return allowedActions.includes(action)
}

/**
 * Валидирует роль пользователя
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}

/**
 * Валидирует разрешение канала
 */
export function isValidChannelPermission(permission: string): permission is ChannelPermission {
  return Object.values(ChannelPermission).includes(permission as ChannelPermission)
}

/**
 * Получает роль по умолчанию для нового пользователя
 */
export function getDefaultUserRole(): UserRole {
  return UserRole.USER
}

/**
 * Получает разрешение канала по умолчанию для владельца
 */
export function getDefaultChannelPermission(): ChannelPermission {
  return ChannelPermission.OWNER
}

/**
 * Интерфейс для проверки разрешений пользователя
 */
export interface UserPermissions {
  systemPermissions: SystemPermission[]
  channelPermissions: Map<string, ChannelPermission>
  
  hasSystemPermission(permission: SystemPermission): boolean
  hasChannelPermission(channelId: string, permission: ChannelPermission): boolean
  canAccessResource(resourceOwnerId: string, permission: SystemPermission): boolean
  canPerformChannelAction(channelId: string, action: string): boolean
}

/**
 * Создает объект разрешений для пользователя
 */
export function createUserPermissions(
  role: UserRole,
  userId: string,
  channelPermissions: Map<string, ChannelPermission> = new Map()
): UserPermissions {
  const systemPermissions = getSystemPermissions(role)
  
  return {
    systemPermissions,
    channelPermissions,
    
    hasSystemPermission(permission: SystemPermission): boolean {
      return hasSystemPermission(role, permission)
    },
    
    hasChannelPermission(channelId: string, permission: ChannelPermission): boolean {
      const userChannelRole = channelPermissions.get(channelId)
      if (!userChannelRole) return false
      
      return hasChannelPermission(userChannelRole, permission)
    },
    
    canAccessResource(resourceOwnerId: string, permission: SystemPermission): boolean {
      return canAccessResource(role, userId, resourceOwnerId, permission)
    },
    
    canPerformChannelAction(channelId: string, action: string): boolean {
      const userChannelRole = channelPermissions.get(channelId)
      if (!userChannelRole) return false
      
      return canPerformChannelAction(userChannelRole, action)
    }
  }
} 