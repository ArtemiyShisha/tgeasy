import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Channel, ChannelFilters, ChannelStats } from '@/types/channel'
import { ChannelPermission } from '@/types/channel-permissions'

type ChannelRow = Database['public']['Tables']['telegram_channels']['Row']
type ChannelInsert = Database['public']['Tables']['telegram_channels']['Insert']
type ChannelUpdate = Database['public']['Tables']['telegram_channels']['Update']

// Simplified channel type without permissions
type SimpleChannel = Channel

export class ChannelRepository {
  private static instance: ChannelRepository
  private supabase: ReturnType<typeof createClient<Database>>

  private constructor() {
    // Use anon key directly since service role key is invalid
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log('ChannelRepository: Using anon key for Supabase connection')
    
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
  }

  public static getInstance(): ChannelRepository {
    if (!ChannelRepository.instance) {
      ChannelRepository.instance = new ChannelRepository()
    }
    return ChannelRepository.instance
  }

  /**
   * Создание канала
   */
  async create(channelData: ChannelInsert): Promise<Channel> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .insert({
        ...channelData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create channel: ${error.message}`)
    }

    return data
  }

  /**
   * Получение канала по ID
   */
  async getById(id: string): Promise<Channel | null> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get channel: ${error.message}`)
    }

    return data
  }

  /**
   * Получение канала по Telegram ID (ищет любой канал с этим ID, включая отключенные)
   */
  async getByTelegramId(telegramChannelId: string, userId?: string): Promise<Channel | null> {
    let query = this.supabase
      .from('telegram_channels')
      .select('*')
      .eq('telegram_channel_id', telegramChannelId)

    // Если указан userId, ищем канал этого пользователя ИЛИ любой существующий канал
    // (для reconnection нужно найти канал даже если он отключен)
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get channel by Telegram ID: ${error.message}`)
    }

    return data
  }

  /**
   * Получение каналов пользователя (упрощенная версия без прав)
   */
  async getUserChannels(userId: string, filters: ChannelFilters = {}): Promise<{
    channels: Channel[]
    total: number
  }> {
    let query = this.supabase
      .from('telegram_channels')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('disconnected_by_users', 'cs', `{${userId}}`)

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      if (filters.status.includes('active')) {
        query = query.eq('is_active', true)
      } else if (filters.status.includes('inactive')) {
        query = query.eq('is_active', false)
      }
    }

    if (filters.search) {
      query = query.or(`channel_title.ilike.%${filters.search}%,channel_username.ilike.%${filters.search}%`)
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before)
    }

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to get user channels: ${error.message}`)
    }

    return {
      channels: data || [],
      total: count || 0
    }
  }

  /**
   * Обновление канала
   */
  async update(id: string, updateData: ChannelUpdate): Promise<Channel> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update channel: ${error.message}`)
    }

    return data
  }

  /**
   * Удаление канала (soft delete через is_active)
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_channels')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete channel: ${error.message}`)
    }
  }

  /**
   * Физическое удаление канала и связанных данных
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_channels')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to hard delete channel: ${error.message}`)
    }
  }

  /**
   * Отключение пользователя от канала (добавляет в список отключенных)
   */
  async disconnectUserFromChannel(channelId: string, userId: string): Promise<void> {
    // Получаем текущий список отключенных пользователей
    const { data: channel, error: fetchError } = await this.supabase
      .from('telegram_channels')
      .select('disconnected_by_users')
      .eq('id', channelId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch channel: ${fetchError.message}`)
    }

    // Добавляем пользователя в список отключенных (если его там еще нет)
    const disconnectedUsers = channel.disconnected_by_users || []
    if (!disconnectedUsers.includes(userId)) {
      disconnectedUsers.push(userId)

      const { error: updateError } = await this.supabase
        .from('telegram_channels')
        .update({
          disconnected_by_users: disconnectedUsers,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId)

      if (updateError) {
        throw new Error(`Failed to disconnect user from channel: ${updateError.message}`)
      }
    }
  }

  /**
   * Повторное подключение пользователя к каналу (удаляет из списка отключенных)
   */
  async reconnectUserToChannel(channelId: string, userId: string): Promise<void> {
    // Получаем текущий список отключенных пользователей
    const { data: channel, error: fetchError } = await this.supabase
      .from('telegram_channels')
      .select('disconnected_by_users')
      .eq('id', channelId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch channel: ${fetchError.message}`)
    }

    // Удаляем пользователя из списка отключенных
    const disconnectedUsers = (channel.disconnected_by_users || [])
      .filter((id: string) => id !== userId)

    const { error: updateError } = await this.supabase
      .from('telegram_channels')
      .update({
        disconnected_by_users: disconnectedUsers,
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId)

    if (updateError) {
      throw new Error(`Failed to reconnect user to channel: ${updateError.message}`)
    }
  }

  /**
   * Проверка существования канала по Telegram ID для пользователя
   */
  async existsByTelegramId(telegramChannelId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .select('id')
      .eq('telegram_channel_id', telegramChannelId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check channel existence: ${error.message}`)
    }

    return !!data
  }

  /**
   * Получение статистики канала
   */
  async getChannelStats(channelId: string): Promise<ChannelStats | null> {
    const { data, error } = await this.supabase
      .rpc('get_channel_stats', {
        channel_uuid: channelId,
        days_back: 30
      })

    if (error) {
      throw new Error(`Failed to get channel stats: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return null
    }

    const stats = data[0]
    
    return {
      channel_id: channelId,
      posts_count: stats.total_posts || 0,
      total_views: stats.total_views || 0,
      total_clicks: stats.total_clicks || 0,
      avg_engagement_rate: stats.avg_ctr || 0
    }
  }

  /**
   * Обновление статуса канала и сообщения об ошибке
   */
  async updateStatus(id: string, isActive: boolean, errorMessage?: string): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_channels')
      .update({
        is_active: isActive,
        error_message: errorMessage || null,
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update channel status: ${error.message}`)
    }
  }

  /**
   * Получение каналов для мониторинга (неактивные или с ошибками)
   */
  async getChannelsForMonitoring(limit: number = 50): Promise<Channel[]> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .select('*')
      .or('is_active.eq.false,error_message.is.not.null')
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get channels for monitoring: ${error.message}`)
    }

    return data || []
  }

  /**
   * Получение каналов пользователя без прав (для отладки)
   */
  async getUserChannelsWithoutPermissions(userId: string): Promise<Channel[]> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .select(`
        *,
        channel_permissions!left(id)
      `)
      .eq('user_id', userId)
      .is('channel_permissions.id', null)

    if (error) {
      throw new Error(`Failed to get channels without permissions: ${error.message}`)
    }

    return (data || []).map((item: any) => {
      const { channel_permissions, ...channel } = item
      return channel
    })
  }

  /**
   * Batch обновление last_checked_at для массива каналов
   */
  async batchUpdateLastChecked(channelIds: string[]): Promise<void> {
    if (channelIds.length === 0) return

    const { error } = await this.supabase
      .from('telegram_channels')
      .update({
        last_checked_at: new Date().toISOString()
      })
      .in('id', channelIds)

    if (error) {
      throw new Error(`Failed to batch update last checked: ${error.message}`)
    }
  }

  /**
   * Поиск каналов по тексту
   */
  async search(query: string, userId: string, limit: number = 20): Promise<Channel[]> {
    const { data, error } = await this.supabase
      .from('telegram_channels')
      .select(`
        *,
        channel_permissions!inner(
          id,
          telegram_status,
          can_post_messages,
          can_edit_messages,
          can_delete_messages,
          can_change_info,
          can_invite_users,
          last_synced_at,
          sync_error
        )
      `)
      .eq('channel_permissions.user_id', userId)
      .or(`channel_title.ilike.%${query}%,channel_username.ilike.%${query}%`)
      .order('channel_title')
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search channels: ${error.message}`)
    }

    return (data || []).map((channel: any) => {
      const permissions = channel.channel_permissions?.[0]
      return {
        ...channel,
        user_permissions: permissions || null,
        channel_permissions: undefined
      }
    })
  }
} 