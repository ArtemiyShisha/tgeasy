import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { TestPostService } from '@/lib/services/test-post-service'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'
import { getTestUserIdFromRequest, isTestRequest } from '@/lib/auth/test-helpers'

/**
 * GET /api/posts/stats
 * Получение статистики постов пользователя
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

    // Получение общей статистики постов
    const postService = isTestRequest(request) ? new TestPostService() : new PostService()
    const postsStats = await postService.getPostsStats(userId)
    
    // Получение статистики планировщика
    const schedulerStats = await postService.getSchedulerStats(userId)

    // Объединенная статистика
    const stats = {
      posts: postsStats,
      scheduler: schedulerStats,
      summary: {
        total_posts: postsStats.total,
        active_posts: postsStats.published + postsStats.scheduled,
        pending_ord: postsStats.ord_pending,
        next_publication: schedulerStats.nextScheduledDate
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('GET /api/posts/stats error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to get posts statistics' 
        } 
      },
      { status: 500 }
    )
  }
} 