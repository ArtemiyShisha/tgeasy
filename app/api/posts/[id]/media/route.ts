import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post-service'
import { validatePostMedia } from '@/schemas/post-schema'
import { applyRateLimit } from '@/utils/rate-limit'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * POST /api/posts/[id]/media
 * Загрузка медиафайла к посту
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'UPLOAD_MEDIA')
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

    // Проверка Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType?.startsWith('multipart/form-data')) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_CONTENT_TYPE', 
            message: 'Content-Type must be multipart/form-data' 
          } 
        },
        { status: 400 }
      )
    }

    // Получение FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sortOrder = formData.get('sort_order') as string

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'FILE_REQUIRED', 
            message: 'File is required' 
          } 
        },
        { status: 400 }
      )
    }

    // Подготовка данных для валидации
    const mediaData = {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      sort_order: sortOrder ? parseInt(sortOrder) : 0
    }

    // Валидация медиафайла
    const validatedData = validatePostMedia(mediaData)

    // TODO: Загрузка файла в Supabase Storage
    // Пока что создаем заглушку URL
    const fileUrl = `https://example.com/uploads/${userId}/${postId}/${file.name}`

    // Добавление медиафайла к посту
    const media = await postService.uploadMedia(userId, postId, {
      file_url: fileUrl,
      file_name: validatedData.file_name,
      file_size: validatedData.file_size,
      mime_type: validatedData.file_type,
      sort_order: validatedData.sort_order
    })

    return NextResponse.json({
      success: true,
      data: media
    }, { status: 201 })

  } catch (error: any) {
    console.error(`POST /api/posts/${params.id}/media error:`, error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid media file',
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
          message: 'Failed to upload media' 
        } 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/posts/[id]/media
 * Удаление медиафайла
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка rate limit
    const rateLimitResponse = await applyRateLimit(request, 'UPLOAD_MEDIA')
    if (rateLimitResponse) return rateLimitResponse

    // Получение user ID
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const postService = new PostService()

    // Получение media_id из query параметров
    const url = new URL(request.url)
    const mediaId = url.searchParams.get('media_id')

    if (!mediaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'MEDIA_ID_REQUIRED', 
            message: 'media_id query parameter is required' 
          } 
        },
        { status: 400 }
      )
    }

    // Удаление медиафайла
    await postService.removeMedia(userId, mediaId)

    return NextResponse.json({
      success: true,
      message: 'Media removed successfully'
    })

  } catch (error: any) {
    console.error(`DELETE /api/posts/${params.id}/media error:`, error)
    
    if (error.code === 'MEDIA_NOT_FOUND' || error.code === 'MEDIA_ACCESS_DENIED') {
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

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to remove media' 
        } 
      },
      { status: 500 }
    )
  }
} 