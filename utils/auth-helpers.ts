/**
 * Вспомогательные утилиты для аутентификации
 * Упрощенные под Telegram-native подход
 */

import type { UserSession } from '@/types/auth'
import { UserRole, SystemPermission, hasSystemPermission } from '@/lib/auth/permissions'

/**
 * Проверяет является ли пользователь аутентифицированным
 */
export function isAuthenticated(user: UserSession | null): boolean {
  return user !== null
}

/**
 * Проверяет является ли пользователь администратором системы
 */
export function isSystemAdmin(user: UserSession | null): boolean {
  return user?.role === UserRole.ADMIN
}

/**
 * Проверяет имеет ли пользователь системное разрешение
 */
export function userHasSystemPermission(
  user: UserSession | null, 
  permission: SystemPermission
): boolean {
  if (!user) return false
  
  const role = user.role as UserRole
  return hasSystemPermission(role, permission)
}

/**
 * Проверяет может ли пользователь получить доступ к dashboard
 */
export function canAccessDashboard(user: UserSession | null): boolean {
  return userHasSystemPermission(user, SystemPermission.ACCESS_DASHBOARD)
}

/**
 * Получает отображаемое имя пользователя
 */
export function getUserDisplayName(user: UserSession | null): string {
  if (!user) return 'Гость'
  
  return user.display_name || 'Пользователь'
}

/**
 * Получает инициалы пользователя для аватара
 */
export function getUserInitials(user: UserSession | null): string {
  if (!user) return 'Г'
  
  const firstName = user.telegram_first_name
  const lastName = user.telegram_last_name
  const username = user.telegram_username
  
  if (firstName) {
    const firstInitial = firstName.charAt(0).toUpperCase()
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ''
    return firstInitial + lastInitial
  }
  
  if (username) {
    return username.charAt(0).toUpperCase()
  }
  
  return 'П'
}

/**
 * Форматирует информацию о пользователе для UI
 */
export function formatUserInfo(user: UserSession | null) {
  if (!user) {
    return {
      displayName: 'Гость',
      initials: 'Г',
      isAuthenticated: false,
      isAdmin: false
    }
  }
  
  return {
    displayName: getUserDisplayName(user),
    initials: getUserInitials(user),
    isAuthenticated: true,
    isAdmin: isSystemAdmin(user),
    telegramUsername: user.telegram_username,
    companyName: user.company_name
  }
}

/**
 * Проверяет принадлежит ли ресурс пользователю
 */
export function isResourceOwner(user: UserSession | null, resourceUserId: string): boolean {
  if (!user) return false
  
  return user.id === resourceUserId
}

/**
 * Проверяет может ли пользователь получить доступ к ресурсу
 * (владелец ресурса или системный администратор)
 */
export function canAccessResource(user: UserSession | null, resourceUserId: string): boolean {
  if (!user) return false
  
  // Системные администраторы имеют доступ ко всему
  if (isSystemAdmin(user)) return true
  
  // Пользователи имеют доступ только к своим ресурсам
  return isResourceOwner(user, resourceUserId)
}

/**
 * Создает объект ошибки для неавторизованного доступа
 */
export function createUnauthorizedError(message = 'Требуется авторизация') {
  return new Error(message)
}

/**
 * Создает объект ошибки для запрещенного доступа
 */
export function createForbiddenError(message = 'Доступ запрещен') {
  return new Error(message)
}

/**
 * Валидирует токен авторизации из заголовков
 */
export function validateAuthToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Извлекает user ID из cookies запроса
 */
export function extractUserIdFromCookies(cookies: { [key: string]: string }): string | null {
  return cookies.user_id || null
}

/**
 * Извлекает telegram ID из cookies запроса
 */
export function extractTelegramIdFromCookies(cookies: { [key: string]: string }): number | null {
  const telegramId = cookies.telegram_id
  return telegramId ? parseInt(telegramId, 10) : null
} 