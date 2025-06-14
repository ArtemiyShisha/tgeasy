import { 
  ChannelConnectionRequest, 
  ChannelConnectionResponse,
  ChannelConnectionErrorCode,
  ChannelFilters
} from '@/types/channel'
import { ChannelRepository } from '@/lib/repositories/channel-repository'
import { TelegramBotAPI } from '@/lib/integrations/telegram/bot-api'
import { validateChannelIdentifier, getChannelErrorMessage } from '@/utils/channel-validation'
import { TelegramError } from '@/types/telegram'

export class ChannelService {
  private static instance: ChannelService
  private channelRepository: ChannelRepository
  private telegramApi: TelegramBotAPI

  private constructor() {
    this.channelRepository = ChannelRepository.getInstance()
    this.telegramApi = new TelegramBotAPI()
  }

  public static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService()
    }
    return ChannelService.instance
  }

  /**
   * Подключение канала (упрощенная версия)
   */
  async connectChannel(request: ChannelConnectionRequest): Promise<ChannelConnectionResponse> {
    try {
      // 0. Проверка токена Telegram Bot API
      try {
        await this.telegramApi.getMe()
      } catch (error) {
        console.error('Telegram Bot API authentication failed:', error)
        return {
          success: false,
          error: 'Ошибка аутентификации Telegram Bot API',
          error_code: ChannelConnectionErrorCode.TELEGRAM_API_ERROR
        }
      }

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

      // 4. Проверка существующего подключения для этого пользователя
      const existingChannel = await this.channelRepository.getByTelegramId(
        chatInfo.id.toString(), 
        request.user_id
      )
      if (existingChannel) {
        return {
          success: false,
          error: getChannelErrorMessage(ChannelConnectionErrorCode.ALREADY_CONNECTED),
          error_code: ChannelConnectionErrorCode.ALREADY_CONNECTED
        }
      }

      // 5. Создание канала в БД
      const channelData = {
        telegram_channel_id: chatInfo.id.toString(),
        channel_title: chatInfo.title || 'Без названия',
        channel_username: chatInfo.username || null,
        user_id: request.user_id,
        is_active: true
      }

      const channel = await this.channelRepository.create(channelData)

      return {
        success: true,
        channel: channel,
        telegram_data: {
          chat: chatInfo
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
   * Получение каналов пользователя
   */
  async getUserChannels(userId: string, filters: ChannelFilters = {}) {
    return this.channelRepository.getUserChannels(userId, filters)
  }

  /**
   * Получение канала по ID
   */
  async getChannelById(channelId: string, userId: string) {
    const channel = await this.channelRepository.getById(channelId)
    
    // Проверяем, что канал принадлежит пользователю
    if (!channel || channel.user_id !== userId) {
      return null
    }
    
    return channel
  }

  /**
   * Обновление канала
   */
  async updateChannel(channelId: string, userId: string, updateData: any) {
    // Проверка прав пользователя
    const channel = await this.channelRepository.getById(channelId)
    if (!channel || channel.user_id !== userId) {
      throw new Error('Канал не найден или у вас нет прав доступа')
    }

    // Обновление канала
    return this.channelRepository.update(channelId, updateData)
  }

  /**
   * Отключение канала
   */
  async disconnectChannel(channelId: string, userId: string): Promise<void> {
    // Проверка прав пользователя
    const channel = await this.channelRepository.getById(channelId)
    if (!channel || channel.user_id !== userId) {
      throw new Error('Канал не найден или у вас нет прав доступа')
    }

    // Soft delete канала
    await this.channelRepository.delete(channelId)
  }

  /**
   * Поиск каналов
   */
  async searchChannels(userId: string, query: string, limit: number = 20) {
    return this.channelRepository.search(query, userId, limit)
  }
} 