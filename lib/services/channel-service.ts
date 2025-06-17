import { 
  ChannelConnectionRequest, 
  ChannelConnectionResponse,
  ChannelConnectionErrorCode,
  ChannelFilters,
  BotStatus,
  BotStatusCheckResult
} from '@/types/channel'
import { ChannelRepository } from '@/lib/repositories/channel-repository'
import { TelegramBotAPI } from '@/lib/integrations/telegram/bot-api'
import { validateChannelIdentifier, getChannelErrorMessage } from '@/utils/channel-validation'
import { TelegramError } from '@/types/telegram'

// Types for disconnect operation
interface ChannelDisconnectResult {
  success: boolean
  error?: string
  error_code?: ChannelConnectionErrorCode
  status?: number
}

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

      // 4. Проверка существующего подключения и поддержка reconnection
      const existingChannel = await this.channelRepository.getByTelegramId(
        chatInfo.id.toString(), 
        request.user_id
      )
      
      if (existingChannel) {
        // Если канал существует, проверяем - может он был отключен пользователем?
        const userChannelsResult = await this.channelRepository.getUserChannels(request.user_id)
        const isCurrentlyConnected = userChannelsResult.channels.some(ch => ch.id === existingChannel.id)
        
        if (isCurrentlyConnected) {
          // Канал активно подключен
          return {
            success: false,
            error: getChannelErrorMessage(ChannelConnectionErrorCode.ALREADY_CONNECTED),
            error_code: ChannelConnectionErrorCode.ALREADY_CONNECTED
          }
        } else {
          // Канал был отключен - переподключаем его
          console.log('🔄 Reconnecting previously disconnected channel:', existingChannel.id)
          await this.channelRepository.reconnectUserToChannel(existingChannel.id, request.user_id)
          
                     // Получаем обновленный канал
           const reconnectedChannel = await this.channelRepository.getById(existingChannel.id)
           
           if (!reconnectedChannel) {
             return {
               success: false,
               error: 'Ошибка при переподключении канала',
               error_code: ChannelConnectionErrorCode.VALIDATION_ERROR
             }
           }
           
           return {
             success: true,
             channel: reconnectedChannel,
             telegram_data: {
               chat: chatInfo
             }
           }
        }
      }

      // 5. Создание нового канала в БД
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

  /**
   * Отключение пользователя от канала (не удаляет канал из БД)
   * 
   * Логика:
   * - Канал остается в БД (telegram_channels)
   * - Удаляется связь пользователя с каналом (channel_permissions) 
   * - Канал исчезает из интерфейса пользователя
   * - Пользователь может заново подключить канал через обычный flow
   */
  async disconnectUserFromChannel(channelId: string, userId: string): Promise<ChannelDisconnectResult> {
    try {
      // 1. Проверяем существование канала
      const channel = await this.channelRepository.getById(channelId)
      if (!channel) {
        return {
          success: false,
          error: 'Канал не найден',
          error_code: ChannelConnectionErrorCode.CHANNEL_NOT_FOUND,
          status: 404
        }
      }

      // 2. Проверяем, что пользователь имеет доступ к каналу
      const userChannelsResult = await this.channelRepository.getUserChannels(userId)
      const hasAccess = userChannelsResult.channels.some(ch => ch.id === channelId)
      
      if (!hasAccess) {
        return {
          success: false,
          error: 'У вас нет доступа к этому каналу или он уже отключен',
          error_code: ChannelConnectionErrorCode.ACCESS_DENIED,
          status: 403
        }
      }

      // 3. В упрощенной системе удаляем связь пользователя с каналом
      // Если в будущем будет система channel_permissions, то удалим оттуда
      // Пока что в упрощенной системе проверяем user_id канала
      if (channel.user_id !== userId) {
        return {
          success: false,
          error: 'У вас нет прав на отключение этого канала',
          error_code: ChannelConnectionErrorCode.ACCESS_DENIED,
          status: 403
        }
      }

      // 4. Отключаем пользователя от канала (канал остается для других пользователей)
      // Канал остается в БД, но пользователь его больше не видит
      await this.channelRepository.disconnectUserFromChannel(channelId, userId)

      return {
        success: true
      }

    } catch (error) {
      console.error('Error disconnecting user from channel:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        error_code: ChannelConnectionErrorCode.VALIDATION_ERROR,
        status: 500
      }
    }
  }

  /**
   * Проверка статуса бота в канале
   * 
   * Определяет, добавлен ли бот в канал и имеет ли он необходимые права
   */
  async checkBotStatus(channelId: string, userId: string): Promise<BotStatusCheckResult> {
    try {
      // 1. Получаем канал и проверяем права пользователя
      const channel = await this.channelRepository.getById(channelId)
      if (!channel) {
        return {
          success: false,
          bot_status: 'bot_missing',
          error: 'Канал не найден',
          checked_at: new Date().toISOString()
        }
      }

      // 2. Проверяем доступ пользователя к каналу
      const userChannelsResult = await this.channelRepository.getUserChannels(userId)
      const hasAccess = userChannelsResult.channels.some(ch => ch.id === channelId)
      
      if (!hasAccess) {
        return {
          success: false,
          bot_status: 'bot_missing',
          error: 'У вас нет доступа к этому каналу',
          checked_at: new Date().toISOString()
        }
      }

      // 3. Получаем информацию о боте
      const botInfo = await this.telegramApi.getMe()
      
      // 4. Проверяем статус бота в канале
      try {
        const botMember = await this.telegramApi.getChatMember(
          channel.telegram_channel_id,
          botInfo.id
        )

        // Проверяем, что бот имеет права администратора
        const isAdmin = botMember.status === 'administrator' || botMember.status === 'creator'
        const canPost = botMember.can_post_messages || false

        let botStatus: BotStatus
        if (isAdmin && canPost) {
          botStatus = 'active'
        } else if (isAdmin) {
          // Бот админ, но не может постить - все равно считаем активным
          botStatus = 'active'
        } else {
          // Бот есть, но не админ
          botStatus = 'pending_bot'
        }

        // 5. Обновляем статус в БД
        await this.channelRepository.update(channelId, {
          bot_status: botStatus,
          bot_last_checked_at: new Date().toISOString()
        })

        return {
          success: true,
          bot_status: botStatus,
          bot_permissions: botMember,
          checked_at: new Date().toISOString()
        }

      } catch (telegramError) {
        console.log('Bot not found in channel or no access:', telegramError)
        
        // Определяем статус: если канал новый - pending_bot, если старый - bot_missing
        const isNewChannel = !channel.bot_last_checked_at
        const botStatus = isNewChannel ? 'pending_bot' : 'bot_missing'

        // Обновляем статус в БД
        await this.channelRepository.update(channelId, {
          bot_status: botStatus,
          bot_last_checked_at: new Date().toISOString()
        })

        return {
          success: true,
          bot_status: botStatus,
          error: isNewChannel 
            ? 'Бот ещё не добавлен в канал' 
            : 'Бот был удален из канала или потерял права',
          checked_at: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('Error checking bot status:', error)
      
      return {
        success: false,
        bot_status: 'bot_missing',
        error: error instanceof Error ? error.message : 'Ошибка при проверке статуса бота',
        checked_at: new Date().toISOString()
      }
    }
  }
} 