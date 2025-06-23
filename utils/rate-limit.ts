import { NextRequest } from 'next/server'

// Интерфейс для хранения информации о лимитах
interface RateLimitData {
  count: number
  resetTime: number
}

// In-memory хранилище лимитов (в production лучше использовать Redis)
const rateLimitStore = new Map<string, RateLimitData>()

// Конфигурация лимитов для разных операций
export const RATE_LIMITS = {
  // Posts API
  CREATE_POST: { requests: 10, windowMs: 60 * 1000 }, // 10 постов в минуту
  UPDATE_POST: { requests: 30, windowMs: 60 * 1000 }, // 30 обновлений в минуту
  DELETE_POST: { requests: 5, windowMs: 60 * 1000 },  // 5 удалений в минуту
  UPLOAD_MEDIA: { requests: 20, windowMs: 60 * 1000 }, // 20 загрузок в минуту
  
  // General API
  GENERAL: { requests: 100, windowMs: 60 * 1000 }, // 100 запросов в минуту
  
  // Channels API
  CONNECT_CHANNEL: { requests: 5, windowMs: 60 * 1000 }, // 5 подключений в минуту
  
  // Contracts API
  UPLOAD_CONTRACT: { requests: 10, windowMs: 60 * 1000 } // 10 загрузок в минуту
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// Получение IP адреса из запроса
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// Получение user ID из запроса (если авторизован)
function getUserId(request: NextRequest): string | null {
  try {
    const userIdCookie = request.cookies.get('user_id')
    return userIdCookie?.value || null
  } catch {
    return null
  }
}

// Создание ключа для rate limiting
function createRateLimitKey(type: RateLimitType, identifier: string): string {
  return `rate_limit:${type}:${identifier}`
}

// Очистка устаревших записей
function cleanupExpiredEntries(): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((data, key) => {
    if (now > data.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    rateLimitStore.delete(key)
  })
}

// Основная функция проверки rate limit
export function checkRateLimit(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
} {
  const config = RATE_LIMITS[type]
  const now = Date.now()
  
  // Определяем идентификатор для rate limiting
  let identifier: string
  if (customIdentifier) {
    identifier = customIdentifier
  } else {
    const userId = getUserId(request)
    const clientIP = getClientIP(request)
    identifier = userId || clientIP
  }
  
  const key = createRateLimitKey(type, identifier)
  
  // Очищаем устаревшие записи периодически
  if (Math.random() < 0.1) { // 10% вероятность очистки
    cleanupExpiredEntries()
  }
  
  // Получаем текущие данные
  let data = rateLimitStore.get(key)
  
  // Если данных нет или окно сброшено, создаем новые
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  // Проверяем лимит
  if (data.count >= config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      resetTime: data.resetTime,
      error: `Rate limit exceeded. Maximum ${config.requests} requests per ${config.windowMs / 1000} seconds.`
    }
  }
  
  // Увеличиваем счетчик
  data.count++
  rateLimitStore.set(key, data)
  
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - data.count,
    resetTime: data.resetTime
  }
}

// Middleware для автоматической проверки rate limit
export function rateLimitMiddleware(type: RateLimitType) {
  return (request: NextRequest) => {
    const result = checkRateLimit(request, type)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: result.error,
            details: {
              limit: result.limit,
              remaining: result.remaining,
              resetTime: result.resetTime,
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            }
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    return null // Продолжаем обработку
  }
}

// Утилита для добавления rate limit headers в ответ
export function addRateLimitHeaders(
  response: Response,
  result: ReturnType<typeof checkRateLimit>
): Response {
  const newHeaders = new Headers(response.headers)
  newHeaders.set('X-RateLimit-Limit', result.limit.toString())
  newHeaders.set('X-RateLimit-Remaining', result.remaining.toString())
  newHeaders.set('X-RateLimit-Reset', result.resetTime.toString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

// Утилита для проверки и применения rate limit в API роуте
export async function applyRateLimit(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<Response | null> {
  const result = checkRateLimit(request, type, customIdentifier)
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: result.error,
          details: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }
        }
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  return null // Rate limit не превышен
} 