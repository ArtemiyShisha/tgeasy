import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { validateSchedulePost } from '@/schemas/post-schema'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * POST /api/posts/[id]/schedule
 * Планирование публикации поста
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'UPDATE_POST')
    if (rateLimitResponse) return rateLimitResponse

    // Получение user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const postId = params.id
    const postService = new PostService()

    // Получение и валидация данных
    const body = await request.json()
    const validatedData = validateSchedulePost(body)

    // Планирование поста
    const scheduledPost = await postService.schedulePost(
      userId, 
      postId, 
      new Date(validatedData.scheduled_at)
    )

    return NextResponse.json({
      success: true,
      data: scheduledPost,
      message: 'Post scheduled successfully'
    })

  } catch (error: any) {
    console.error(`POST /api/posts/${params.id}/schedule error:`, error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid schedule data',
            details: error.errors
          } 
        },
        { status: 400 }
      )
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: 404 }
      )
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message,
            field: error.field
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to schedule post' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/posts/[id]/schedule
 * Перепланирование поста
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'UPDATE_POST')
    if (rateLimitResponse) return rateLimitResponse

    // Получение user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const postId = params.id
    const postService = new PostService()

    // Получение и валидация данных
    const body = await request.json()
    const validatedData = validateSchedulePost(body)

    // Перепланирование поста
    const rescheduledPost = await postService.reschedulePost(
      userId, 
      postId, 
      new Date(validatedData.scheduled_at)
    )

    return NextResponse.json({
      success: true,
      data: rescheduledPost,
      message: 'Post rescheduled successfully'
    })

  } catch (error: any) {
    console.error(`PUT /api/posts/${params.id}/schedule error:`, error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid schedule data',
            details: error.errors
          } 
        },
        { status: 400 }
      )
    }

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: 404 }
      )
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to reschedule post' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/posts/[id]/schedule
 * Отмена планирования поста
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'UPDATE_POST')
    if (rateLimitResponse) return rateLimitResponse

    // Получение user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const postId = params.id
    const postService = new PostService()

    // Отмена планирования
    const unscheduledPost = await postService.unschedulePost(userId, postId)

    return NextResponse.json({
      success: true,
      data: unscheduledPost,
      message: 'Post unscheduled successfully'
    })

  } catch (error: any) {
    console.error(`DELETE /api/posts/${params.id}/schedule error:`, error)
    
    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: 404 }
      )
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message,
            field: error.field
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to unschedule post' 
        } 
      },
      { status: 500 }
    )
  }
} 