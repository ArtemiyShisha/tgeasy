import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserSession } from '@/types/auth'

/**
 * Результат проверки аутентификации в middleware (упрощенный)
 */
export interface AuthMiddlewareResult {
  isAuthenticated: boolean
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
      role: 'user', // Все пользователи имеют базовую роль 'user'
      
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
 * Главная функция middleware для проверки аутентификации (упрощенная)
 * 
 * ⚠️ АРХИТЕКТУРНОЕ ИЗМЕНЕНИЕ: 
 * - Убрана проверка ролей (isAdmin)
 * - Channel permissions проверяются на уровне API, не middleware
 * - Только базовая аутентификация: authenticated/unauthenticated
 */
export async function authMiddleware(request: NextRequest): Promise<AuthMiddlewareResult> {
  try {
    // Валидируем сессию через cookies и БД
    const user = await validateSession(request)

    // Возвращаем упрощенный результат проверки
    return {
      isAuthenticated: user !== null,
      user
    }

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // В случае ошибки считаем пользователя неавторизованным
    return {
      isAuthenticated: false,
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
 * Вспомогательная функция для проверки админ прав в API routes
 * (оставлена для совместимости, но используется редко)
 */
export async function requireAdminInAPI(request: NextRequest): Promise<UserSession> {
  const user = await requireAuthInAPI(request)
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}

/**
 * ⚠️ УДАЛЕНО: checkChannelPermission
 * 
 * Channel permissions теперь проверяются на уровне API endpoints
 * через Telegram API, а не в middleware
 * 
 * Для проверки прав к каналу используйте:
 * - lib/integrations/telegram/permissions.ts
 * - Проверка в конкретных API endpoints
 */ 