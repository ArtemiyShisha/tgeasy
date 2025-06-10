import { NextRequest } from 'next/server'
import { requireAdminInAPI } from '@/lib/auth/middleware'
import { createApiResponse, createApiErrorResponse } from '@/utils/auth-helpers'

/**
 * GET /api/admin/test
 * Тестовый админский endpoint
 * Требует роль admin
 */
export async function GET(request: NextRequest) {
  try {
    // Проверяем админские права
    const admin = await requireAdminInAPI(request)
    
    return createApiResponse({
      message: 'Admin access granted',
      timestamp: new Date().toISOString(),
      adminInfo: {
        id: admin.id,
        role: admin.role,
        telegram_id: admin.telegram_id,
        display_name: admin.display_name
      },
      systemInfo: {
        totalUsers: 10, // Mock data
        totalChannels: 25,
        totalPosts: 150
      }
    }, admin)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return createApiErrorResponse(
          'Authentication required',
          'UNAUTHORIZED',
          401
        )
      }
      
      if (error.message === 'Admin privileges required') {
        return createApiErrorResponse(
          'Admin privileges required',
          'FORBIDDEN', 
          403
        )
      }
    }

    console.error('Admin route error:', error)
    return createApiErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
}

/**
 * POST /api/admin/test
 * Тестовый админский endpoint для изменения данных
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminInAPI(request)
    const body = await request.json()
    
    // Здесь могла бы быть логика управления системой
    console.log(`Admin ${admin.id} performed action:`, body)
    
    return createApiResponse({
      message: 'Admin action completed',
      action: body.action || 'unknown',
      performedBy: {
        id: admin.id,
        role: admin.role,
        display_name: admin.display_name
      },
      timestamp: new Date().toISOString()
    }, admin)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return createApiErrorResponse(
          'Authentication required',
          'UNAUTHORIZED',
          401
        )
      }
      
      if (error.message === 'Admin privileges required') {
        return createApiErrorResponse(
          'Admin privileges required',
          'FORBIDDEN',
          403
        )
      }
    }

    console.error('Admin POST route error:', error)
    return createApiErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    )
  }
} 