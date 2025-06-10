import type { Database } from './database'

/**
 * Типы для аутентификации и авторизации в TGeasy
 * Основаны на реальной схеме БД из Supabase
 */

// Основные роли в системе (пока что системные роли в БД нет, используем простое перечисление)
export type UserRole = 'user' | 'admin'

// Базовый тип пользователя из БД
export type DatabaseUser = Database['public']['Tables']['users']['Row']

/**
 * Пользователь в контексте сессии с дополнительными полями
 */
export interface UserSession {
  id: string
  telegram_id: number
  telegram_username: string | null
  telegram_first_name: string | null
  telegram_last_name: string | null
  email: string | null
  company_name: string | null
  created_at: string | null
  updated_at: string | null
  last_login_at: string | null
  
  // Дополнительные поля для сессии
  role: UserRole  // Добавляем роль (пока не в БД, но нужна для middleware)
  
  // Telegram-специфичные поля для быстрого доступа
  display_name: string  // Вычисляемое поле: first_name + last_name или username
  avatar_url?: string   // URL аватара из Telegram (если доступен)
}

/**
 * Данные пользователя из Telegram OAuth
 */
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

/**
 * Контекст аутентификации для компонентов
 */
export interface AuthContext {
  user: UserSession | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (telegramUser: TelegramUser) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

/**
 * Результат операций аутентификации
 */
export interface AuthResult {
  success: boolean
  user?: UserSession
  error?: string
  redirectTo?: string
}

/**
 * Опции для проверки аутентификации
 */
export interface AuthOptions {
  redirectTo?: string
  requireAdmin?: boolean
  allowUnauthenticated?: boolean
}

/**
 * JWT payload для Supabase токена
 */
export interface SupabaseJWTPayload {
  sub: string  // user id
  aud: string
  exp: number
  iat: number
  iss: string
  
  // Пользовательские метаданные
  user_metadata: {
    telegram_id: number
    telegram_username?: string
    telegram_first_name?: string
    telegram_last_name?: string
    role?: UserRole
  }
  
  // Данные приложения
  app_metadata: {
    provider?: string
    providers?: string[]
  }
  
  // Роль пользователя
  role?: string
}

/**
 * Конфигурация Telegram OAuth
 */
export interface TelegramOAuthConfig {
  botToken: string
  botUsername: string
  redirectUrl: string
  allowedDomains?: string[]
}

/**
 * Ошибки аутентификации
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'MISSING_PERMISSIONS',
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Утилиты для работы с пользователями
 */
export const UserUtils = {
  /**
   * Получает отображаемое имя пользователя
   */
  getDisplayName(user: Pick<UserSession, 'telegram_first_name' | 'telegram_last_name' | 'telegram_username'>): string {
    if (user.telegram_first_name) {
      const lastName = user.telegram_last_name ? ` ${user.telegram_last_name}` : ''
      return `${user.telegram_first_name}${lastName}`
    }
    
    if (user.telegram_username) {
      return `@${user.telegram_username}`
    }
    
    return 'Пользователь'
  },

  /**
   * Проверяет является ли пользователь администратором
   */
  isAdmin(user: UserSession | null): boolean {
    return user?.role === 'admin'
  },

  /**
   * Создает UserSession из DatabaseUser
   */
  createSession(dbUser: DatabaseUser, role: UserRole = 'user'): UserSession {
    return {
      ...dbUser,
      role,
      display_name: this.getDisplayName(dbUser)
    }
  }
}

// Типы для создания пользователя в БД
export interface CreateUserData {
  telegram_id: number
  telegram_username?: string
  first_name: string
  last_name?: string
  avatar_url?: string
  email?: string
}

// Типы для ответов API
export interface AuthResponse {
  success: boolean
  message?: string
  redirectUrl?: string
  user?: {
    id: string
    telegram_id: number
    telegram_username?: string
    first_name: string
    last_name?: string
    avatar_url?: string
    created_at: string
  }
}

// Параметры для проверки подписи
export interface TelegramAuthValidation {
  isValid: boolean
  isExpired: boolean
  error?: string
} 