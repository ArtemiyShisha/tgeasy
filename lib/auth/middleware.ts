import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserSession } from '@/types/auth'

/**
 * Результат проверки аутентификации в middleware
 */
export interface AuthMiddlewareResult {
  isAuthenticated: boolean
  isAdmin: boolean
  user: UserSession | null
}

/**
 * Валидирует сессию пользователя через cookies
 */
async function validateSession(request: NextRequest): Promise<UserSession | null> {
  try {
    // Получаем ID пользователя из cookies
    const userId = request.cookies.get('user_id')?.value
    const telegramId = request.cookies.get('telegram_id')?.value
    
    if (!userId || !telegramId) {
      console.log('No user session found in cookies')
      return null
    }

    // Получаем данные пользователя из базы данных
    const supabase = createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('telegram_id', parseInt(telegramId))
      .single()

    if (error || !user) {
      console.log('User not found in database:', error?.message)
      return null
    }

    // Формируем сессию пользователя
    const userSession: UserSession = {
      id: user.id,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      telegram_first_name: user.telegram_first_name,
      telegram_last_name: user.telegram_last_name,
      email: user.email,
      company_name: user.company_name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
      role: 'user', // По умолчанию все пользователи имеют роль 'user'
      
      // Вычисляемые поля
      display_name: (() => {
        const firstName = user.telegram_first_name
        const lastName = user.telegram_last_name
        const username = user.telegram_username
        
        if (firstName) {
          return lastName ? `${firstName} ${lastName}` : firstName
        }
        
        if (username) {
          return `@${username}`
        }
        
        return 'Пользователь'
      })(),
      avatar_url: undefined // В текущей схеме нет поля avatar_url
    }

    return userSession

  } catch (error) {
    console.error('Session validation failed:', error)
    return null
  }
}

/**
 * Проверка прав доступа к каналу (заглушка для будущего использования)
 * TODO: Реализовать после создания схемы БД
 */
export async function checkChannelPermission(
  userId: string, 
  channelId: string, 
  permission: 'owner' | 'admin' | 'viewer'
): Promise<boolean> {
  try {
    // TODO: Реализовать после создания таблицы channel_permissions
    console.log(`Checking channel permission for user ${userId}, channel ${channelId}, permission ${permission}`)
    
    // Пока что возвращаем true для всех пользователей
    // В будущем здесь будет запрос к БД
    return true

  } catch (error) {
    console.error('Channel permission check failed:', error)
    return false
  }
}

/**
 * Главная функция middleware для проверки аутентификации
 */
export async function authMiddleware(request: NextRequest): Promise<AuthMiddlewareResult> {
  try {
    // Валидируем сессию через cookies и БД
    const user = await validateSession(request)

    // Возвращаем результат проверки
    return {
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      user
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // В случае ошибки считаем пользователя неавторизованным
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null
    }
  }
}

/**
 * Вспомогательная функция для быстрой проверки аутентификации в API routes
 */
export async function requireAuthInAPI(request: NextRequest): Promise<UserSession> {
  const authResult = await authMiddleware(request)
  
  if (!authResult.isAuthenticated || !authResult.user) {
    throw new Error('Authentication required')
  }
  
  return authResult.user
}

/**
 * Вспомогательная функция для быстрой проверки админ прав в API routes
 */
export async function requireAdminInAPI(request: NextRequest): Promise<UserSession> {
  const user = await requireAuthInAPI(request)
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
} 