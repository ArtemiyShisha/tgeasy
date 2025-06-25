import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { validateUpdatePost } from '@/schemas/post-schema'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * GET /api/posts/[id]
 * Получение поста по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'GENERAL')
    if (rateLimitResponse) return rateLimitResponse

    // Получение user ID
    const userId = await getUserIdFromRequest(request)

    const postId = params.id

    // Проверка параметра include_relations
    const url = new URL(request.url)
    const includeRelations = url.searchParams.get('include_relations') === 'true'

    // Получение поста
    const postService = new PostService()
    const post = includeRelations 
      ? await postService.getPostWithRelations(userId as any, postId)
      : await postService.getPost(userId as any, postId)

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: post
    })

  } catch (error: any) {
    console.error(`GET /api/posts/${params.id} error:`, error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error.message || 'Failed to get post' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/posts/[id]
 * Обновление поста
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

    // Получение и валидация данных
    const body = await request.json()
    const validatedData = validateUpdatePost(body)

    // Обновление поста
    const postService = new PostService()
    const updatedPost = await postService.updatePost(userId, postId, validatedData)

    return NextResponse.json({
      success: true,
      data: updatedPost
    })

  } catch (error: any) {
    console.error(`PUT /api/posts/${params.id} error:`, error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid post data',
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

    if (error.code === 'ACCESS_DENIED' || error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message,
            field: error.field
          } 
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update post' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/posts/[id]
 * Удаление поста
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'DELETE_POST')
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

    // Удаление поста
    const postService = new PostService()
    await postService.deletePost(userId, postId)

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error: any) {
    console.error(`DELETE /api/posts/${params.id} error:`, error)
    
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

    if (error.code === 'DELETE_FORBIDDEN') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: error.code, 
            message: error.message 
          } 
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete post' 
        } 
      },
      { status: 500 }
    )
  }
} 