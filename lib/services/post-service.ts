import { PostRepository } from '@/lib/repositories/post-repository'
import { ChannelRepository } from '@/lib/repositories/channel-repository'
import { ContractRepository } from '@/lib/repositories/contract-repository'
import { SchedulerService } from '@/lib/services/scheduler-service'
import { 
  Post, 
  PostWithRelations,
  CreatePostInput, 
  UpdatePostInput, 
  PostFilters, 
  PostsResult,
  PostError,
  PostMedia,
  CreatePostResponse
} from '@/types/post'

export class PostService {
  private postRepository: PostRepository
  private channelRepository: ChannelRepository
  private contractRepository: ContractRepository
  private schedulerService: SchedulerService

  constructor() {
    this.postRepository = new PostRepository()
    this.channelRepository = ChannelRepository.getInstance()
    this.contractRepository = new ContractRepository()
    this.schedulerService = new SchedulerService()
  }

  /**
   * Создание нового поста с валидацией прав доступа
   */
  async createPost(userId: string, data: CreatePostInput): Promise<CreatePostResponse> {
    try {
      // 1. Валидация прав доступа к каналу
      await this.validateChannelAccess(userId, data.channel_id)
      
      // 2. Валидация договора (если указан)
      let contractAdvertiserInn: string | undefined
      let contractAdvertiserName: string | undefined

      if (data.contract_id) {
        await this.validateContractAccess(userId, data.contract_id)

        // Если требуется маркировка – подтягиваем ИНН и название из договора, чтобы пройти NOT NULL constraints
        const contract = await this.contractRepository.findById(data.contract_id, userId)
        if (contract) {
          contractAdvertiserInn = contract.advertiser_inn
          contractAdvertiserName = contract.advertiser_name
        }

        if (data.requires_marking && (!contractAdvertiserInn || !contractAdvertiserName)) {
          throw new PostError('Advertiser data missing in contract', 'VALIDATION_ERROR', 'contract_id')
        }
      }

      const postData = {
        ...data,
        ...(data.requires_marking ? {
          advertiser_inn: contractAdvertiserInn,
          advertiser_name: contractAdvertiserName
        } : {})
      } as typeof data

      // 3. Создание поста
      const post = await this.postRepository.create(postData)

      // 4. TODO: Автоматическая регистрация в ОРД (будет в Задаче 23)
      // const erid = await this.ordService.autoRegisterOnPostCreate(post)
      // if (erid) {
      //   await this.postRepository.update(userId, post.id, { erid, ord_status: 'registered' })
      // }

      return {
        post
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to create post: ${error}`, 'CREATE_FAILED')
    }
  }

  /**
   * Получение поста по ID с проверкой прав доступа
   */
  async getPost(userId: string, postId: string): Promise<Post | null> {
    try {
      return await this.postRepository.findById(userId, postId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get post: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Получение поста с связанными данными
   */
  async getPostWithRelations(userId: string, postId: string): Promise<PostWithRelations | null> {
    try {
      return await this.postRepository.findByIdWithRelations(userId, postId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get post with relations: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Получение всех постов пользователя с фильтрацией
   */
  async getPosts(userId: string, filters: PostFilters = {}): Promise<PostsResult> {
    try {
      return await this.postRepository.findMany(userId, filters)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get posts: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Обновление поста с валидацией
   */
  async updatePost(userId: string, postId: string, data: UpdatePostInput): Promise<Post> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Валидация смены канала (если указан новый)
      if (data.channel_id && data.channel_id !== existingPost.channel_id) {
        await this.validateChannelAccess(userId, data.channel_id)
      }

      // Валидация смены договора (если указан новый)
      if (data.contract_id && data.contract_id !== existingPost.contract_id) {
        await this.validateContractAccess(userId, data.contract_id)
      }

      // Обновление поста
      const updatedPost = await this.postRepository.update(userId, postId, data)

      // TODO: Обновление в ОРД при изменении креатива (будет в Задаче 23)
      // if (data.creative_text || data.creative_images || data.target_url) {
      //   await this.ordService.updateCreative(updatedPost.erid, updatedPost)
      // }

      return updatedPost
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to update post: ${error}`, 'UPDATE_FAILED')
    }
  }

  /**
   * Удаление поста
   */
  async deletePost(userId: string, postId: string): Promise<void> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Проверяем, что пост можно удалить (не опубликован)
      if (existingPost.status === 'published') {
        throw new PostError('Cannot delete published post', 'DELETE_FORBIDDEN')
      }

      await this.postRepository.delete(userId, postId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to delete post: ${error}`, 'DELETE_FAILED')
    }
  }

  /**
   * Получение постов по каналу
   */
  async getPostsByChannel(userId: string, channelId: string): Promise<Post[]> {
    try {
      // Валидация прав доступа к каналу
      await this.validateChannelAccess(userId, channelId)
      
      return await this.postRepository.findByChannelId(userId, channelId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get posts by channel: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Планирование поста
   */
  async schedulePost(userId: string, postId: string, scheduledAt: Date): Promise<Post> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Проверяем, что дата в будущем
      if (scheduledAt <= new Date()) {
        throw new PostError('Scheduled date must be in the future', 'VALIDATION_ERROR', 'scheduled_at')
      }

      // Проверяем, что пост в статусе draft
      if (existingPost.status !== 'draft') {
        throw new PostError('Only draft posts can be scheduled', 'VALIDATION_ERROR', 'status')
      }

      // Обновляем статус и дату планирования
      return await this.postRepository.update(userId, postId, {
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString()
      })
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to schedule post: ${error}`, 'SCHEDULE_FAILED')
    }
  }

  /**
   * Отмена планирования поста
   */
  async unschedulePost(userId: string, postId: string): Promise<Post> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Проверяем, что пост запланирован
      if (existingPost.status !== 'scheduled') {
        throw new PostError('Post is not scheduled', 'VALIDATION_ERROR', 'status')
      }

      // Возвращаем в статус draft
      return await this.postRepository.update(userId, postId, {
        status: 'draft',
        scheduled_at: null
      })
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to unschedule post: ${error}`, 'UNSCHEDULE_FAILED')
    }
  }

  /**
   * Получение запланированных постов для публикации
   */
  async getScheduledPosts(userId: string, beforeDate?: Date): Promise<Post[]> {
    try {
      return await this.postRepository.findScheduled(userId, beforeDate)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get scheduled posts: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Получение постов по статусу ОРД
   */
  async getPostsByOrdStatus(userId: string, ordStatus: 'pending' | 'registered' | 'failed'): Promise<Post[]> {
    try {
      return await this.postRepository.findByOrdStatus(userId, ordStatus)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get posts by ORD status: ${error}`, 'GET_FAILED')
    }
  }

  /**
   * Публикация поста (будет расширено в Задаче 25)
   */
  async publishPost(userId: string, postId: string): Promise<Post> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Проверяем, что пост можно публиковать
      if (existingPost.status === 'published') {
        throw new PostError('Post is already published', 'VALIDATION_ERROR', 'status')
      }

      // TODO: Публикация в Telegram (будет в Задаче 25)
      // const telegramMessage = await this.telegramService.sendPost(
      //   existingPost.channel_id,
      //   this.formatPostContent(existingPost)
      // )

      // Обновляем статус поста
      return await this.postRepository.update(userId, postId, {
        status: 'published',
        published_at: new Date().toISOString()
        // telegram_message_id: telegramMessage.message_id
      })
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to publish post: ${error}`, 'PUBLISH_FAILED')
    }
  }

  /**
   * Валидация прав доступа к каналу
   */
  private async validateChannelAccess(userId: string, channelId: string): Promise<void> {
    const channel = await this.channelRepository.getById(channelId)
    if (!channel) {
      throw new PostError('Channel not found or access denied', 'ACCESS_DENIED', 'channel_id')
    }
    
    // Проверяем, что пользователь имеет доступ к каналу
    const userChannels = await this.channelRepository.getUserChannels(userId)
    const hasAccess = userChannels.channels.some(ch => ch.id === channelId)
    
    if (!hasAccess) {
      throw new PostError('Channel not found or access denied', 'ACCESS_DENIED', 'channel_id')
    }
  }

  /**
   * Валидация прав доступа к договору
   */
  private async validateContractAccess(userId: string, contractId: string): Promise<void> {
    const contract = await this.contractRepository.findById(contractId, userId)
    if (!contract) {
      throw new PostError('Contract not found or access denied', 'ACCESS_DENIED', 'contract_id')
    }
  }

  /**
   * Форматирование контента поста для публикации
   */
  private formatPostContent(post: Post): string {
    let content = post.creative_text

    // Добавляем ERID если есть
    if (post.erid) {
      content += `\n\n#реклама ${post.erid}`
    }

    // Добавляем ссылку если есть
    if (post.target_url) {
      content += `\n\n🔗 ${post.target_url}`
    }

    return content
  }

  /**
   * Получение статистики постов пользователя
   */
  async getPostsStats(userId: string): Promise<{
    total: number
    draft: number
    scheduled: number
    published: number
    failed: number
    ord_pending: number
    ord_registered: number
    ord_failed: number
  }> {
    try {
      const [
        total,
        draft,
        scheduled,
        published,
        failed,
        ordPending,
        ordRegistered,
        ordFailed
      ] = await Promise.all([
        this.postRepository.findMany(userId, { limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { status: 'draft', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { status: 'scheduled', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { status: 'published', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { status: 'failed', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { ord_status: 'pending', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { ord_status: 'registered', limit: 1 }).then(r => r.total),
        this.postRepository.findMany(userId, { ord_status: 'failed', limit: 1 }).then(r => r.total)
      ])

      return {
        total,
        draft,
        scheduled,
        published,
        failed,
        ord_pending: ordPending,
        ord_registered: ordRegistered,
        ord_failed: ordFailed
      }
    } catch (error) {
      throw new PostError(`Failed to get posts stats: ${error}`, 'STATS_FAILED')
    }
  }

  /**
   * Загрузка медиафайла к посту
   */
  async uploadMedia(userId: string, postId: string, mediaData: {
    file_url: string
    file_name: string
    file_size: number
    mime_type: string
    sort_order?: number
  }): Promise<PostMedia> {
    try {
      // Проверяем, что пост существует и принадлежит пользователю
      const existingPost = await this.postRepository.findById(userId, postId)
      if (!existingPost) {
        throw new PostError('Post not found', 'NOT_FOUND')
      }

      // Проверяем, что пост в статусе draft
      if (existingPost.status !== 'draft') {
        throw new PostError('Media can only be added to draft posts', 'VALIDATION_ERROR')
      }

      return await this.postRepository.addMedia(postId, mediaData)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to upload media: ${error}`, 'MEDIA_UPLOAD_FAILED')
    }
  }

  /**
   * Удаление медиафайла
   */
  async removeMedia(userId: string, mediaId: string): Promise<void> {
    try {
      await this.postRepository.removeMedia(userId, mediaId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to remove media: ${error}`, 'MEDIA_REMOVE_FAILED')
    }
  }

  /**
   * Поиск постов
   */
  async searchPosts(userId: string, query: string, limit: number = 20): Promise<Post[]> {
    try {
      return await this.postRepository.search(userId, query, limit)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to search posts: ${error}`, 'SEARCH_FAILED')
    }
  }

  /**
   * Получение статистики планировщика
   */
  async getSchedulerStats(userId: string): Promise<{
    scheduled: number
    readyToPublish: number
    nextScheduledDate: string | null
  }> {
    try {
      return await this.schedulerService.getSchedulerStats(userId)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get scheduler stats: ${error}`, 'SCHEDULER_STATS_FAILED')
    }
  }

  /**
   * Перепланирование поста
   */
  async reschedulePost(userId: string, postId: string, newScheduledAt: Date): Promise<Post> {
    try {
      return await this.schedulerService.reschedulePost(userId, postId, newScheduledAt)
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to reschedule post: ${error}`, 'RESCHEDULE_FAILED')
    }
  }
} 