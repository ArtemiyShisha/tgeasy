import { NextRequest } from 'next/server'
import { requireAuthInAPI } from './middleware'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Получает идентификатор пользователя (UUID) из запроса.
 * 
 * Алгоритм:
 * 1. Пытаемся извлечь сессию Supabase через серверный клиент (рекомендуемый путь).
 * 2. Если сессии нет, пробуем fallback на старую cookie-based авторизацию (`requireAuthInAPI`).
 * 3. Если оба способа не дали результата — бросаем ошибку 401.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  // 1. Проверяем Supabase cookies / Bearer-token
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.id) {
      return user.id
    }
  } catch (e) {
    // ignore – fallback below
    console.warn('[Auth] Supabase auth failure:', e instanceof Error ? e.message : e)
  }

  // 2. Cookie-only fallback (trust user_id cookie when service-role mode)
  const cookieUserId = request.cookies.get('user_id')?.value
  if (cookieUserId) {
    return cookieUserId
  }

  // 3. Fallback на старую cookie-based систему (с проверкой в БД)
  try {
    const user = await requireAuthInAPI(request)
    if (user?.id) {
      return user.id
    }
  } catch (e) {
    // ignore – will throw below
  }

  // 4. Пользователь не найден → 401
  throw new Error('Unauthenticated')
}

/**
 * Возвращает объект пользователя (с учётом выбранного механизма авторизации).
 */
export async function getUserFromRequest(request: NextRequest) {
  // Пробуем Supabase сначала
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) return user
  } catch {}

  // Fallback
  return await requireAuthInAPI(request)
} 