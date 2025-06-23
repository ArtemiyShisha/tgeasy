// API клиент для рекламных размещений (Posts)
import { 
  Post, 
  PostWithRelations, 
  PostMedia,
  CreatePostInput,
  UpdatePostInput,
  PostFilters,
  PostsResult
} from '@/types/post'
import {
  PostsApiResponse,
  PostApiResponse,
  PostStatsResponse,
  CreatePostData,
  UpdatePostData,
  MediaUploadResponse,
  MediaUploadProgress,
  MediaUploadOptions,
  SchedulePostData,
  PostPreview,
  PreviewOptions,
  PostsApiError,
  PostSearchOptions,
  POST_UI_CONSTANTS
} from '@/types/post-ui'

// =============================================================================
// БАЗОВЫЕ УТИЛИТЫ
// =============================================================================

/**
 * Базовая функция для выполнения HTTP запросов с обработкой ошибок
 */
async function fetchJson<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new PostsApiError(
        data.error?.message || `HTTP ${response.status}`,
        data.error?.code || 'HTTP_ERROR',
        response.status,
        data.error?.field,
        data.error?.details
      )
    }

    return data
  } catch (error) {
    if (error instanceof PostsApiError) {
      throw error
    }
    
    // Сетевые ошибки
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new PostsApiError(
        'Ошибка сети. Проверьте подключение к интернету.',
        'NETWORK_ERROR'
      )
    }
    
    throw new PostsApiError(
      `Неожиданная ошибка: ${error}`,
      'UNKNOWN_ERROR'
    )
  }
}

/**
 * Создание URL с query параметрами
 */
function buildUrl(baseUrl: string, params?: Record<string, any>): string {
  if (!params) return baseUrl
  
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Преобразование фильтров в query параметры
 */
function filtersToQueryParams(filters: PostSearchOptions): Record<string, any> {
  const params: Record<string, any> = {}
  
  if (filters.status?.length) {
    params.status = filters.status
  }
  if (filters.channel_id) {
    params.channel_id = filters.channel_id
  }
  if (filters.contract_id) {
    params.contract_id = filters.contract_id
  }
  if (filters.ord_status?.length) {
    params.ord_status = filters.ord_status
  }
  if (filters.date_from) {
    params.date_from = filters.date_from
  }
  if (filters.date_to) {
    params.date_to = filters.date_to
  }
  if (filters.search) {
    params.search = filters.search
  }
  if (filters.sort_by) {
    params.sort_by = filters.sort_by
  }
  if (filters.sort_order) {
    params.sort_order = filters.sort_order
  }
  if (filters.limit) {
    params.limit = filters.limit
  }
  if (filters.offset) {
    params.offset = filters.offset
  }
  if (filters.cursor) {
    params.cursor = filters.cursor
  }
  if (filters.include_analytics) {
    params.include_analytics = filters.include_analytics
  }
  if (filters.include_media) {
    params.include_media = filters.include_media
  }
  
  return params
}

// =============================================================================
// ОСНОВНОЙ API КЛИЕНТ
// =============================================================================

export const postsApi = {
  // ---------------------------------------------------------------------------
  // CRUD ОПЕРАЦИИ
  // ---------------------------------------------------------------------------

  /**
   * Получение списка постов с фильтрацией и пагинацией
   */
  async getPosts(options: PostSearchOptions = {}): Promise<PostsResult> {
    const params = filtersToQueryParams(options)
    const url = buildUrl('/api/posts', params)
    
    const response = await fetchJson<PostsApiResponse>(url)
    return response.data
  },

  /**
   * Получение поста по ID
   */
  async getPost(id: string, includeRelations = false): Promise<Post | PostWithRelations> {
    const params = includeRelations ? { include_relations: true } : {}
    const url = buildUrl(`/api/posts/${id}`, params)
    
    const response = await fetchJson<PostApiResponse>(url)
    return response.data
  },

  /**
   * Создание нового поста
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await fetchJson<PostApiResponse>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data as Post
  },

  /**
   * Обновление поста
   */
  async updatePost(id: string, data: UpdatePostData): Promise<Post> {
    const response = await fetchJson<PostApiResponse>(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.data as Post
  },

  /**
   * Удаление поста
   */
  async deletePost(id: string): Promise<void> {
    await fetchJson(`/api/posts/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Дублирование поста
   */
  async duplicatePost(id: string): Promise<Post> {
    const response = await fetchJson<PostApiResponse>(`/api/posts/${id}/duplicate`, {
      method: 'POST',
    })
    return response.data as Post
  },

  // ---------------------------------------------------------------------------
  // МЕДИАФАЙЛЫ
  // ---------------------------------------------------------------------------

  /**
   * Загрузка медиафайлов к посту
   */
  async uploadMedia(
    postId: string, 
    files: File[], 
    options: MediaUploadOptions = {}
  ): Promise<PostMedia[]> {
    const formData = new FormData()
    
    files.forEach((file, index) => {
      formData.append('files', file)
      if (options.maxFiles && index >= options.maxFiles) return
    })

    // Проверка размеров файлов
    if (options.maxSize) {
      for (const file of files) {
        if (file.size > options.maxSize) {
          throw new PostsApiError(
            `Файл "${file.name}" превышает максимальный размер ${Math.round(options.maxSize / 1024 / 1024)}MB`,
            'FILE_TOO_LARGE',
            400,
            'files'
          )
        }
      }
    }

    // Проверка типов файлов
    if (options.allowedTypes) {
      for (const file of files) {
        if (!options.allowedTypes.includes(file.type)) {
          throw new PostsApiError(
            `Неподдерживаемый тип файла: ${file.type}`,
            'UNSUPPORTED_FILE_TYPE',
            400,
            'files'
          )
        }
      }
    }

    try {
      const response = await fetch(`/api/posts/${postId}/media`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new PostsApiError(
          data.error?.message || 'Ошибка загрузки файлов',
          data.error?.code || 'UPLOAD_ERROR',
          response.status,
          data.error?.field
        )
      }

      return data.data
    } catch (error) {
      if (error instanceof PostsApiError) {
        throw error
      }
      throw new PostsApiError(
        `Ошибка загрузки медиафайлов: ${error}`,
        'UPLOAD_ERROR'
      )
    }
  },

  /**
   * Удаление медиафайла
   */
  async removeMedia(postId: string, mediaId: string): Promise<void> {
    await fetchJson(`/api/posts/${postId}/media/${mediaId}`, {
      method: 'DELETE',
    })
  },

  // ---------------------------------------------------------------------------
  // ПЛАНИРОВАНИЕ
  // ---------------------------------------------------------------------------

  /**
   * Планирование поста
   */
  async schedulePost(id: string, scheduledAt: Date): Promise<Post> {
    const data: SchedulePostData = {
      scheduled_at: scheduledAt.toISOString()
    }
    
    const response = await fetchJson<PostApiResponse>(`/api/posts/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data as Post
  },

  /**
   * Отмена планирования поста
   */
  async unschedulePost(id: string): Promise<Post> {
    const response = await fetchJson<PostApiResponse>(`/api/posts/${id}/schedule`, {
      method: 'DELETE',
    })
    return response.data as Post
  },

  /**
   * Перепланирование поста
   */
  async reschedulePost(id: string, newScheduledAt: Date): Promise<Post> {
    return this.schedulePost(id, newScheduledAt)
  },

  // ---------------------------------------------------------------------------
  // ПУБЛИКАЦИЯ
  // ---------------------------------------------------------------------------

  /**
   * Немедленная публикация поста
   */
  async publishPost(id: string): Promise<Post> {
    const response = await fetchJson<PostApiResponse>(`/api/posts/${id}/publish`, {
      method: 'POST',
    })
    return response.data as Post
  },

  // ---------------------------------------------------------------------------
  // ПРЕВЬЮ И ВАЛИДАЦИЯ
  // ---------------------------------------------------------------------------

  /**
   * Генерация превью поста
   */
  async generatePreview(
    postIdOrData: string | Partial<CreatePostData>, 
    options: PreviewOptions = {}
  ): Promise<PostPreview> {
    let url = '/api/posts/preview'
    let method = 'POST'
    let body: any = options

    if (typeof postIdOrData === 'string') {
      // Превью существующего поста
      url = `/api/posts/${postIdOrData}/preview`
      method = 'GET'
      body = undefined
    } else {
      // Превью черновика
      body = { ...postIdOrData, ...options }
    }

    const config: RequestInit = { method }
    if (body) {
      config.body = JSON.stringify(body)
    }

    const response = await fetchJson<{ success: boolean; data: PostPreview }>(url, config)
    return response.data
  },

  // ---------------------------------------------------------------------------
  // ПОИСК И СТАТИСТИКА
  // ---------------------------------------------------------------------------

  /**
   * Поиск постов
   */
  async searchPosts(query: string, options: PostSearchOptions = {}): Promise<PostsResult> {
    const searchOptions: PostSearchOptions = {
      ...options,
      search: query,
      limit: options.limit || POST_UI_CONSTANTS.DEFAULT_PAGE_SIZE
    }
    
    return this.getPosts(searchOptions)
  },

  /**
   * Получение статистики постов
   */
  async getPostsStats(): Promise<PostStatsResponse['data']> {
    const response = await fetchJson<PostStatsResponse>('/api/posts/stats')
    return response.data
  },

  /**
   * Получение постов по каналу
   */
  async getPostsByChannel(channelId: string, options: PostSearchOptions = {}): Promise<PostsResult> {
    const searchOptions: PostSearchOptions = {
      ...options,
      channel_id: channelId
    }
    
    return this.getPosts(searchOptions)
  },

  /**
   * Получение постов по договору
   */
  async getPostsByContract(contractId: string, options: PostSearchOptions = {}): Promise<PostsResult> {
    const searchOptions: PostSearchOptions = {
      ...options,
      contract_id: contractId
    }
    
    return this.getPosts(searchOptions)
  },

  /**
   * Получение запланированных постов
   */
  async getScheduledPosts(options: PostSearchOptions = {}): Promise<PostsResult> {
    const searchOptions: PostSearchOptions = {
      ...options,
      status: ['scheduled']
    }
    
    return this.getPosts(searchOptions)
  },

  /**
   * Получение постов по статусу ОРД
   */
  async getPostsByOrdStatus(
    ordStatus: 'pending' | 'registered' | 'failed', 
    options: PostSearchOptions = {}
  ): Promise<PostsResult> {
    const searchOptions: PostSearchOptions = {
      ...options,
      ord_status: [ordStatus]
    }
    
    return this.getPosts(searchOptions)
  },

  // ---------------------------------------------------------------------------
  // ПЛАНИРОВЩИК
  // ---------------------------------------------------------------------------

  /**
   * Получение статистики планировщика
   */
  async getSchedulerStats(channelId?: string): Promise<{
    scheduled: number
    readyToPublish: number
    nextScheduledDate: string | null
  }> {
    const params = channelId ? { channel_id: channelId } : {}
    const url = buildUrl('/api/posts/scheduler/stats', params)
    
    const response = await fetchJson<{ success: boolean; data: any }>(url)
    return response.data
  },

  /**
   * Получение доступных слотов для планирования
   */
  async getAvailableSlots(options: {
    channel_id?: string
    date_from?: string
    date_to?: string
    interval_minutes?: number
  } = {}): Promise<Array<{
    datetime: string
    available: boolean
    conflictingPosts?: string[]
  }>> {
    const url = buildUrl('/api/posts/scheduler/slots', options)
    
    const response = await fetchJson<{ success: boolean; data: any }>(url)
    return response.data
  },
}

// =============================================================================
// ЭКСПОРТ
// =============================================================================

export { PostsApiError }

// Типы для удобства
export type PostsApiClient = typeof postsApi 