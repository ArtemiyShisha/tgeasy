// Типы для рекламных размещений (Posts)
import { Database } from './database'

// Извлекаем типы из database schema
export type PostRow = Database['public']['Tables']['posts']['Row']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostUpdate = Database['public']['Tables']['posts']['Update']

export type PostMediaRow = Database['public']['Tables']['post_media']['Row']
export type PostAnalyticsRow = Database['public']['Tables']['post_analytics']['Row']

// Enum'ы для статусов
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived'
export type OrdStatus = 'pending' | 'registered' | 'failed' | 'expired'

// Основной интерфейс Post
export interface Post {
  id: string
  user_id: string
  channel_id: string
  contract_id: string | null
  
  // Основная информация
  title: string
  status: PostStatus
  
  // Контент креатива
  creative_text: string
  creative_images: string[] // JSON массив URLs
  target_url: string | null
  
  // Стоимость размещения
  placement_cost: number | null
  placement_currency: 'RUB' | 'USD' | 'EUR'
  
  // ОРД информация
  advertiser_inn: string
  advertiser_name: string
  product_description: string
  erid: string | null
  ord_status: OrdStatus
  ord_error_message: string | null
  
  // Планирование и публикация
  scheduled_at: string | null
  published_at: string | null
  telegram_message_id: number | null
  
  // Метаданные
  created_at: string
  updated_at: string
}

// Медиафайлы поста
export interface PostMedia {
  id: string
  post_id: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  sort_order: number
  created_at: string
}

// Аналитика поста
export interface PostAnalytics {
  id: string
  post_id: string
  views: number
  forwards: number
  clicks: number
  click_rate: number | null
  created_at: string
}

// DTO для создания поста
export interface CreatePostInput {
  channel_id: string
  contract_id?: string | null
  title: string
  creative_text: string
  creative_images?: string[]
  target_url?: string | null
  placement_cost?: number | null
  placement_currency?: 'RUB' | 'USD' | 'EUR'
  advertiser_inn?: string | null
  advertiser_name?: string | null
  product_description?: string | null
  kktu?: string | null
  requires_marking?: boolean
  scheduled_at?: string | null
}

// DTO для обновления поста
export interface UpdatePostInput {
  channel_id?: string
  contract_id?: string | null
  title?: string
  status?: PostStatus
  creative_text?: string
  creative_images?: string[]
  target_url?: string | null
  placement_cost?: number | null
  placement_currency?: 'RUB' | 'USD' | 'EUR'
  advertiser_inn?: string | null
  advertiser_name?: string | null
  product_description?: string | null
  kktu?: string | null
  requires_marking?: boolean
  erid?: string | null
  ord_status?: OrdStatus
  ord_error_message?: string | null
  scheduled_at?: string | null
  published_at?: string | null
  telegram_message_id?: number | null
}

// Фильтры для поиска постов
export interface PostFilters {
  status?: PostStatus
  channel_id?: string
  contract_id?: string
  ord_status?: OrdStatus
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

// Результат с пагинацией
export interface PostsResult {
  posts: Post[]
  total: number
  hasMore: boolean
}

// Расширенный пост с связанными данными
export interface PostWithRelations extends Post {
  channel?: {
    id: string
    title: string
    telegram_channel_id: string
  }
  contract?: {
    id: string
    title: string
    advertiser_name: string
  }
  media?: PostMedia[]
  analytics?: PostAnalytics
}

// Ответ создания поста
export interface CreatePostResponse {
  post: Post
  media_uploaded?: PostMedia[]
}

// Ошибки валидации
export interface PostValidationError {
  field: string
  message: string
  code: string
}

export class PostError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message)
    this.name = 'PostError'
  }
}

// Константы
export const POST_CONSTANTS = {
  MAX_TITLE_LENGTH: 255,
  MAX_CREATIVE_TEXT_LENGTH: 4096,
  MIN_CREATIVE_TEXT_LENGTH: 1,
  MAX_MEDIA_FILES: 10,
  MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/mov', 'video/avi'],
  INN_REGEX: /^\d{10,12}$/,
  KKTU_REGEX: /^\d{6}$/
} as const 