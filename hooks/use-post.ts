// Hook для работы с единичным рекламным размещением
import { useCallback, useState, useEffect } from 'react'
import { Post, PostWithRelations, PostMedia } from '@/types/post'
import { 
  UsePostOptions, 
  UsePostReturn, 
  UpdatePostData,
  MediaUploadOptions,
  PreviewOptions,
  PostPreview,
  PostsApiError
} from '@/types/post-ui'
import { postsApi } from '@/lib/api/posts-api'

// =============================================================================
// УТИЛИТЫ
// =============================================================================

/**
 * Получение сообщения об ошибке
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof PostsApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Неизвестная ошибка'
}

// =============================================================================
// ОСНОВНОЙ ХУК
// =============================================================================

export function usePost(options: UsePostOptions): UsePostReturn {
  const {
    postId,
    include = {},
    enabled = true
  } = options

  // Состояние
  const [post, setPost] = useState<Post | PostWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Очистка ошибки при изменении данных
  useEffect(() => {
    if (post && error) {
      setError(null)
    }
  }, [post, error])

  // =============================================================================
  // ЗАГРУЗКА ДАННЫХ
  // =============================================================================

  /**
   * Загрузка поста
   */
  const fetchPost = useCallback(async () => {
    if (!enabled || !postId) return

    try {
      setError(null)
      setIsLoading(true)

      console.log('🔍 Fetching post:', postId, 'with relations:', include.relations)
      const result = await postsApi.getPost(postId, include.relations || false)
      console.log('📦 Post API response:', result)
      
      setPost(result)
      
    } catch (err) {
      console.error('Failed to fetch post:', err)
      setError(new Error(getErrorMessage(err)))
    } finally {
      setIsLoading(false)
    }
  }, [enabled, postId, include.relations])

  // Начальная загрузка
  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  // =============================================================================
  // МУТАЦИИ
  // =============================================================================

  /**
   * Обновление поста с optimistic update
   */
  const update = useCallback(async (updateData: UpdatePostData): Promise<Post> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      // Optimistic update
      const optimisticPost = { 
        ...post, 
        ...updateData, 
        updated_at: new Date().toISOString() 
      }
      setPost(optimisticPost as Post)

      // Выполняем реальный запрос
      const updatedPost = await postsApi.updatePost(postId, updateData)

      // Обновляем с реальными данными
      setPost(updatedPost)

      return updatedPost
    } catch (error) {
      // Rollback
      await fetchPost()
      throw error
    }
  }, [post, postId, fetchPost])

  /**
   * Удаление поста
   */
  const deletePost = useCallback(async (): Promise<void> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      await postsApi.deletePost(postId)
      setPost(null)
    } catch (error) {
      throw error
    }
  }, [post, postId])

  /**
   * Дублирование поста
   */
  const duplicate = useCallback(async (): Promise<Post> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      const duplicatedPost = await postsApi.duplicatePost(postId)
      return duplicatedPost
    } catch (error) {
      throw error
    }
  }, [post, postId])

  // =============================================================================
  // СПЕЦИАЛЬНЫЕ ОПЕРАЦИИ
  // =============================================================================

  /**
   * Планирование поста
   */
  const schedule = useCallback(async (scheduledAt: Date): Promise<Post> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      // Optimistic update
      const optimisticPost = { 
        ...post, 
        status: 'scheduled' as const,
        scheduled_at: scheduledAt.toISOString(),
        updated_at: new Date().toISOString() 
      }
      setPost(optimisticPost as Post)

      // Выполняем реальный запрос
      const scheduledPost = await postsApi.schedulePost(postId, scheduledAt)

      // Обновляем с реальными данными
      setPost(scheduledPost)

      return scheduledPost
    } catch (error) {
      // Rollback
      await fetchPost()
      throw error
    }
  }, [post, postId, fetchPost])

  /**
   * Отмена планирования поста
   */
  const unschedule = useCallback(async (): Promise<Post> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      // Optimistic update
      const optimisticPost = { 
        ...post, 
        status: 'draft' as const,
        scheduled_at: null,
        updated_at: new Date().toISOString() 
      }
      setPost(optimisticPost as Post)

      // Выполняем реальный запрос
      const unscheduledPost = await postsApi.unschedulePost(postId)

      // Обновляем с реальными данными
      setPost(unscheduledPost)

      return unscheduledPost
    } catch (error) {
      // Rollback
      await fetchPost()
      throw error
    }
  }, [post, postId, fetchPost])

  /**
   * Публикация поста
   */
  const publish = useCallback(async (): Promise<Post> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      // Optimistic update
      const optimisticPost = { 
        ...post, 
        status: 'published' as const,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      }
      setPost(optimisticPost as Post)

      // Выполняем реальный запрос
      const publishedPost = await postsApi.publishPost(postId)

      // Обновляем с реальными данными
      setPost(publishedPost)

      return publishedPost
    } catch (error) {
      // Rollback
      await fetchPost()
      throw error
    }
  }, [post, postId, fetchPost])

  // =============================================================================
  // МЕДИАФАЙЛЫ
  // =============================================================================

  /**
   * Загрузка медиафайлов
   */
  const uploadMedia = useCallback(async (
    files: File[], 
    options: MediaUploadOptions = {}
  ): Promise<PostMedia[]> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      const uploadedMedia = await postsApi.uploadMedia(postId, files, options)

      // Обновляем пост с новыми медиафайлами (если это PostWithRelations)
      if ('media' in post && Array.isArray(post.media)) {
        const updatedPost = {
          ...post,
          media: [...(post.media || []), ...uploadedMedia]
        }
        setPost(updatedPost)
      }

      return uploadedMedia
    } catch (error) {
      throw error
    }
  }, [post, postId])

  /**
   * Удаление медиафайла
   */
  const removeMedia = useCallback(async (mediaId: string): Promise<void> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      await postsApi.removeMedia(postId, mediaId)

      // Обновляем пост, убирая удаленный медиафайл (если это PostWithRelations)
      if ('media' in post && Array.isArray(post.media)) {
        const updatedPost = {
          ...post,
          media: post.media.filter(media => media.id !== mediaId)
        }
        setPost(updatedPost)
      }
    } catch (error) {
      throw error
    }
  }, [post, postId])

  // =============================================================================
  // ПРЕВЬЮ
  // =============================================================================

  /**
   * Генерация превью поста
   */
  const generatePreview = useCallback(async (
    options: PreviewOptions = {}
  ): Promise<PostPreview> => {
    if (!post) {
      throw new Error('Post not loaded')
    }

    try {
      return await postsApi.generatePreview(postId, options)
    } catch (error) {
      throw error
    }
  }, [post, postId])

  // =============================================================================
  // ОБНОВЛЕНИЕ
  // =============================================================================

  /**
   * Обновление данных
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchPost()
  }, [fetchPost])

  // =============================================================================
  // ВОЗВРАЩАЕМОЕ ЗНАЧЕНИЕ
  // =============================================================================

  const result: UsePostReturn = {
    // Данные
    post,
    isLoading,
    error,

    // Мутации
    update,
    delete: deletePost,
    duplicate,

    // Специальные операции
    schedule,
    unschedule,
    publish,

    // Медиа
    uploadMedia,
    removeMedia,

    // Превью
    generatePreview,

    // Обновление
    refresh
  }

  return result
}

// =============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ХУКИ
// =============================================================================

/**
 * Hook для поста с автоматической загрузкой связанных данных
 */
export function usePostWithRelations(postId: string, enabled = true): UsePostReturn {
  return usePost({
    postId,
    include: {
      relations: true,
      analytics: true,
      media: true
    },
    enabled
  })
}

/**
 * Hook для поста только с основными данными
 */
export function usePostBasic(postId: string, enabled = true): UsePostReturn {
  return usePost({
    postId,
    include: {
      relations: false
    },
    enabled
  })
} 