import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { UserSession } from '@/types/auth'
import { UserRole, SystemPermission, ChannelPermission } from '@/lib/auth/permissions'
import { UserUtils } from '@/types/auth'

/**
 * Создает ответ с ошибкой аутентификации
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required',
  status: number = 401
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Authentication Error',
      message,
      statusCode: status
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Создает ответ с ошибкой авторизации (недостаточно прав)
 */
export function createAuthorizationErrorResponse(
  message: string = 'Insufficient permissions',
  status: number = 403
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Authorization Error',
      message,
      statusCode: status
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Создает URL для редиректа на страницу логина
 */
export function createLoginRedirectUrl(
  baseUrl: string,
  currentPath: string,
  error?: string
): URL {
  const loginUrl = new URL('/login', baseUrl)
  
  // Добавляем текущий путь для редиректа после логина
  if (currentPath && currentPath !== '/') {
    loginUrl.searchParams.set('redirect', currentPath)
  }
  
  // Добавляем информацию об ошибке если есть
  if (error) {
    loginUrl.searchParams.set('error', error)
  }
  
  return loginUrl
}

/**
 * Извлекает информацию о пользователе из заголовков запроса
 */
export function getUserFromHeaders(request: NextRequest): UserSession | null {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  const telegramId = request.headers.get('x-telegram-id')
  
  if (!userId || !userRole || !telegramId) {
    return null
  }
  
  try {
    const partialUser = {
      telegram_first_name: request.headers.get('x-first-name') || null,
      telegram_last_name: request.headers.get('x-last-name') || null,
      telegram_username: request.headers.get('x-telegram-username') || null,
    };

    return {
      id: userId,
      telegram_id: parseInt(telegramId),
      ...partialUser,
      email: null, // Предполагаем null, если нет в заголовках
      company_name: null, // Предполагаем null
      created_at: request.headers.get('x-created-at') || new Date().toISOString(),
      updated_at: null, // Предполагаем null
      last_login_at: new Date().toISOString(), // Предполагаем сейчас
      role: userRole as UserRole,
      avatar_url: request.headers.get('x-avatar-url') ?? undefined,
      display_name: UserUtils.getDisplayName(partialUser),
    }
  } catch (error) {
    console.error('Error parsing user from headers:', error)
    return null
  }
}

/**
 * Проверяет является ли маршрут API маршрутом
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

/**
 * Проверяет является ли маршрут статическим ресурсом
 */
export function isStaticResource(pathname: string): boolean {
  const staticExtensions = [
    '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.css', '.js', '.map', '.woff', '.woff2', '.ttf', '.eot'
  ]
  
  return staticExtensions.some(ext => pathname.toLowerCase().endsWith(ext)) ||
         pathname.startsWith('/_next/') ||
         pathname.startsWith('/static/')
}

/**
 * Валидирует что пользователь имеет одну из требуемых ролей
 */
export function hasRequiredRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole)
}

/**
 * Валидирует права доступа к ресурсу
 */
export function validateResourceAccess(
  user: UserSession,
  resourceOwnerId: string,
  requiredPermission?: SystemPermission
): boolean {
  // Админы имеют доступ ко всему
  if (user.role === 'admin') {
    return true
  }
  
  // Пользователи имеют доступ только к своим ресурсам
  if (user.id === resourceOwnerId) {
    return true
  }
  
  return false
}

/**
 * Создает стандартный ответ API с информацией о пользователе
 */
export function createApiResponse<T>(
  data: T,
  user?: UserSession,
  status: number = 200
): NextResponse {
  const response = {
    success: true,
    data,
    user: user ? {
      id: user.id,
      role: user.role,
      telegram_id: user.telegram_id
    } : undefined
  }
  
  return new NextResponse(
    JSON.stringify(response),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Создает стандартный ответ API с ошибкой
 */
export function createApiErrorResponse(
  message: string,
  error: string = 'API Error',
  status: number = 400
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error,
      message,
      statusCode: status
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

/**
 * Извлекает токен из различных источников в запросе
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Проверяем Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Проверяем cookies
  const cookieToken = request.cookies.get('auth-token')?.value ||
                     request.cookies.get('access_token')?.value ||
                     request.cookies.get('sb-access-token')?.value
  
  if (cookieToken) {
    return cookieToken
  }
  
  // Проверяем query параметры (только для особых случаев)
  const urlToken = new URL(request.url).searchParams.get('token')
  if (urlToken) {
    return urlToken
  }
  
  return null
}

/**
 * Проверяет истек ли JWT токен
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Простая проверка без валидации подписи
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    
    if (!exp) {
      return true // Если нет exp, считаем токен истекшим
    }
    
    const now = Math.floor(Date.now() / 1000)
    return exp < now
    
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true // В случае ошибки считаем токен истекшим
  }
}

/**
 * Форматирует ошибку для логирования
 */
export function formatAuthError(
  error: unknown,
  context: string = 'Authentication'
): string {
  if (error instanceof Error) {
    return `${context} failed: ${error.message}`
  }
  return `${context} failed: An unknown error occurred.`
}

/**
 * Создает "безопасный" объект пользователя для отправки на клиент
 */
export function createSafeUser(user: UserSession): Partial<UserSession> {
  // Возвращаем только те поля, которые безопасно показывать на клиенте
  return {
    id: user.id,
    role: user.role,
    telegram_id: user.telegram_id,
    telegram_username: user.telegram_username,
    telegram_first_name: user.telegram_first_name,
    telegram_last_name: user.telegram_last_name,
    avatar_url: user.avatar_url,
    display_name: user.display_name,
  }
}

/**
 * Проверяет, является ли запрос preflight запросом (OPTIONS)
 */
export function isPreflightRequest(request: NextRequest): boolean {
  return request.method === 'OPTIONS'
}

/**
 * Создает CORS headers для ответа
 */
export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * Дебаунс функцию (полезно для rate limiting)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
} 