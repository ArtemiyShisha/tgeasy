import { NextRequest } from 'next/server'

/**
 * Тестовая версия getUserIdFromRequest для API тестирования
 * Возвращает фиксированный user_id для тестов
 */
export async function getTestUserIdFromRequest(request: NextRequest): Promise<string> {
  // Для тестирования возвращаем фиксированный UUID
  const testUserId = '550e8400-e29b-41d4-a716-446655440000'
  
  // В реальном коде здесь была бы проверка Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthenticated')
  }
  
  return testUserId
}

/**
 * Проверяет, является ли запрос тестовым
 */
export function isTestRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  return authHeader === 'Bearer test-token'
} 