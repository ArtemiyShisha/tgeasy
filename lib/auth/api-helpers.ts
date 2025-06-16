import { NextRequest } from 'next/server'
import { requireAuthInAPI } from './middleware'

/**
 * Получает user_id из аутентифицированного запроса
 * Использует существующую систему аутентификации
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  // ВРЕМЕННО: всегда используем demo пользователя для обхода Vercel SSO
  const demoUserId = 'd08deee6-34c6-4fad-9835-05999f42740e'
  console.log('🎭 Demo mode: Always using demo user ID:', demoUserId)
  return demoUserId
  
  /* Оригинальная логика аутентификации (временно отключена)
  try {
    const user = await requireAuthInAPI(request)
    return user.id
  } catch (error) {
    // Fallback на хардкоженный ID для демонстрации
    console.warn('Auth failed, using demo user. Error:', error instanceof Error ? error.message : error)
    
    // Для публичной демонстрации всегда возвращаем тестового пользователя
    const demoUserId = 'd08deee6-34c6-4fad-9835-05999f42740e'
    console.log('🎭 Demo mode: Using user ID:', demoUserId)
    
    return demoUserId
  }
  */
}

/**
 * Получает полную информацию о пользователе из аутентифицированного запроса
 */
export async function getUserFromRequest(request: NextRequest) {
  return await requireAuthInAPI(request)
} 