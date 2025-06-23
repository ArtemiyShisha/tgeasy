// Hook для управления списком рекламных размещений
import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { Post, PostsResult } from '@/types/post'
import { 
  UsePostsOptions, 
  UsePostsReturn, 
  PostFilters, 
  CreatePostData, 
  UpdatePostData,
  PostSearchOptions,
  POST_UI_CONSTANTS,
  PostsApiError
} from '@/types/post-ui'
import { postsApi } from '@/lib/api/posts-api'

// =============================================================================
// УТИЛИТЫ
// =============================================================================

/**
 * Проверка, что мы в браузере
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Сохранение фильтров в localStorage
 */
function saveFiltersToStorage(filters: PostFilters): void {
  if (!isBrowser()) return
  
  try {
    localStorage.setItem(
      POST_UI_CONSTANTS.FILTER_STORAGE_KEY, 
      JSON.stringify(filters)
    )
  } catch (error) {
    console.warn('Failed to save filters to localStorage:', error)
  }
}

/**
 * Загрузка фильтров из localStorage
 */
function loadFiltersFromStorage(): PostFilters {
  if (!isBrowser()) return {}
  
  try {
    const stored = localStorage.getItem(POST_UI_CONSTANTS.FILTER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to load filters from localStorage:', error)
    return {}
  }
}

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

/**
 * Custom debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// =============================================================================
// ОСНОВНОЙ ХУК
// =============================================================================

const defaultFilters: PostFilters = {
  sort_by: 'created_at',
  sort_order: 'desc'
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const {
    filters: initialFilters = defaultFilters,
    pagination: initialPagination = { 
      limit: POST_UI_CONSTANTS.DEFAULT_PAGE_SIZE, 
      offset: 0 
    },
    autoRefresh = false,
    refreshInterval = POST_UI_CONSTANTS.DEFAULT_REFRESH_INTERVAL,
    enabled = true
  } = options

  // Состояние
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [stats, setStats] = useState<UsePostsReturn['stats']>(null)

  // Фильтры и пагинация
  const [filters, setFiltersState] = useState<PostFilters>(() => ({
    ...loadFiltersFromStorage(),
    ...initialFilters
  }))
  const [pagination, setPagination] = useState({
    limit: initialPagination.limit || POST_UI_CONSTANTS.DEFAULT_PAGE_SIZE,
    offset: initialPagination.offset || 0
  })
  
  // Debounced поиск
  const debouncedSearch = useDebounce(
    filters.search || '', 
    POST_UI_CONSTANTS.SEARCH_DEBOUNCE_MS
  )
  
  // Создаем финальные фильтры с debounced поиском
  const finalFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch
  }), [filters, debouncedSearch])

  // Ref для отслеживания optimistic updates
  const optimisticUpdatesRef = useRef<Map<string, Post>>(new Map())

  // Очистка ошибки при изменении данных
  useEffect(() => {
    if (posts.length > 0 && error) {
      setError(null)
    }
  }, [posts.length, error])

  // =============================================================================
  // ЗАГРУЗКА ДАННЫХ
  // =============================================================================

  /**
   * Загрузка постов
   */
  const fetchPosts = useCallback(async (resetData = false) => {
    if (!enabled) return

    try {
      setError(null)
      if (resetData) {
        setIsLoading(true)
      } else {
        setIsValidating(true)
      }

      const searchOptions: PostSearchOptions = { 
        ...finalFilters, 
        ...pagination 
      }
      
      console.log('🔍 Fetching posts with options:', searchOptions)
      const result = await postsApi.getPosts(searchOptions)
      console.log('📦 Posts API response:', result)
      
      if (resetData || pagination.offset === 0) {
        setPosts(result.posts)
      } else {
        // Для пагинации добавляем к существующим
        setPosts(prev => [...prev, ...result.posts])
      }
      
      setTotal(result.total)
      setHasMore(result.hasMore)
      
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      setError(new Error(getErrorMessage(err)))
    } finally {
      setIsLoading(false)
      setIsValidating(false)
    }
  }, [enabled, finalFilters, pagination])

  /**
   * Загрузка статистики
   */
  const fetchStats = useCallback(async () => {
    if (!enabled) return

    try {
      const statsData = await postsApi.getPostsStats()
      setStats({
        total: statsData.total,
        draft: statsData.draft,
        scheduled: statsData.scheduled,
        published: statsData.published,
        failed: statsData.failed
      })
    } catch (err) {
      console.warn('Failed to fetch posts stats:', err)
    }
  }, [enabled])

  // Начальная загрузка
  useEffect(() => {
    fetchPosts(true)
    fetchStats()
  }, [fetchPosts, fetchStats])

  // Автообновление
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchPosts(false)
      fetchStats()
    }, refreshInterval)
    
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchPosts, fetchStats])

  // =============================================================================
  // МУТАЦИИ
  // =============================================================================

  /**
   * Создание поста с optimistic update
   */
  const create = useCallback(async (postData: CreatePostData): Promise<Post> => {
    try {
      // Optimistic update
      const optimisticPost: Post = {
        id: `temp-${Date.now()}`,
        user_id: 'current-user', // TODO: получить из auth context
        channel_id: postData.channel_id,
        contract_id: postData.contract_id || null,
        title: postData.title,
        status: 'draft',
        creative_text: postData.creative_text,
        creative_images: postData.creative_images || [],
        target_url: postData.target_url || null,
        placement_cost: postData.placement_cost || null,
        placement_currency: postData.placement_currency || 'RUB',
        advertiser_inn: '',
        advertiser_name: '',
        product_description: postData.product_description || '',
        erid: null,
        ord_status: 'pending',
        ord_error_message: null,
        scheduled_at: postData.scheduled_at || null,
        published_at: null,
        telegram_message_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Добавляем в optimistic updates
      optimisticUpdatesRef.current.set(optimisticPost.id, optimisticPost)
      setPosts(prev => [optimisticPost, ...prev])
      setTotal(prev => prev + 1)

      // Выполняем реальный запрос
      const createdPost = await postsApi.createPost(postData)

      // Убираем из optimistic updates и обновляем данными
      optimisticUpdatesRef.current.delete(optimisticPost.id)
      setPosts(prev => prev.map(post => 
        post.id === optimisticPost.id ? createdPost : post
      ))

      // Обновляем статистику
      fetchStats()

      return createdPost
    } catch (error) {
      // Rollback optimistic update
      const tempId = `temp-${Date.now()}`
      optimisticUpdatesRef.current.delete(tempId)
      setPosts(prev => prev.filter(post => !post.id.startsWith('temp-')))
      setTotal(prev => Math.max(0, prev - 1))

      throw error
    }
  }, [fetchStats])

  /**
   * Обновление поста с optimistic update
   */
  const update = useCallback(async (id: string, updateData: UpdatePostData): Promise<Post> => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === id 
          ? { ...post, ...updateData, updated_at: new Date().toISOString() }
          : post
      ))

      // Выполняем реальный запрос
      const updatedPost = await postsApi.updatePost(id, updateData)

      // Обновляем с реальными данными
      setPosts(prev => prev.map(post => 
        post.id === id ? updatedPost : post
      ))

      // Обновляем статистику
      fetchStats()

      return updatedPost
    } catch (error) {
      // Rollback
      await fetchPosts(true)
      throw error
    }
  }, [fetchPosts, fetchStats])

  /**
   * Удаление поста с optimistic update
   */
  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update
      setPosts(prev => prev.filter(post => post.id !== id))
      setTotal(prev => Math.max(0, prev - 1))

      // Выполняем реальный запрос
      await postsApi.deletePost(id)

      // Обновляем статистику
      fetchStats()
    } catch (error) {
      // Rollback
      await fetchPosts(true)
      throw error
    }
  }, [fetchPosts, fetchStats])

  /**
   * Дублирование поста
   */
  const duplicate = useCallback(async (id: string): Promise<Post> => {
    try {
      const duplicatedPost = await postsApi.duplicatePost(id)
      
      // Обновляем список
      setPosts(prev => [duplicatedPost, ...prev])
      setTotal(prev => prev + 1)

      // Обновляем статистику
      fetchStats()

      return duplicatedPost
    } catch (error) {
      throw error
    }
  }, [fetchStats])

  // =============================================================================
  // УПРАВЛЕНИЕ ФИЛЬТРАМИ И ПАГИНАЦИЕЙ
  // =============================================================================

  /**
   * Установка фильтров
   */
  const setFilters = useCallback((newFilters: PostFilters) => {
    setFiltersState(newFilters)
    setPagination(prev => ({ ...prev, offset: 0 })) // Сброс пагинации
    saveFiltersToStorage(newFilters)
  }, [])

  /**
   * Очистка фильтров
   */
  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters)
    setPagination(prev => ({ ...prev, offset: 0 }))
    saveFiltersToStorage(defaultFilters)
  }, [])

  /**
   * Загрузка следующей страницы
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return

    const nextOffset = pagination.offset + pagination.limit
    setPagination(prev => ({ ...prev, offset: nextOffset }))
  }, [hasMore, isLoading, pagination])

  /**
   * Обновление данных
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchPosts(true)
    await fetchStats()
  }, [fetchPosts, fetchStats])

  // =============================================================================
  // ВОЗВРАЩАЕМОЕ ЗНАЧЕНИЕ
  // =============================================================================

  const result: UsePostsReturn = {
    // Данные
    posts,
    total,
    hasMore,
    isLoading,
    isValidating,
    error,

    // Пагинация
    loadMore,
    refresh,

    // Фильтрация
    setFilters,
    clearFilters,

    // Мутации
    create,
    update,
    delete: remove,
    duplicate,

    // Статистика
    stats
  }

  return result
}

// =============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ХУКИ
// =============================================================================

/**
 * Hook для работы с конкретным набором постов по фильтру
 */
export function usePostsByFilter(
  filterType: 'drafts' | 'scheduled' | 'published' | 'failed',
  options: UsePostsOptions = {}
): UsePostsReturn {
  const statusMap = {
    drafts: ['draft' as const],
    scheduled: ['scheduled' as const],
    published: ['published' as const],
    failed: ['failed' as const]
  }

  return usePosts({
    ...options,
    filters: {
      ...options.filters,
      status: statusMap[filterType]
    }
  })
}

/**
 * Hook для работы с постами конкретного канала
 */
export function usePostsByChannel(
  channelId: string,
  options: UsePostsOptions = {}
): UsePostsReturn {
  return usePosts({
    ...options,
    filters: {
      ...options.filters,
      channel_id: channelId
    }
  })
}

/**
 * Hook для работы с постами конкретного договора
 */
export function usePostsByContract(
  contractId: string,
  options: UsePostsOptions = {}
): UsePostsReturn {
  return usePosts({
    ...options,
    filters: {
      ...options.filters,
      contract_id: contractId
    }
  })
} 