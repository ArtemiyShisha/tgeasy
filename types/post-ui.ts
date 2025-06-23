// UI типы для рекламных размещений (Posts)
import { Post, PostWithRelations, PostStatus, OrdStatus, PostMedia, PostAnalytics } from './post'

// =============================================================================
// ФИЛЬТРАЦИЯ И ПОИСК
// =============================================================================

export interface PostFilters {
  status?: PostStatus[]
  channel_id?: string
  contract_id?: string
  ord_status?: OrdStatus[]
  date_from?: string
  date_to?: string
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'scheduled_at' | 'published_at' | 'title'
  sort_order?: 'asc' | 'desc'
}

export interface PostPaginationOptions {
  limit?: number
  offset?: number
  cursor?: string
}

export interface PostSearchOptions extends PostFilters, PostPaginationOptions {
  include_analytics?: boolean
  include_media?: boolean
}

// =============================================================================
// ОТВЕТЫ API
// =============================================================================

export interface PostsApiResponse {
  success: boolean
  data: {
    posts: Post[]
    total: number
    hasMore: boolean
    nextCursor?: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PostApiResponse {
  success: boolean
  data: Post | PostWithRelations
  error?: {
    code: string
    message: string
    field?: string
  }
}

export interface PostStatsResponse {
  success: boolean
  data: {
    total: number
    draft: number
    scheduled: number
    published: number
    failed: number
    archived: number
    ord_pending: number
    ord_registered: number
    ord_failed: number
  }
}

// =============================================================================
// СОЗДАНИЕ И ОБНОВЛЕНИЕ
// =============================================================================

export interface CreatePostData {
  channel_id: string
  contract_id?: string | null
  title: string
  creative_text: string
  creative_images?: string[]
  target_url?: string | null
  placement_cost?: number | null
  placement_currency?: 'RUB' | 'USD' | 'EUR'
  kktu: string
  product_description: string
  scheduled_at?: string | null
  requires_marking?: boolean
}

export interface UpdatePostData {
  channel_id?: string
  contract_id?: string | null
  title?: string
  status?: PostStatus
  creative_text?: string
  creative_images?: string[]
  target_url?: string | null
  placement_cost?: number | null
  placement_currency?: 'RUB' | 'USD' | 'EUR'
  kktu?: string
  product_description?: string
  erid?: string | null
  ord_status?: OrdStatus
  ord_error_message?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  requires_marking?: boolean
}

// =============================================================================
// МЕДИАФАЙЛЫ
// =============================================================================

export interface MediaUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  result?: PostMedia
}

export interface MediaUploadOptions {
  onProgress?: (progress: MediaUploadProgress[]) => void
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
}

export interface MediaUploadResponse {
  success: boolean
  data: PostMedia[]
  error?: {
    code: string
    message: string
    field?: string
  }
}

// =============================================================================
// ПЛАНИРОВАНИЕ
// =============================================================================

export interface SchedulePostData {
  scheduled_at: string
}

export interface SchedulerSlot {
  datetime: string
  available: boolean
  conflictingPosts?: string[]
}

export interface SchedulerOptions {
  channel_id?: string
  date_from?: string
  date_to?: string
  interval_minutes?: number
}

export interface SchedulerStats {
  scheduled: number
  readyToPublish: number
  nextScheduledDate: string | null
  upcomingSlots: SchedulerSlot[]
}

// =============================================================================
// ПРЕВЬЮ И ВАЛИДАЦИЯ
// =============================================================================

export interface PostPreview {
  formatted_text: string
  character_count: number
  media_count: number
  estimated_reach?: number
  telegram_preview: string
  validation_errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  severity: 'low' | 'medium' | 'high'
}

export interface PreviewOptions {
  include_media?: boolean
  include_reach_estimate?: boolean
  validate_content?: boolean
}

// =============================================================================
// ФОРМА И СОСТОЯНИЕ
// =============================================================================

export interface PostFormState {
  // Основные поля
  channel_id: string
  contract_id: string | null
  title: string
  creative_text: string
  creative_images: string[]
  target_url: string | null
  placement_cost: number | null
  placement_currency: 'RUB' | 'USD' | 'EUR'
  
  // ОРД данные
  kktu: string
  product_description: string
  
  // Планирование
  scheduled_at: string | null
  
  // Метаданные формы
  isDirty: boolean
  isValid: boolean
  lastSavedAt: string | null
  errors: Record<string, string>
  warnings: Record<string, string>
}

export interface PostFormActions {
  updateField: (field: keyof PostFormState, value: any) => void
  updateFields: (fields: Partial<PostFormState>) => void
  validateField: (field: keyof PostFormState) => void
  validateAll: () => boolean
  reset: () => void
  saveDraft: () => Promise<void>
  loadDraft: (postId?: string) => Promise<void>
  clearDraft: () => void
}

export interface PostFormHistory {
  past: PostFormState[]
  present: PostFormState
  future: PostFormState[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

// =============================================================================
// HOOKS ОПЦИИ И ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ
// =============================================================================

export interface UsePostsOptions {
  filters?: PostFilters
  pagination?: PostPaginationOptions
  autoRefresh?: boolean
  refreshInterval?: number
  enabled?: boolean
}

export interface UsePostsReturn {
  // Данные
  posts: Post[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  
  // Пагинация
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  
  // Фильтрация
  setFilters: (filters: PostFilters) => void
  clearFilters: () => void
  
  // Мутации
  create: (data: CreatePostData) => Promise<Post>
  update: (id: string, data: UpdatePostData) => Promise<Post>
  delete: (id: string) => Promise<void>
  duplicate: (id: string) => Promise<Post>
  
  // Статистика
  stats: {
    total: number
    draft: number
    scheduled: number
    published: number
    failed: number
  } | null
}

export interface UsePostOptions {
  postId: string
  include?: {
    relations?: boolean
    analytics?: boolean
    media?: boolean
  }
  enabled?: boolean
}

export interface UsePostReturn {
  // Данные
  post: Post | PostWithRelations | null
  isLoading: boolean
  error: Error | null
  
  // Мутации
  update: (data: UpdatePostData) => Promise<Post>
  delete: () => Promise<void>
  duplicate: () => Promise<Post>
  
  // Специальные операции
  schedule: (scheduledAt: Date) => Promise<Post>
  unschedule: () => Promise<Post>
  publish: () => Promise<Post>
  
  // Медиа
  uploadMedia: (files: File[], options?: MediaUploadOptions) => Promise<PostMedia[]>
  removeMedia: (mediaId: string) => Promise<void>
  
  // Превью
  generatePreview: (options?: PreviewOptions) => Promise<PostPreview>
  
  // Обновление
  refresh: () => Promise<void>
}

export interface UsePostFormOptions {
  postId?: string
  initialData?: Partial<PostFormState>
  autoSave?: boolean
  autoSaveInterval?: number
  enableHistory?: boolean
  maxHistorySize?: number
}

export interface UsePostFormReturn {
  // Состояние формы
  formState: PostFormState
  formActions: PostFormActions
  formHistory?: PostFormHistory
  
  // Статус
  isLoading: boolean
  isSaving: boolean
  isValid: boolean
  isDirty: boolean
  error: Error | null
  
  // Превью
  preview: PostPreview | null
  generatePreview: () => Promise<void>
  
  // Сохранение
  saveDraft: () => Promise<Post>
  publish: () => Promise<Post>
  schedule: (scheduledAt: Date) => Promise<Post>
}

export interface UseSchedulerOptions {
  channel_id?: string
  enabled?: boolean
}

export interface UseSchedulerReturn {
  // Статистика
  stats: SchedulerStats | null
  isLoading: boolean
  error: Error | null
  
  // Слоты
  getAvailableSlots: (options: SchedulerOptions) => Promise<SchedulerSlot[]>
  
  // Операции
  schedule: (postId: string, scheduledAt: Date) => Promise<Post>
  unschedule: (postId: string) => Promise<Post>
  reschedule: (postId: string, newScheduledAt: Date) => Promise<Post>
  
  // Обновление
  refresh: () => Promise<void>
}

export interface UsePostPreviewOptions {
  postId?: string
  postData?: Partial<PostFormState>
  autoUpdate?: boolean
  debounceMs?: number
}

export interface UsePostPreviewReturn {
  // Превью
  preview: PostPreview | null
  isLoading: boolean
  error: Error | null
  
  // Генерация
  generatePreview: (data?: Partial<PostFormState>) => Promise<PostPreview>
  clearPreview: () => void
  
  // Метрики
  characterCount: number
  mediaCount: number
  estimatedReach: number | null
  
  // Валидация
  validationErrors: ValidationError[]
  validationWarnings: ValidationWarning[]
  isValid: boolean
}

// =============================================================================
// ОШИБКИ
// =============================================================================

export class PostsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public field?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'PostsApiError'
  }
}

// =============================================================================
// КОНСТАНТЫ
// =============================================================================

export const POST_UI_CONSTANTS = {
  // Пагинация
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Автообновление
  DEFAULT_REFRESH_INTERVAL: 30000, // 30 секунд
  
  // Автосохранение
  DEFAULT_AUTOSAVE_INTERVAL: 10000, // 10 секунд
  
  // Debounce
  DEFAULT_DEBOUNCE_MS: 500,
  SEARCH_DEBOUNCE_MS: 300,
  
  // История
  MAX_HISTORY_SIZE: 50,
  
  // Превью
  PREVIEW_CACHE_TTL: 60000, // 1 минута
  
  // Медиа
  MAX_UPLOAD_FILES: 10,
  UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB
  
  // Планировщик
  MIN_SCHEDULE_OFFSET_MINUTES: 5,
  DEFAULT_SCHEDULER_INTERVAL: 15, // 15 минут
  
  // Фильтры
  FILTER_STORAGE_KEY: 'tgeasy_posts_filters',
  
  // Локальное хранилище
  DRAFT_STORAGE_PREFIX: 'tgeasy_post_draft_',
  FORM_STATE_STORAGE_KEY: 'tgeasy_post_form_state'
} as const

// =============================================================================
// УТИЛИТАРНЫЕ ТИПЫ
// =============================================================================

export type PostSortField = 'created_at' | 'updated_at' | 'scheduled_at' | 'published_at' | 'title'
export type PostSortOrder = 'asc' | 'desc'
export type PostViewMode = 'list' | 'grid' | 'table'
export type PostStatusGroup = 'all' | 'drafts' | 'scheduled' | 'published' | 'failed'

export interface PostListOptions {
  viewMode?: PostViewMode
  sortField?: PostSortField
  sortOrder?: PostSortOrder
  statusGroup?: PostStatusGroup
  showAnalytics?: boolean
  showMedia?: boolean
} 