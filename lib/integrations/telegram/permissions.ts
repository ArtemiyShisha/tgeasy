/**
 * Интеграция с Telegram API для работы с правами доступа пользователей
 */

import type {
  TelegramChatMember,
  TelegramChatAdministrator,
} from '@/types/channel-permissions';
import { validateTelegramChatMember, filterChannelAdmins } from '@/utils/telegram-permissions';

// Базовый интерфейс для Telegram API response
interface TelegramApiResponse<T = any> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export class TelegramPermissionsAPI {
  private readonly botToken: string;
  private readonly baseUrl = 'https://api.telegram.org/bot';

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }
  }

  /**
   * Получает информацию о члене чата (пользователе в канале)
   */
  async getChatMember(chatId: string, userId: number): Promise<TelegramChatMember | null> {
    try {
      const response = await this.makeApiCall<TelegramChatMember>('getChatMember', {
        chat_id: chatId,
        user_id: userId,
      });

      if (!response.ok || !response.result) {
        console.error(`Failed to get chat member: ${response.description}`);
        return null;
      }

      const member = response.result;
      if (!validateTelegramChatMember(member)) {
        console.error('Invalid chat member data received from Telegram API');
        return null;
      }

      return member;
    } catch (error) {
      console.error('Error getting chat member:', error);
      return null;
    }
  }

  /**
   * Получает список всех администраторов канала
   */
  async getChatAdministrators(chatId: string): Promise<TelegramChatAdministrator[]> {
    try {
      const response = await this.makeApiCall<TelegramChatMember[]>('getChatAdministrators', {
        chat_id: chatId,
      });

      if (!response.ok || !response.result) {
        console.error(`Failed to get chat administrators: ${response.description}`);
        return [];
      }

      const members = response.result;
      if (!Array.isArray(members)) {
        console.error('Invalid administrators data received from Telegram API');
        return [];
      }

      // Валидируем и фильтруем только администраторов
      const validMembers = members.filter(validateTelegramChatMember);
      return filterChannelAdmins(validMembers);
    } catch (error) {
      console.error('Error getting chat administrators:', error);
      return [];
    }
  }

  /**
   * Проверяет, является ли пользователь администратором канала
   */
  async isUserChannelAdmin(chatId: string, userId: number): Promise<boolean> {
    const member = await this.getChatMember(chatId, userId);
    if (!member) return false;
    
    return member.status === 'creator' || member.status === 'administrator';
  }

  /**
   * Проверяет, является ли пользователь создателем канала
   */
  async isUserChannelCreator(chatId: string, userId: number): Promise<boolean> {
    const member = await this.getChatMember(chatId, userId);
    if (!member) return false;
    
    return member.status === 'creator';
  }

  /**
   * Получает информацию о канале
   */
  async getChat(chatId: string): Promise<any> {
    try {
      const response = await this.makeApiCall('getChat', {
        chat_id: chatId,
      });

      if (!response.ok || !response.result) {
        console.error(`Failed to get chat info: ${response.description}`);
        return null;
      }

      return response.result;
    } catch (error) {
      console.error('Error getting chat info:', error);
      return null;
    }
  }

  /**
   * Проверяет, существует ли канал и доступен ли он боту
   */
  async isChannelAccessible(chatId: string): Promise<boolean> {
    try {
      const chat = await this.getChat(chatId);
      return chat !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверяет, является ли бот администратором канала
   */
  async isBotChannelAdmin(chatId: string): Promise<boolean> {
    try {
      const botInfo = await this.getMe();
      if (!botInfo?.id) return false;

      return await this.isUserChannelAdmin(chatId, botInfo.id);
    } catch (error) {
      console.error('Error checking bot admin status:', error);
      return false;
    }
  }

  /**
   * Получает информацию о боте
   */
  async getMe(): Promise<{ id: number; username?: string; first_name: string } | null> {
    try {
      const response = await this.makeApiCall('getMe');
      
      if (!response.ok || !response.result) {
        console.error(`Failed to get bot info: ${response.description}`);
        return null;
      }

      return response.result;
    } catch (error) {
      console.error('Error getting bot info:', error);
      return null;
    }
  }

  /**
   * Батч получение информации о пользователях канала
   */
  async getBatchChatMembers(chatId: string, userIds: number[]): Promise<Map<number, TelegramChatMember>> {
    const members = new Map<number, TelegramChatMember>();
    
    // Получаем информацию о пользователях с задержкой для избежания rate limiting
    for (const userId of userIds) {
      const member = await this.getChatMember(chatId, userId);
      if (member) {
        members.set(userId, member);
      }
      
      // Задержка 100ms между запросами для соблюдения rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return members;
  }

  /**
   * Выполняет запрос к Telegram Bot API
   */
  private async makeApiCall<T = any>(
    method: string,
    params?: Record<string, any>
  ): Promise<TelegramApiResponse<T>> {
    const url = `${this.baseUrl}${this.botToken}/${method}`;
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (params) {
      requestOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Обрабатывает ошибки Telegram API и конвертирует их в понятные коды
   */
  private handleTelegramError(error: any): string {
    if (!error?.description) return 'UNKNOWN_ERROR';

    const description = error.description.toLowerCase();
    
    if (description.includes('chat not found')) return 'CHAT_NOT_FOUND';
    if (description.includes('user not found')) return 'USER_NOT_FOUND';
    if (description.includes('bot is not a member')) return 'BOT_NOT_MEMBER';
    if (description.includes('not enough rights')) return 'INSUFFICIENT_RIGHTS';
    if (description.includes('too many requests')) return 'RATE_LIMIT_EXCEEDED';
    if (description.includes('bad request')) return 'BAD_REQUEST';
    if (description.includes('forbidden')) return 'FORBIDDEN';

    return 'TELEGRAM_API_ERROR';
  }

  /**
   * Создает экземпляр API с обработкой ошибок
   */
  static create(botToken?: string): TelegramPermissionsAPI {
    return new TelegramPermissionsAPI(botToken);
  }
}

// Синглтон экземпляр для использования в приложении
let telegramPermissionsAPI: TelegramPermissionsAPI | null = null;

export function getTelegramPermissionsAPI(): TelegramPermissionsAPI {
  if (!telegramPermissionsAPI) {
    telegramPermissionsAPI = TelegramPermissionsAPI.create();
  }
  return telegramPermissionsAPI;
}

/**
 * Утилитарные функции для работы с правами через Telegram API
 */

/**
 * Проверяет доступность канала и права бота
 */
export async function validateChannelAccess(chatId: string): Promise<{
  accessible: boolean;
  botIsAdmin: boolean;
  error?: string;
}> {
  const api = getTelegramPermissionsAPI();
  
  try {
    const accessible = await api.isChannelAccessible(chatId);
    if (!accessible) {
      return {
        accessible: false,
        botIsAdmin: false,
        error: 'CHAT_NOT_FOUND'
      };
    }

    const botIsAdmin = await api.isBotChannelAdmin(chatId);
    
    return {
      accessible: true,
      botIsAdmin,
      error: botIsAdmin ? undefined : 'BOT_NOT_ADMIN'
    };
  } catch (error) {
    return {
      accessible: false,
      botIsAdmin: false,
      error: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Получает права конкретного пользователя в канале
 */
export async function getUserChannelPermissions(
  chatId: string,
  userId: number
): Promise<TelegramChatMember | null> {
  const api = getTelegramPermissionsAPI();
  return await api.getChatMember(chatId, userId);
}

/**
 * Получает всех администраторов канала
 */
export async function getChannelAdministrators(
  chatId: string
): Promise<TelegramChatAdministrator[]> {
  const api = getTelegramPermissionsAPI();
  return await api.getChatAdministrators(chatId);
} 