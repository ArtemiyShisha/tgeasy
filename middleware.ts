import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Публичные маршруты которые не требуют аутентификации
const publicRoutes = [
  '/',
  '/login',
  '/auth/complete',
  '/api/auth/telegram',
  '/api/auth/callback',
  '/api/auth/check',
  '/api/auth/refresh',
  '/favicon.ico',
  '/_next',
  '/static'
]

// Маршруты для публичной аналитики
const publicStatsRoutes = [
  '/public-stats'
]

// Защищенные маршруты которые требуют аутентификации
const protectedRoutes = [
  '/dashboard',
  '/api/protected'
]

// Админ маршруты которые требуют роль admin
const adminRoutes = [
  '/admin',
  '/api/admin'
]

/**
 * Проверяет является ли маршрут публичным
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
}

/**
 * Проверяет является ли маршрут публичной аналитикой
 */
function isPublicStatsRoute(pathname: string): boolean {
  return publicStatsRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Проверяет является ли маршрут защищенным
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Проверяет является ли маршрут админским
 */
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => 
    pathname.startsWith(route)
  )
}

/**
 * Простая проверка аутентификации через cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  const userId = request.cookies.get('user_id')?.value
  const telegramId = request.cookies.get('telegram_id')?.value
  
  return !!(userId && telegramId)
}

/**
 * Главный middleware Next.js
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Пропускаем статические файлы и API маршруты Next.js
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Пропускаем публичные маршруты
  if (isPublicRoute(pathname) || isPublicStatsRoute(pathname)) {
    return NextResponse.next()
  }

  // Для защищенных маршрутов проверяем cookies
  const userIdCookie = request.cookies.get('user_id')
  const telegramIdCookie = request.cookies.get('telegram_id')

  if (!userIdCookie?.value || !telegramIdCookie?.value) {
    // Редирект на login с возвратом на исходную страницу
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

/**
 * Конфигурация маршрутов для middleware
 */
export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем маршрутам кроме:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 