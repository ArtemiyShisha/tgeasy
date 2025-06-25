import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/api-helpers';
import { applyRateLimit } from '@/utils/rate-limit';
import { PostService } from '@/lib/services/post-service';

/**
 * POST /api/posts/[id]/publish
 * Немедленная публикация поста
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate-limit как для UPDATE_POST
    const rateLimitResponse = await applyRateLimit(request, 'UPDATE_POST');
    if (rateLimitResponse) return rateLimitResponse;

    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const postService = new PostService();
    const publishedPost = await postService.publishPost(userId, params.id);

    return NextResponse.json({ success: true, data: publishedPost });
  } catch (error: any) {
    console.error(`POST /api/posts/${params.id}/publish error:`, error);

    if (error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }

    if (error.code === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message, field: error.field } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to publish post' } },
      { status: 500 }
    );
  }
} 