import { 
  ChannelConnectionRequest, 
  ChannelConnectionResponse,
  ChannelConnectionErrorCode,
  ChannelWithPermissions,
  ChannelFilters,
  ChannelSyncResult,
  ChannelVerification
} from '@/types/channel'
import { ChannelRepository } from '@/lib/repositories/channel-repository'
import { TelegramBotAPI } from '@/lib/integrations/telegram/bot-api'
import { getChannelPermissionsService } from '@/lib/services/channel-permissions-service'
import { validateChannelIdentifier, normalizeChannelIdentifier, getChannelErrorMessage } from '@/utils/channel-validation'
import { TelegramError } from '@/types/telegram'

export class ChannelService {
  private static instance: ChannelService
  private channelRepository: ChannelRepository
  private telegramApi: TelegramBotAPI
  private permissionsService: ReturnType<typeof getChannelPermissionsService>

  private constructor() {
    this.channelRepository = ChannelRepository.getInstance()
    this.telegramApi = new TelegramBotAPI()
    this.permissionsService = getChannelPermissionsService()
  }

  public static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService()
    }
    return ChannelService.instance
  }

  /**
   * Подключение канала с автоматической синхронизацией прав
   */
  async connectChannel(request: ChannelConnectionRequest): Promise<ChannelConnectionResponse> {
    try {
      // 1. Валидация идентификатора
      const validation = validateChannelIdentifier(request.identifier)
      if (!validation.is_valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          error_code: ChannelConnectionErrorCode.INVALID_IDENTIFIER
        }
      }

      const normalizedId = validation.parsed_identifier

      // 2. Получение информации о канале из Telegram
      const chatInfo = await this.telegramApi.getChat(normalizedId)
      if (!chatInfo) {
        return {
          success: false,
          error: getChannelErrorMessage(ChannelConnectionErrorCode.CHANNEL_NOT_FOUND),
          error_code: ChannelConnectionErrorCode.CHANNEL_NOT_FOUND
        }
      }

      // 3. Проверка типа чата (должен быть канал)
      if (chatInfo.type !== 'channel') {
        return {
          success: false,
          error: 'Указанный идентификатор не является каналом',
          error_code: ChannelConnectionErrorCode.VALIDATION_ERROR
        }
      }

      // 4. Проверка существующего подключения
      const existingChannel = await this.channelRepository.getByTelegramId(chatInfo.id.toString())
      if (existingChannel) {
        return {
          success: false,
          error: getChannelErrorMessage(ChannelConnectionErrorCode.ALREADY_CONNECTED),
          error_code: ChannelConnectionErrorCode.ALREADY_CONNECTED
        }
      }

      // 5. Проверка прав бота
      const botMember = await this.telegramApi.getChatMember(normalizedId, parseInt(process.env.TELEGRAM_BOT_ID!))
      if (!botMember || !['creator', 'administrator'].includes(botMember.status)) {
        return {
          success: false,
          error: getChannelErrorMessage(ChannelConnectionErrorCode.BOT_NOT_ADMIN),
          error_code: ChannelConnectionErrorCode.BOT_NOT_ADMIN
        }
      }

      // 6. Проверка прав пользователя
      const userMember = await this.telegramApi.getChatMember(normalizedId, parseInt(request.user_id))
      if (!userMember || !['creator', 'administrator'].includes(userMember.status)) {
        return {
          success: false,
          error: getChannelErrorMessage(ChannelConnectionErrorCode.USER_NOT_ADMIN),
          error_code: ChannelConnectionErrorCode.USER_NOT_ADMIN
        }
      }

      // 7. Создание канала в БД
      const channelData = {
        telegram_channel_id: chatInfo.id.toString(),
        channel_title: chatInfo.title || 'Без названия',
        channel_username: chatInfo.username || null,
        user_id: request.user_id,
        is_active: true
      }

      const channel = await this.channelRepository.create(channelData)

      // 8. Синхронизация прав пользователя
      await this.permissionsService.syncChannelPermissions({ channel_id: channel.id })

      // 9. Получение канала с правами
      const channelWithPermissions = await this.channelRepository.getByIdWithPermissions(
        channel.id, 
        request.user_id
      )

      return {
        success: true,
        channel: channelWithPermissions!,
        telegram_data: {
          chat: chatInfo,
          user_member: userMember,
          bot_member: botMember
        }
      }

    } catch (error) {
      console.error('Channel connection error:', error)
      
      if (error instanceof TelegramError) {
        return {
          success: false,
          error: `Ошибка Telegram API: ${error.message}`,
          error_code: ChannelConnectionErrorCode.TELEGRAM_API_ERROR
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        error_code: ChannelConnectionErrorCode.VALIDATION_ERROR
      }
    }
  }

  /**
   * Получение каналов пользователя с фильтрацией по правам
   */
  async getUserAccessibleChannels(userId: string, filters: ChannelFilters = {}) {
    return this.channelRepository.getUserAccessibleChannels(userId, filters)
  }

  /**
   * Получение канала по ID с проверкой прав
   */
  async getChannelById(channelId: string, userId: string): Promise<ChannelWithPermissions | null> {
    return this.channelRepository.getByIdWithPermissions(channelId, userId)
  }

  /**
   * Обновление канала
   */
  async updateChannel(channelId: string, userId: string, updateData: any): Promise<ChannelWithPermissions | null> {
    // Проверка прав пользователя
    const channel = await this.channelRepository.getByIdWithPermissions(channelId, userId)
    if (!channel) {
      throw new Error('Канал не найден или у вас нет прав доступа')
    }

    // Проверка прав на изменение настроек канала
    if (!channel.user_permissions?.can_change_info && channel.user_permissions?.telegram_status !== 'creator') {
      throw new Error('У вас нет прав на изменение настроек канала')
    }

    // Обновление канала
    await this.channelRepository.update(channelId, updateData)
    
    // Возврат обновленного канала
    return this.channelRepository.getByIdWithPermissions(channelId, userId)
  }

  /**
   * Отключение канала
   */
  async disconnectChannel(channelId: string, userId: string): Promise<void> {
    // Проверка прав пользователя
    const channel = await this.channelRepository.getByIdWithPermissions(channelId, userId)
    if (!channel) {
      throw new Error('Канал не найден или у вас нет прав доступа')
    }

    // Только создатель может отключить канал
    if (channel.user_permissions?.telegram_status !== 'creator') {
      throw new Error('Только создатель канала может его отключить')
    }

    // Soft delete канала
    await this.channelRepository.delete(channelId)
  }

  /**
   * Синхронизация прав канала
   */
  async syncChannelPermissions(channelId: string, userId: string): Promise<ChannelSyncResult> {
    try {
      // Проверка доступа к каналу
      const channel = await this.channelRepository.getByIdWithPermissions(channelId, userId)
      if (!channel) {
        throw new Error('Канал не найден или у вас нет прав доступа')
      }

      // Синхронизация прав
      const syncResult = await this.permissionsService.syncChannelPermissions({ channel_id: channelId })

      return {
        success: syncResult.success,
        channel_id: channelId,
        permissions_updated: syncResult.synced_permissions > 0,
        stats_updated: false, // TODO: implement stats sync
        errors: syncResult.errors,
        sync_timestamp: new Date().toISOString()
      }

    } catch (error) {
      return {
        success: false,
        channel_id: channelId,
        permissions_updated: false,
        stats_updated: false,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка'],
        sync_timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Проверка статуса канала и доступности
   */
  async verifyChannelStatus(channelId: string, userId: string): Promise<ChannelVerification> {
    try {
      // Получение канала из БД
      const channel = await this.channelRepository.getByIdWithPermissions(channelId, userId)
      if (!channel) {
        throw new Error('Канал не найден или у вас нет прав доступа')
      }

      // Проверка доступности в Telegram
      const chatInfo = await this.telegramApi.getChat(channel.telegram_channel_id)
      const isAccessible = !!chatInfo

      let botIsAdmin = false
      let userPermissions = null
      let memberCount = 0

      if (isAccessible) {
        // Проверка прав бота
        try {
          const botMember = await this.telegramApi.getChatMember(
            channel.telegram_channel_id, 
            parseInt(process.env.TELEGRAM_BOT_ID!)
          )
          botIsAdmin = botMember && ['creator', 'administrator'].includes(botMember.status)
        } catch {
          botIsAdmin = false
        }

        // Получение прав пользователя
        try {
          userPermissions = await this.permissionsService.getUserChannelPermissions(userId, channelId)
        } catch {
          userPermissions = null
        }

        // Подсчет участников (если есть права)
        try {
          const administrators = await this.telegramApi.getChatAdministrators(channel.telegram_channel_id)
          memberCount = administrators?.length || 0
        } catch {
          memberCount = 0
        }
      }

      // Обновление статуса в БД
      await this.channelRepository.updateStatus(
        channelId,
        isAccessible && botIsAdmin,
        isAccessible ? undefined : 'Канал недоступен или бот не является администратором'
      )

      return {
        channel_id: channelId,
        is_accessible: isAccessible,
        bot_is_admin: botIsAdmin,
        user_permissions: userPermissions,
        member_count: memberCount,
        last_verified_at: new Date().toISOString()
      }

    } catch (error) {
      await this.channelRepository.updateStatus(
        channelId,
        false,
        error instanceof Error ? error.message : 'Ошибка проверки статуса'
      )

      return {
        channel_id: channelId,
        is_accessible: false,
        bot_is_admin: false,
        user_permissions: null,
        member_count: 0,
        last_verified_at: new Date().toISOString(),
        verification_error: error instanceof Error ? error.message : 'Ошибка проверки статуса'
      }
    }
  }

  /**
   * Поиск каналов пользователя
   */
  async searchChannels(userId: string, query: string, limit: number = 20): Promise<ChannelWithPermissions[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    return this.channelRepository.search(query.trim(), userId, limit)
  }

  /**
   * Получение статистики канала
   */
  async getChannelStats(channelId: string, userId: string) {
    // Проверка доступа
    const channel = await this.channelRepository.getByIdWithPermissions(channelId, userId)
    if (!channel) {
      throw new Error('Канал не найден или у вас нет прав доступа')
    }

    return this.channelRepository.getChannelStats(channelId)
  }

  /**
   * Массовая синхронизация каналов пользователя
   */
  async bulkSyncUserChannels(userId: string): Promise<ChannelSyncResult[]> {
    const { channels } = await this.channelRepository.getUserAccessibleChannels(userId, { limit: 100 })
    
    const results: ChannelSyncResult[] = []
    
    for (const channel of channels) {
      try {
        const result = await this.syncChannelPermissions(channel.id, userId)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          channel_id: channel.id,
          permissions_updated: false,
          stats_updated: false,
          errors: [error instanceof Error ? error.message : 'Ошибка синхронизации'],
          sync_timestamp: new Date().toISOString()
        })
      }
    }

    return results
  }
} 