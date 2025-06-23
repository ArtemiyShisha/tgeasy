import { PostRepository } from '@/lib/repositories/post-repository'
import { Post, PostError } from '@/types/post'

/**
 * Сервис для работы с планировщиком публикаций
 * В будущем будет интегрирован с Telegram Bot API для автоматической публикации
 */
export class SchedulerService {
  private postRepository: PostRepository

  constructor() {
    this.postRepository = new PostRepository()
  }

  /**
   * Добавление поста в очередь планирования
   */
  async queueScheduledPost(post: Post): Promise<void> {
    try {
      if (!post.scheduled_at) {
        throw new PostError('Post must have a scheduled date', 'VALIDATION_ERROR')
      }

      // TODO: В будущем здесь будет интеграция с внешним планировщиком
      // Например, добавление задачи в Redis Queue или использование cron jobs
      
      console.log(`Post ${post.id} queued for publishing at ${post.scheduled_at}`)
      
      // Пока что просто логируем - реальная реализация будет в Задаче 25
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to queue scheduled post: ${error}`, 'QUEUE_FAILED')
    }
  }

  /**
   * Удаление поста из очереди планирования
   */
  async dequeueScheduledPost(postId: string): Promise<void> {
    try {
      // TODO: Удаление задачи из планировщика
      console.log(`Post ${postId} removed from scheduling queue`)
    } catch (error) {
      throw new PostError(`Failed to dequeue scheduled post: ${error}`, 'DEQUEUE_FAILED')
    }
  }

  /**
   * Получение постов готовых к публикации
   */
  async getPostsReadyForPublishing(userId: string): Promise<Post[]> {
    try {
      const now = new Date().toISOString()
      
      const scheduledPosts = await this.postRepository.findScheduled(userId, new Date(now))
      
      return scheduledPosts.filter(post => 
        post.status === 'scheduled' && 
        post.scheduled_at && 
        new Date(post.scheduled_at) <= new Date(now)
      )
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get posts ready for publishing: ${error}`, 'GET_READY_FAILED')
    }
  }

  /**
   * Обработка планировщика - проверка и публикация готовых постов
   */
  async runSchedulerTick(userId: string): Promise<{
    processed: number
    published: number
    failed: number
    errors: string[]
  }> {
    const result = {
      processed: 0,
      published: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      const readyPosts = await this.getPostsReadyForPublishing(userId)
      result.processed = readyPosts.length

      for (const post of readyPosts) {
        try {
          // TODO: В Задаче 25 здесь будет реальная публикация в Telegram
          await this.publishPostToTelegram(post)
          
          // Обновляем статус поста
          await this.postRepository.update(userId, post.id, {
            status: 'published',
            published_at: new Date().toISOString()
          })
          
          result.published++
        } catch (error) {
          // Помечаем пост как failed
          await this.postRepository.update(userId, post.id, {
            status: 'failed'
          })
          
          result.failed++
          result.errors.push(`Post ${post.id}: ${error}`)
        }
      }

      return result
    } catch (error) {
      throw new PostError(`Scheduler tick failed: ${error}`, 'SCHEDULER_TICK_FAILED')
    }
  }

  /**
   * Заглушка для публикации в Telegram
   * Будет реализована в Задаче 25
   */
  private async publishPostToTelegram(post: Post): Promise<void> {
    // TODO: Интеграция с Telegram Bot API
    // - Форматирование контента поста
    // - Отправка сообщения в канал
    // - Обработка медиафайлов
    // - Сохранение telegram_message_id
    
    console.log(`Publishing post ${post.id} to Telegram channel ${post.channel_id}`)
    
    // Симуляция публикации
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Симуляция случайной ошибки (5% вероятность)
    if (Math.random() < 0.05) {
      throw new Error('Simulated Telegram API error')
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
      const scheduledPosts = await this.postRepository.findScheduled(userId)
      const readyPosts = await this.getPostsReadyForPublishing(userId)
      
      // Находим ближайшую дату публикации
      const nextPost = scheduledPosts
        .filter(post => post.scheduled_at && new Date(post.scheduled_at) > new Date())
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0]

      return {
        scheduled: scheduledPosts.length,
        readyToPublish: readyPosts.length,
        nextScheduledDate: nextPost?.scheduled_at || null
      }
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to get scheduler stats: ${error}`, 'STATS_FAILED')
    }
  }

  /**
   * Перепланирование поста
   */
  async reschedulePost(userId: string, postId: string, newScheduledAt: Date): Promise<Post> {
    try {
      // Проверяем, что дата в будущем
      if (newScheduledAt <= new Date()) {
        throw new PostError('New scheduled date must be in the future', 'VALIDATION_ERROR')
      }

      // Удаляем из старой очереди
      await this.dequeueScheduledPost(postId)

      // Обновляем пост
      const updatedPost = await this.postRepository.update(userId, postId, {
        scheduled_at: newScheduledAt.toISOString(),
        status: 'scheduled'
      })

      // Добавляем в новую очередь
      await this.queueScheduledPost(updatedPost)

      return updatedPost
    } catch (error) {
      if (error instanceof PostError) throw error
      throw new PostError(`Failed to reschedule post: ${error}`, 'RESCHEDULE_FAILED')
    }
  }
} 