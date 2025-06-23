import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { TestPostService } from '@/lib/services/test-post-service'
import { validateCreatePost, validatePostFilters } from '@/schemas/post-schema'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'
import { getTestUserIdFromRequest, isTestRequest } from '@/lib/auth/test-helpers'

/**
 * GET /api/posts
 * Получение списка постов пользователя с фильтрацией и пагинацией
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка rate limit (пропускаем для тестовых запросов)
    if (!isTestRequest(request)) {
      const rateLimitResponse = await applyRateLimit(request, 'GENERAL')
      if (rateLimitResponse) return rateLimitResponse
    }

    // Получение user ID
    const userId = isTestRequest(request) 
      ? await getTestUserIdFromRequest(request)
      : await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Получение параметров из URL
    const url = new URL(request.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    
    // Преобразование строковых параметров в нужные типы
    const filters = {
      ...searchParams,
      limit: searchParams.limit ? parseInt(searchParams.limit) : undefined,
      offset: searchParams.offset ? parseInt(searchParams.offset) : undefined
    }

    // Валидация фильтров
    const validatedFilters = validatePostFilters(filters)

    // Получение постов
    const postService = isTestRequest(request) ? new TestPostService() : new PostService()
    const result = await postService.getPosts(userId, validatedFilters)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('GET /api/posts error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid filter parameters',
            details: error.errors
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
          message: 'Failed to get posts' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/posts
 * Создание нового поста
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка rate limit (пропускаем для тестовых запросов)
    if (!isTestRequest(request)) {
      const rateLimitResponse = await applyRateLimit(request, 'CREATE_POST')
      if (rateLimitResponse) return rateLimitResponse
    }

    // Получение user ID
    const userId = isTestRequest(request) 
      ? await getTestUserIdFromRequest(request)
      : await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Получение и валидация данных
    const body = await request.json()
    const validatedData = validateCreatePost(body)

    // Создание поста
    const postService = isTestRequest(request) ? new TestPostService() : new PostService()
    const result = await postService.createPost(userId, validatedData)

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })

  } catch (error: any) {
    console.error('POST /api/posts error:', error)
    
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

    if (error.code === 'ACCESS_DENIED') {
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

    if (error.code === 'CREATE_FAILED') {
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
          message: 'Failed to create post' 
        } 
      },
      { status: 500 }
    )
  }
} 