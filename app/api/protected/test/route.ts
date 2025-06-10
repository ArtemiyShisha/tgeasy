import { NextRequest, NextResponse } from 'next/server'
import { requireAuthInAPI, requireAdminInAPI } from '@/lib/auth/middleware'
import { createApiResponse, createApiErrorResponse, getUserFromHeaders } from '@/utils/auth-helpers'

/**
 * GET /api/protected/test
 * Тестовый endpoint для проверки аутентификации
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем пользователя из headers (установленных middleware)
    const user = getUserFromHeaders(request)
    
    if (!user) {
      return createApiErrorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    return createApiResponse({
      message: 'Authentication successful',
      timestamp: new Date().toISOString(),
      userInfo: {
        id: user.id,
        role: user.role,
        telegram_id: user.telegram_id,
        display_name: user.display_name
      }
    }, user)

  } catch (error) {
    console.error('Protected route error:', error)
    return createApiErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * POST /api/protected/test
 * Тестовый endpoint для проверки работы с данными
 */
export async function POST(request: NextRequest) {
  try {
    // Альтернативный способ - используем requireAuthInAPI
    const user = await requireAuthInAPI(request)
    
    const body = await request.json()
    
    return createApiResponse({
      message: 'Data processed successfully',
      receivedData: body,
      processedBy: {
        userId: user.id,
        role: user.role
      },
      timestamp: new Date().toISOString()
    }, user)

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return createApiErrorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    console.error('Protected POST route error:', error)
    return createApiErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
} 