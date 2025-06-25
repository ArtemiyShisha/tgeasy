import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import { 
  Post, 
  PostWithRelations,
  CreatePostInput, 
  UpdatePostInput, 
  PostFilters, 
  PostsResult,
  PostMedia,
  PostAnalytics,
  PostError,
  PostStatus,
  POST_CONSTANTS
} from '@/types/post'
import { getCurrentUserId } from '@/lib/auth/session'

export class PostRepository {
  private supabase = createClient()

  /** Получаем экземпляр клиента: если userId null используем service-role */
  private getClient(userId: string | null) {
    return userId ? this.supabase : createAdminClient()
  }

  /**
   * Создание нового поста
   */
  async create(data: CreatePostInput): Promise<Post> {
    try {
      const currentUserId = await getCurrentUserId()
      if (!currentUserId) {
        throw new Error('User not authenticated')
      }

      const now = new Date()

      const postData: any = {
        user_id: currentUserId,
        channel_id: data.channel_id,
        title: data.title,
        status: 'draft',
        creative_text: (data.creative_text && data.creative_text.trim().length > 0) ? data.creative_text : '.',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }

      // Добавляем поля только если они переданы и не пустые
      if (data.target_url && data.target_url.trim()) {
        postData.target_url = data.target_url
      }

      if (data.creative_images && data.creative_images.length > 0) {
        postData.creative_images = JSON.stringify(data.creative_images)
      }

      if (data.placement_cost != null && typeof data.placement_cost === 'number') {
        postData.placement_cost = data.placement_cost
        // если указана стоимость, добавляем валюту (или значение по умолчанию RUB)
        postData.placement_currency = data.placement_currency || 'RUB'
      }

      const needMarking = data.requires_marking === true
      if (needMarking) {
        // При маркировке должны прийти корректные данные (доступны позже из договора)
        if (data.advertiser_inn && data.advertiser_inn.trim()) {
          postData.advertiser_inn = data.advertiser_inn.trim()
        }
        if (data.advertiser_name && data.advertiser_name.trim()) {
          postData.advertiser_name = data.advertiser_name.trim()
        }
      } else {
        // Для черновиков / немаркированных постов ставим placeholder, чтобы пройти NOT NULL + regex
        postData.advertiser_inn = '0000000000'
        postData.advertiser_name = 'N/A'
      }

      if (data.product_description && data.product_description.trim()) {
        postData.product_description = data.product_description
      } else {
        postData.product_description = ''
      }

      if (data.contract_id) {
        postData.contract_id = data.contract_id
      }

      if (data.scheduled_at) {
        postData.scheduled_at = data.scheduled_at

        const scheduledDate = new Date(data.scheduled_at)

        // Если время публикации в будущем — ставим статус "scheduled", иначе сразу "published"
        if (scheduledDate > now) {
          postData.status = 'scheduled'
        } else {
          postData.status = 'published'
          // Гарантируем published_at >= created_at, поэтому используем now
          postData.published_at = now.toISOString()
        }
      }

      // Устанавливаем ord_status по умолчанию
      postData.ord_status = 'pending'

      // Убеждаемся что status корректный
      if (!['draft', 'scheduled', 'published', 'failed'].includes(postData.status)) {
        postData.status = 'draft'
      }

      const { data: post, error } = await this.getClient(currentUserId)
        .from('posts')
        .insert(postData as any)
        .select()
        .single()

      if (error) {
        throw new PostError(`Failed to create post: ${error.message}`, 'CREATE_FAILED')
      }

      return this.transformDbPost(post)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error creating post: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение поста по ID
   */
  async findById(userId: string | null, postId: string): Promise<Post | null> {
    try {
      console.log(`PostRepository.findById called with:`, { userId, postId })
      
      let query = this.getClient(userId)
        .from('posts')
        .select('*')
        .eq('id', postId)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      console.log('Executing findById query...')
      const { data: post, error } = await query.single()

      if (error) {
        console.error('PostRepository.findById database error:', {
          error,
          userId,
          postId
        })
        if (error.code === 'PGRST116') return null // Not found
        throw new PostError(`Failed to find post: ${error.message}`, 'FIND_FAILED')
      }

      console.log('PostRepository.findById raw data:', post)
      
      const transformed = this.transformDbPost(post)
      console.log('PostRepository.findById transformed data:', transformed)
      
      return transformed
    } catch (error) {
      console.error('PostRepository.findById error:', error)
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding post: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение поста с связанными данными
   */
  async findByIdWithRelations(userId: string | null, postId: string): Promise<PostWithRelations | null> {
    try {
      let query = this.getClient(userId)
        .from('posts')
        .select(`
          *,
          channel:telegram_channels!posts_channel_id_fkey (
            id,
            channel_title,
            telegram_channel_id
          ),
          contract:contracts!posts_contract_id_fkey (
            id,
            title,
            advertiser_name
          ),
          media:post_media (
            id,
            post_id,
            file_path:file_url,
            file_name,
            file_size,
            mime_type,
            sort_order,
            created_at
          ),
          analytics:post_analytics (
            id,
            post_id,
            views,
            forwards,
            clicks,
            click_rate,
            created_at
          )
        `)
        .eq('id', postId)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: post, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new PostError(`Failed to find post with relations: ${error.message}`, 'FIND_FAILED')
      }

      return this.transformDbPostWithRelations(post)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding post with relations: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение всех постов пользователя с фильтрацией
   */
  async findMany(userId: string, filters: PostFilters = {}): Promise<PostsResult> {
    try {
      let query = this.getClient(userId)
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Применяем фильтры
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.channel_id) {
        query = query.eq('channel_id', filters.channel_id)
      }
      if (filters.contract_id) {
        query = query.eq('contract_id', filters.contract_id)
      }
      if (filters.ord_status) {
        query = query.eq('ord_status', filters.ord_status)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,creative_text.ilike.%${filters.search}%,advertiser_name.ilike.%${filters.search}%`)
      }

      // Пагинация
      const limit = filters.limit || 20
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      // Сортировка
      query = query.order('created_at', { ascending: false })

      const { data: posts, error, count } = await query

      if (error) {
        throw new PostError(`Failed to find posts: ${error.message}`, 'FIND_FAILED')
      }

      return {
        posts: posts?.map(post => this.transformDbPost(post)) || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding posts: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Обновление поста
   */
  async update(userId: string, postId: string, data: UpdatePostInput): Promise<Post> {
    try {
      // Валидация входных данных
      this.validateUpdateInput(data)

      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      }

      // Колонка requires_marking отсутствует в таблице posts – используем только для логики на уровне сервисов
      if ('requires_marking' in updateData) {
        delete updateData.requires_marking;
      }

      // Преобразуем массив изображений в JSON
      if (data.creative_images) {
        updateData.creative_images = JSON.stringify(data.creative_images)
      }

      let query = this.getClient(userId)
        .from('posts')
        .update(updateData)
        .eq('id', postId)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: post, error } = await query.select().single()

      if (error) {
        console.error('Supabase update error:', error.code, error.message, error.details);
        throw new PostError(`Failed to update post: ${error.message}`, 'UPDATE_FAILED')
      }

      return this.transformDbPost(post)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error updating post: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Удаление поста
   */
  async delete(userId: string, postId: string): Promise<void> {
    try {
      // Сначала удаляем связанные медиафайлы и аналитику
      await Promise.all([
        this.getClient(userId).from('post_media').delete().eq('post_id', postId),
        this.getClient(userId).from('post_analytics').delete().eq('post_id', postId)
      ])

      // Затем удаляем сам пост
      let deleteQuery = this.getClient(userId)
        .from('posts')
        .delete()
        .eq('id', postId)

      if (userId) {
        deleteQuery = deleteQuery.eq('user_id', userId)
      }

      const { error } = await deleteQuery

      if (error) {
        throw new PostError(`Failed to delete post: ${error.message}`, 'DELETE_FAILED')
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error deleting post: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение постов по каналу
   */
  async findByChannelId(userId: string, channelId: string): Promise<Post[]> {
    try {
      const { data: posts, error } = await this.getClient(userId)
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new PostError(`Failed to find posts by channel: ${error.message}`, 'FIND_FAILED')
      }

      return posts?.map(post => this.transformDbPost(post)) || []
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding posts by channel: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение запланированных постов
   */
  async findScheduled(userId: string, beforeDate?: Date): Promise<Post[]> {
    try {
      let query = this.getClient(userId)
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'scheduled')
        .not('scheduled_at', 'is', null)

      if (beforeDate) {
        query = query.lte('scheduled_at', beforeDate.toISOString())
      }

      query = query.order('scheduled_at', { ascending: true })

      const { data: posts, error } = await query

      if (error) {
        throw new PostError(`Failed to find scheduled posts: ${error.message}`, 'FIND_FAILED')
      }

      return posts?.map(post => this.transformDbPost(post)) || []
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding scheduled posts: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Получение постов по статусу ОРД
   */
  async findByOrdStatus(userId: string, ordStatus: 'pending' | 'registered' | 'failed'): Promise<Post[]> {
    try {
      const { data: posts, error } = await this.getClient(userId)
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('ord_status', ordStatus)
        .order('created_at', { ascending: false })

      if (error) {
        throw new PostError(`Failed to find posts by ORD status: ${error.message}`, 'FIND_FAILED')
      }

      return posts?.map(post => this.transformDbPost(post)) || []
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error finding posts by ORD status: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Поиск постов по тексту
   */
  async search(userId: string, query: string, limit: number = 20): Promise<Post[]> {
    try {
      const { data: posts, error } = await this.getClient(userId)
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,creative_text.ilike.%${query}%,advertiser_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new PostError(`Failed to search posts: ${error.message}`, 'SEARCH_FAILED')
      }

      return posts?.map(post => this.transformDbPost(post)) || []
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error searching posts: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Обновление статуса поста
   */
  async updateStatus(userId: string, postId: string, status: PostStatus): Promise<Post> {
    try {
      let query = this.getClient(userId)
        .from('posts')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data: post, error } = await query.select().single()

      if (error) {
        throw new PostError(`Failed to update post status: ${error.message}`, 'UPDATE_FAILED')
      }

      return this.transformDbPost(post)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error updating post status: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Добавление медиафайла к посту
   */
  async addMedia(postId: string, mediaData: {
    file_url: string
    file_name: string
    file_size: number
    mime_type: string
    sort_order?: number
  }): Promise<PostMedia> {
    try {
      const { data: media, error } = await this.getClient(null)
        .from('post_media')
        .insert({
          post_id: postId,
          file_url: mediaData.file_url,
          file_name: mediaData.file_name,
          file_size: mediaData.file_size,
          mime_type: mediaData.mime_type,
          sort_order: mediaData.sort_order || 0
        })
        .select()
        .single()

      if (error) {
        throw new PostError(`Failed to add media: ${error.message}`, 'MEDIA_ADD_FAILED')
      }

      return {
        id: media.id,
        post_id: media.post_id,
        file_path: media.file_url,
        file_name: media.file_name,
        file_size: media.file_size,
        file_type: media.mime_type,
        sort_order: media.sort_order,
        created_at: media.created_at || new Date().toISOString()
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error adding media: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Удаление медиафайла
   */
  async removeMedia(userId: string, mediaId: string): Promise<void> {
    try {
      // Проверяем, что медиа принадлежит пользователю
      const { data: media, error: fetchError } = await this.getClient(null)
        .from('post_media')
        .select(`
          id,
          post:posts!post_media_post_id_fkey (
            user_id
          )
        `)
        .eq('id', mediaId)
        .single()

      if (fetchError) {
        throw new PostError(`Failed to find media: ${fetchError.message}`, 'MEDIA_NOT_FOUND')
      }

      if (!media?.post || (media.post as any).user_id !== userId) {
        throw new PostError('Media not found or access denied', 'MEDIA_ACCESS_DENIED')
      }

      const { error } = await this.getClient(null)
        .from('post_media')
        .delete()
        .eq('id', mediaId)

      if (error) {
        throw new PostError(`Failed to remove media: ${error.message}`, 'MEDIA_REMOVE_FAILED')
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Unexpected error removing media: ${error}`, 'UNKNOWN_ERROR')
    }
  }

  /**
   * Валидация данных для создания поста
   */
  private validateCreateInput(data: CreatePostInput): void {
    const { validateCreatePostInput } = require('@/utils/post-validation')
    const errors = validateCreatePostInput(data)
    
    if (errors.length > 0) {
      throw errors[0] // Бросаем первую ошибку
    }
  }

  /**
   * Валидация данных для обновления поста
   */
  private validateUpdateInput(data: UpdatePostInput): void {
    const { validateUpdatePostInput } = require('@/utils/post-validation')
    const errors = validateUpdatePostInput(data)
    
    if (errors.length > 0) {
      throw errors[0] // Бросаем первую ошибку
    }
  }

  /**
   * Преобразование данных из БД в модель
   */
  private transformDbPost(dbPost: any): Post {
    console.log('transformDbPost input:', dbPost)
    
    try {
      // Парсим creative_images если это строка
      let creativeImages = dbPost.creative_images
      if (typeof creativeImages === 'string') {
        console.log('Parsing creative_images from string:', creativeImages)
        try {
          creativeImages = JSON.parse(creativeImages)
        } catch (e) {
          console.error('Failed to parse creative_images:', e)
          creativeImages = []
        }
      }
      
      const transformed = {
        id: dbPost.id,
        user_id: dbPost.user_id,
        channel_id: dbPost.channel_id,
        contract_id: dbPost.contract_id,
        title: dbPost.title,
        status: dbPost.status,
        content: dbPost.content,
        creative_text: dbPost.creative_text || dbPost.content || '', // fallback to content
        target_url: dbPost.target_url,
        creative_images: Array.isArray(creativeImages) ? creativeImages : [],
        marking_required: dbPost.marking_required || false,
        advertiser_inn: dbPost.advertiser_inn,
        advertiser_name: dbPost.advertiser_name,
        product_description: dbPost.product_description,
        erid: dbPost.erid,
        ord_status: dbPost.ord_status,
        ord_error_message: dbPost.ord_error_message || null,
        placement_cost: dbPost.placement_cost ? parseFloat(dbPost.placement_cost) : null,
        placement_currency: dbPost.placement_currency || 'RUB',
        scheduled_at: dbPost.scheduled_at,
        published_at: dbPost.published_at,
        telegram_message_id: dbPost.telegram_message_id,
        created_at: dbPost.created_at,
        updated_at: dbPost.updated_at
      }
      
      console.log('transformDbPost output:', transformed)
      return transformed
    } catch (error) {
      console.error('transformDbPost error:', error)
      throw error
    }
  }

  /**
   * Преобразование данных из БД в интерфейс PostWithRelations
   */
  private transformDbPostWithRelations(dbPost: any): PostWithRelations {
    const post = this.transformDbPost(dbPost)
    
    return {
      ...post,
      channel: dbPost.channel ? {
        id: dbPost.channel.id,
        title: dbPost.channel.channel_title,
        telegram_channel_id: dbPost.channel.telegram_channel_id
      } : undefined,
      contract: dbPost.contract ? {
        id: dbPost.contract.id,
        title: dbPost.contract.title,
        advertiser_name: dbPost.contract.advertiser_name
      } : undefined,
      media: dbPost.media?.map((m: any) => ({
        id: m.id,
        post_id: m.post_id,
        file_path: m.file_path,
        file_name: m.file_name,
        file_size: m.file_size,
        file_type: m.mime_type,
        sort_order: m.sort_order,
        created_at: m.created_at
      })) || [],
      analytics: dbPost.analytics?.[0] || undefined
    }
  }
} 