import { 
  Post, 
  CreatePostInput, 
  UpdatePostInput, 
  PostFilters, 
  PostsResult,
  PostMedia,
  CreatePostResponse
} from '@/types/post'

// Глобальное хранилище для тестовых данных
const testPostsStorage: Post[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    channel_id: 'test-channel-id',
    contract_id: null,
    title: 'Тестовый пост 1',
    status: 'draft',
    creative_text: 'Это тестовый креатив для демонстрации API',
    creative_images: [],
    target_url: 'https://example.com',
    placement_cost: 5000,
    placement_currency: 'RUB',
    advertiser_inn: '1234567890',
    advertiser_name: 'Тестовый рекламодатель',
    product_description: 'Тестовый продукт',
    erid: null,
    ord_status: 'pending',
    ord_error_message: null,
    scheduled_at: null,
    published_at: null,
    telegram_message_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

/**
 * Тестовая версия PostService для API тестирования
 * Возвращает моковые данные без обращения к базе данных
 */
export class TestPostService {

  async createPost(userId: string, data: CreatePostInput): Promise<CreatePostResponse> {
    const newPost: Post = {
      id: `550e8400-e29b-41d4-a716-44665544${String(Math.random()).slice(2, 6)}`,
      user_id: userId,
      channel_id: data.channel_id,
      contract_id: data.contract_id || null,
      title: data.title,
      status: 'draft',
      creative_text: data.creative_text,
      creative_images: data.creative_images || [],
      target_url: data.target_url || null,
      placement_cost: data.placement_cost || null,
      placement_currency: data.placement_currency || 'RUB',
      advertiser_inn: (data as any).advertiser_inn ?? '',
      advertiser_name: (data as any).advertiser_name ?? '',
      product_description: data.product_description || '',
      erid: null,
      ord_status: 'pending',
      ord_error_message: null,
      scheduled_at: data.scheduled_at || null,
      published_at: null,
      telegram_message_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    testPostsStorage.push(newPost)

    return {
      post: newPost,
      media_uploaded: []
    }
  }

  async getPost(userId: string, postId: string): Promise<Post | null> {
    return testPostsStorage.find((p: Post) => p.id === postId && p.user_id === userId) || null
  }

  async getPostWithRelations(userId: string, postId: string): Promise<any> {
    const post = await this.getPost(userId, postId)
    if (!post) return null

    return {
      ...post,
      channel: {
        id: post.channel_id,
        title: 'Тестовый канал',
        telegram_channel_id: '@test_channel'
      },
      media: [],
      analytics: null
    }
  }

  async getPosts(userId: string, filters: PostFilters = {}): Promise<PostsResult> {
    let filteredPosts = testPostsStorage.filter((p: Post) => p.user_id === userId)

    if (filters.status) {
      filteredPosts = filteredPosts.filter((p: Post) => p.status === filters.status)
    }

    if (filters.channel_id) {
      filteredPosts = filteredPosts.filter((p: Post) => p.channel_id === filters.channel_id)
    }

    const limit = filters.limit || 20
    const offset = filters.offset || 0
    const paginatedPosts = filteredPosts.slice(offset, offset + limit)

    return {
      posts: paginatedPosts,
      total: filteredPosts.length,
      hasMore: offset + limit < filteredPosts.length
    }
  }

  async updatePost(userId: string, postId: string, data: UpdatePostInput): Promise<Post> {
    const postIndex = testPostsStorage.findIndex((p: Post) => p.id === postId && p.user_id === userId)
    if (postIndex === -1) {
      throw new Error('Post not found')
    }

    const updatedPost = {
      ...testPostsStorage[postIndex],
      ...data,
      updated_at: new Date().toISOString()
    } as Post

    testPostsStorage[postIndex] = updatedPost
    return updatedPost
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const postIndex = testPostsStorage.findIndex((p: Post) => p.id === postId && p.user_id === userId)
    if (postIndex === -1) {
      throw new Error('Post not found')
    }

    testPostsStorage.splice(postIndex, 1)
  }

  async schedulePost(userId: string, postId: string, scheduledAt: Date): Promise<Post> {
    return await this.updatePost(userId, postId, {
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString()
    })
  }

  async unschedulePost(userId: string, postId: string): Promise<Post> {
    return await this.updatePost(userId, postId, {
      status: 'draft',
      scheduled_at: null
    })
  }

  async uploadMedia(userId: string, postId: string, mediaData: any): Promise<PostMedia> {
    const media: PostMedia = {
      id: `media-${Math.random().toString(36).substr(2, 9)}`,
      post_id: postId,
      file_path: mediaData.file_url,
      file_name: mediaData.file_name,
      file_size: mediaData.file_size,
      file_type: mediaData.mime_type,
      sort_order: mediaData.sort_order || 0,
      created_at: new Date().toISOString()
    }

    return media
  }

  async removeMedia(userId: string, mediaId: string): Promise<void> {
    // Mock implementation - в реальности удаляем из БД
    console.log(`Removing media ${mediaId} for user ${userId}`)
  }

  async searchPosts(userId: string, query: string, limit: number = 20): Promise<Post[]> {
    return testPostsStorage
      .filter((p: Post) => p.user_id === userId)
      .filter((p: Post) => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.creative_text.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
  }

  async getPostsStats(userId: string): Promise<any> {
    const userPosts = testPostsStorage.filter((p: Post) => p.user_id === userId)
    
    return {
      total: userPosts.length,
      draft: userPosts.filter((p: Post) => p.status === 'draft').length,
      scheduled: userPosts.filter((p: Post) => p.status === 'scheduled').length,
      published: userPosts.filter((p: Post) => p.status === 'published').length,
      failed: userPosts.filter((p: Post) => p.status === 'failed').length,
      ord_pending: userPosts.filter((p: Post) => p.ord_status === 'pending').length,
      ord_registered: userPosts.filter((p: Post) => p.ord_status === 'registered').length,
      ord_failed: userPosts.filter((p: Post) => p.ord_status === 'failed').length
    }
  }

  async getSchedulerStats(userId: string): Promise<any> {
    const userPosts = testPostsStorage.filter((p: Post) => p.user_id === userId)
    const scheduledPosts = userPosts.filter((p: Post) => p.status === 'scheduled')
    
    return {
      scheduled: scheduledPosts.length,
      readyToPublish: 0,
      nextScheduledDate: scheduledPosts.length > 0 ? scheduledPosts[0].scheduled_at : null
    }
  }

  async reschedulePost(userId: string, postId: string, newScheduledAt: Date): Promise<Post> {
    return await this.updatePost(userId, postId, {
      scheduled_at: newScheduledAt.toISOString()
    })
  }
} 