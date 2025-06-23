import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { TestPostService } from '@/lib/services/test-post-service'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'
import { getTestUserIdFromRequest, isTestRequest } from '@/lib/auth/test-helpers'

/**
 * GET /api/posts/search
 * Поиск постов по запросу
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

    // Получение параметров поиска
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const limitParam = url.searchParams.get('limit')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'QUERY_REQUIRED', 
            message: 'Search query parameter "q" is required' 
          } 
        },
        { status: 400 }
      )
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'QUERY_TOO_SHORT', 
            message: 'Search query must be at least 2 characters long' 
          } 
        },
        { status: 400 }
      )
    }

    const limit = limitParam ? Math.min(parseInt(limitParam), 50) : 20

    // Выполнение поиска
    const postService = isTestRequest(request) ? new TestPostService() : new PostService()
    const posts = await postService.searchPosts(userId, query.trim(), limit)

    return NextResponse.json({
      success: true,
      data: {
        posts,
        query: query.trim(),
        total: posts.length,
        limit
      }
    })

  } catch (error: any) {
    console.error('GET /api/posts/search error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to search posts' 
        } 
      },
      { status: 500 }
    )
  }
} 