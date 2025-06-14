/**
 * Обработчик Telegram webhooks с фокусом на изменения прав пользователей
 * Включает валидацию подписи, event routing и обработку изменений прав
 */

import type {
  TelegramUpdate,
  TelegramChatMemberUpdated,
  TelegramMessage,
  TelegramCallbackQuery
} from '@/types/telegram';
import { validateWebhookSignature, handleTelegramError } from '@/utils/telegram-helpers';
import { getTelegramPermissionsAPI } from './permissions';

export interface WebhookProcessorConfig {
  secretToken?: string;
  enableLogging?: boolean;
  enablePermissionUpdates?: boolean;
}

export interface WebhookProcessingResult {
  success: boolean;
  eventType?: string;
  error?: string;
  permissionUpdated?: boolean;
}

export class TelegramWebhookProcessor {
  private readonly config: WebhookProcessorConfig;
  private readonly permissionsAPI: ReturnType<typeof getTelegramPermissionsAPI>;

  constructor(config: WebhookProcessorConfig = {}) {
    this.config = {
      enableLogging: true,
      enablePermissionUpdates: true,
      ...config
    };
    this.permissionsAPI = getTelegramPermissionsAPI();
  }

  /**
   * Основной метод обработки webhook
   */
  async processWebhook(
    body: string, 
    signature?: string
  ): Promise<WebhookProcessingResult> {
    try {
      // Валидация подписи если настроена
      if (this.config.secretToken && signature) {
        if (!validateWebhookSignature(body, signature, this.config.secretToken)) {
          return {
            success: false,
            error: 'Invalid webhook signature'
          };
        }
      }

      // Парсинг данных
      const update: TelegramUpdate = JSON.parse(body);
      
      if (this.config.enableLogging) {
        console.log('Received Telegram webhook:', {
          update_id: update.update_id,
          type: this.getUpdateType(update),
          timestamp: new Date().toISOString()
        });
      }

      // Роутинг событий
      const result = await this.routeEvent(update);
      
      if (this.config.enableLogging) {
        console.log('Webhook processing result:', result);
      }

      return result;

    } catch (error) {
      console.error('Error processing webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Маршрутизация событий по типам
   */
  private async routeEvent(update: TelegramUpdate): Promise<WebhookProcessingResult> {
    // Обработка изменений прав участников чата (ключевое для синхронизации прав)
    if (update.chat_member) {
      return this.handleChatMemberUpdate(update.chat_member);
    }

    // Обработка изменений прав самого бота
    if (update.my_chat_member) {
      return this.handleMyChatMemberUpdate(update.my_chat_member);
    }

    // Обработка сообщений в каналах
    if (update.channel_post) {
      return this.handleChannelPost(update.channel_post);
    }

    // Обработка редактирования сообщений в каналах
    if (update.edited_channel_post) {
      return this.handleEditedChannelPost(update.edited_channel_post);
    }

    // Обработка callback queries
    if (update.callback_query) {
      return this.handleCallbackQuery(update.callback_query);
    }

    // Обработка обычных сообщений
    if (update.message) {
      return this.handleMessage(update.message);
    }

    return {
      success: true,
      eventType: 'unhandled'
    };
  }

  /**
   * Обработка изменений участников чата (ключевая функция для синхронизации прав)
   */
  private async handleChatMemberUpdate(
    chatMemberUpdate: TelegramChatMemberUpdated
  ): Promise<WebhookProcessingResult> {
    try {
      const { chat, old_chat_member, new_chat_member } = chatMemberUpdate;
      
      // Проверяем, касается ли изменение администраторских прав
      const wasAdmin = old_chat_member.status === 'creator' || old_chat_member.status === 'administrator';
      const isAdmin = new_chat_member.status === 'creator' || new_chat_member.status === 'administrator';
      
      if (wasAdmin !== isAdmin || (isAdmin && this.hasPermissionChanges(old_chat_member, new_chat_member))) {
        if (this.config.enablePermissionUpdates) {
          // Триггерим синхронизацию прав для этого канала
          await this.triggerPermissionSync(chat.id.toString(), new_chat_member.user.id);
        }
        
        return {
          success: true,
          eventType: 'chat_member_update',
          permissionUpdated: true
        };
      }

      return {
        success: true,
        eventType: 'chat_member_update',
        permissionUpdated: false
      };

    } catch (error) {
      console.error('Error handling chat member update:', error);
      return {
        success: false,
        eventType: 'chat_member_update',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка изменений статуса самого бота
   */
  private async handleMyChatMemberUpdate(
    myChatMemberUpdate: TelegramChatMemberUpdated
  ): Promise<WebhookProcessingResult> {
    try {
      const { chat, old_chat_member, new_chat_member } = myChatMemberUpdate;
      
      // Логируем изменения статуса бота
      console.log('Bot status changed:', {
        chat_id: chat.id,
        chat_title: chat.title,
        old_status: old_chat_member.status,
        new_status: new_chat_member.status
      });

      // Если бот был удален из канала
      if (new_chat_member.status === 'left' || new_chat_member.status === 'kicked') {
        // Здесь можно добавить логику удаления канала из системы
        console.warn('Bot was removed from chat:', chat.id);
      }

      // Если бот получил/потерял права администратора
      const wasAdmin = old_chat_member.status === 'administrator';
      const isAdmin = new_chat_member.status === 'administrator';
      
      if (wasAdmin !== isAdmin) {
        console.log('Bot admin status changed:', { chat_id: chat.id, is_admin: isAdmin });
      }

      return {
        success: true,
        eventType: 'my_chat_member_update'
      };

    } catch (error) {
      console.error('Error handling my chat member update:', error);
      return {
        success: false,
        eventType: 'my_chat_member_update',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка новых постов в каналах
   */
  private async handleChannelPost(message: TelegramMessage): Promise<WebhookProcessingResult> {
    try {
      // Здесь можно добавить логику сбора аналитики постов
      console.log('New channel post:', {
        chat_id: message.chat.id,
        message_id: message.message_id,
        text_preview: message.text?.substring(0, 100)
      });

      return {
        success: true,
        eventType: 'channel_post'
      };

    } catch (error) {
      console.error('Error handling channel post:', error);
      return {
        success: false,
        eventType: 'channel_post',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка редактирования постов в каналах
   */
  private async handleEditedChannelPost(message: TelegramMessage): Promise<WebhookProcessingResult> {
    try {
      console.log('Channel post edited:', {
        chat_id: message.chat.id,
        message_id: message.message_id,
        edit_date: message.edit_date
      });

      return {
        success: true,
        eventType: 'edited_channel_post'
      };

    } catch (error) {
      console.error('Error handling edited channel post:', error);
      return {
        success: false,
        eventType: 'edited_channel_post',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка callback queries
   */
  private async handleCallbackQuery(
    callbackQuery: TelegramCallbackQuery
  ): Promise<WebhookProcessingResult> {
    try {
      console.log('Callback query received:', {
        from: callbackQuery.from.id,
        data: callbackQuery.data
      });

      // Здесь можно добавить логику обработки inline keyboard нажатий

      return {
        success: true,
        eventType: 'callback_query'
      };

    } catch (error) {
      console.error('Error handling callback query:', error);
      return {
        success: false,
        eventType: 'callback_query',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка обычных сообщений
   */
  private async handleMessage(message: TelegramMessage): Promise<WebhookProcessingResult> {
    try {
      // Обработка команд боту
      if (message.text?.startsWith('/')) {
        return this.handleBotCommand(message);
      }

      return {
        success: true,
        eventType: 'message'
      };

    } catch (error) {
      console.error('Error handling message:', error);
      return {
        success: false,
        eventType: 'message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка команд боту
   */
  private async handleBotCommand(message: TelegramMessage): Promise<WebhookProcessingResult> {
    const command = message.text?.split(' ')[0];
    
    switch (command) {
      case '/start':
        console.log('Start command received from:', message.from?.id);
        break;
      case '/help':
        console.log('Help command received from:', message.from?.id);
        break;
      default:
        console.log('Unknown command:', command);
    }

    return {
      success: true,
      eventType: 'bot_command'
    };
  }

  /**
   * Определяет тип обновления
   */
  private getUpdateType(update: TelegramUpdate): string {
    if (update.message) return 'message';
    if (update.edited_message) return 'edited_message';
    if (update.channel_post) return 'channel_post';
    if (update.edited_channel_post) return 'edited_channel_post';
    if (update.inline_query) return 'inline_query';
    if (update.chosen_inline_result) return 'chosen_inline_result';
    if (update.callback_query) return 'callback_query';
    if (update.shipping_query) return 'shipping_query';
    if (update.pre_checkout_query) return 'pre_checkout_query';
    if (update.poll) return 'poll';
    if (update.poll_answer) return 'poll_answer';
    if (update.my_chat_member) return 'my_chat_member';
    if (update.chat_member) return 'chat_member';
    if (update.chat_join_request) return 'chat_join_request';
    
    return 'unknown';
  }

  /**
   * Проверяет, изменились ли права пользователя
   */
  private hasPermissionChanges(oldMember: any, newMember: any): boolean {
    const permissions = [
      'can_post_messages',
      'can_edit_messages', 
      'can_delete_messages',
      'can_change_info',
      'can_invite_users'
    ];

    return permissions.some(permission => 
      oldMember[permission] !== newMember[permission]
    );
  }

  /**
   * Триггерит синхронизацию прав для канала
   */
  private async triggerPermissionSync(chatId: string, userId: number): Promise<void> {
    try {
      // Здесь будет вызов к сервису синхронизации прав
      console.log('Triggering permission sync for chat:', chatId, 'user:', userId);
      
      // В реальной реализации здесь будет вызов к channel-permissions-service
      // await channelPermissionsService.syncChannelPermissions(chatId);
      
    } catch (error) {
      console.error('Error triggering permission sync:', error);
    }
  }
}

/**
 * Статические методы для удобства использования
 */
export class WebhookHelpers {
  /**
   * Быстрая обработка webhook с дефолтными настройками
   */
  static async processWebhook(
    body: string, 
    signature?: string,
    secretToken?: string
  ): Promise<WebhookProcessingResult> {
    const processor = new TelegramWebhookProcessor({ 
      secretToken,
      enableLogging: process.env.NODE_ENV === 'development'
    });
    
    return processor.processWebhook(body, signature);
  }

  /**
   * Валидирует структуру webhook данных
   */
  static validateWebhookData(data: any): data is TelegramUpdate {
    return data && typeof data === 'object' && typeof data.update_id === 'number';
  }

  /**
   * Извлекает информацию о чате из различных типов обновлений
   */
  static extractChatInfo(update: TelegramUpdate): { chatId?: number; chatType?: string } | null {
    const message = update.message || update.edited_message || 
                   update.channel_post || update.edited_channel_post;
    
    if (message) {
      return {
        chatId: message.chat.id,
        chatType: message.chat.type
      };
    }

    if (update.chat_member || update.my_chat_member) {
      const chatMember = update.chat_member || update.my_chat_member;
      return {
        chatId: chatMember?.chat.id,
        chatType: chatMember?.chat.type
      };
    }

    return null;
  }

  /**
   * Проверяет, касается ли обновление прав администраторов
   */
  static isPermissionRelatedUpdate(update: TelegramUpdate): boolean {
    return !!(update.chat_member || update.my_chat_member);
  }
}

// Экспорт singleton instance для простого использования
let defaultProcessor: TelegramWebhookProcessor | null = null;

export function getDefaultWebhookProcessor(): TelegramWebhookProcessor {
  if (!defaultProcessor) {
    defaultProcessor = new TelegramWebhookProcessor({
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
      enableLogging: process.env.NODE_ENV === 'development',
      enablePermissionUpdates: true
    });
  }
  return defaultProcessor;
} 