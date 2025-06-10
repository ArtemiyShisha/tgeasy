import { createClient } from '@/lib/supabase/server'
import type { UserSession } from '@/types/auth'

/**
 * Получает текущую сессию пользователя
 * @returns сессия пользователя или null
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Создаем UserSession из данных auth.users
    const userSession: UserSession = {
      id: user.id,
      telegram_id: user.user_metadata?.telegram_id || 0,
      telegram_username: user.user_metadata?.telegram_username || null,
      telegram_first_name: user.user_metadata?.telegram_first_name || null,
      telegram_last_name: user.user_metadata?.telegram_last_name || null,
      email: user.email || null,
      company_name: null,
      created_at: user.created_at,
      updated_at: user.updated_at || null,
      last_login_at: user.last_sign_in_at || null,
      role: user.app_metadata?.role || 'user',
      
      // Вычисляемые поля
      display_name: (() => {
        const firstName = user.user_metadata?.telegram_first_name
        const lastName = user.user_metadata?.telegram_last_name
        const username = user.user_metadata?.telegram_username
        
        if (firstName) {
          return lastName ? `${firstName} ${lastName}` : firstName
        }
        
        if (username) {
          return `@${username}`
        }
        
        return 'Пользователь'
      })(),
      avatar_url: user.user_metadata?.avatar_url || null
    }

    return userSession

  } catch (error) {
    console.error('getCurrentSession error:', error)
    return null
  }
}

/**
 * Проверяет авторизован ли пользователь
 * @returns true если пользователь авторизован
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return session !== null
}

/**
 * Проверяет является ли пользователь администратором
 * @returns true если пользователь админ
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession()
  return session?.role === 'admin'
}

/**
 * Получает ID текущего пользователя
 * @returns ID пользователя или null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.id || null
}

/**
 * Получает Telegram ID текущего пользователя
 * @returns Telegram ID или null
 */
export async function getCurrentTelegramId(): Promise<number | null> {
  const session = await getCurrentSession()
  return session?.telegram_id || null
}

/**
 * Требует авторизацию пользователя (выбрасывает ошибку если не авторизован)
 * @returns сессия пользователя
 * @throws Error если пользователь не авторизован
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getCurrentSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

/**
 * Требует права администратора (выбрасывает ошибку если не админ)
 * @returns сессия администратора
 * @throws Error если пользователь не админ
 */
export async function requireAdmin(): Promise<UserSession> {
  const session = await requireAuth()
  if (session.role !== 'admin') {
    throw new Error('Admin privileges required')
  }
  return session
}

/**
 * Проверяет имеет ли пользователь права доступа к ресурсу
 * @param resourceUserId - ID владельца ресурса
 * @returns true если есть доступ
 */
export async function hasAccessToResource(resourceUserId: string): Promise<boolean> {
  const session = await getCurrentSession()
  if (!session) return false
  
  // Админы имеют доступ ко всему
  if (session.role === 'admin') return true
  
  // Пользователи имеют доступ только к своим ресурсам
  return session.id === resourceUserId
}

/**
 * Безопасно проверяет авторизацию без выброса ошибок
 * @returns объект с информацией об авторизации
 */
export async function checkAuth(): Promise<{
  isAuthenticated: boolean
  isAdmin: boolean
  user: UserSession | null
}> {
  try {
    const user = await getCurrentSession()
    return {
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      user
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      user: null
    }
  }
} 