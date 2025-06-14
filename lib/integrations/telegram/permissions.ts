/**
 * Интеграция с Telegram API для работы с правами доступа пользователей
 * ОБНОВЛЕНО для Задачи 11: добавлены новые функции синхронизации прав
 */

import type {
  TelegramChatMember,
  TelegramChatAdministrator,
  ChannelPermission,
  SyncChannelPermissionsResponse,
  TelegramUserStatus,
  PermissionCheckResult,
} from '@/types/channel-permissions';
import { validateTelegramChatMember, filterChannelAdmins } from '@/utils/telegram-permissions';
import { getTelegramBotAPI } from './bot-api';

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
   * НОВАЯ ФУНКЦИЯ: Синхронизирует права доступа канала
   * Получает всех администраторов и возвращает данные для сохранения в БД
   */
  async syncChannelPermissions(channelId: string): Promise<SyncChannelPermissionsResponse> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedPermissions = 0;
    let removedPermissions = 0;

    try {
      // Получаем всех администраторов канала
      const administrators = await this.getChatAdministrators(channelId);
      
      if (administrators.length === 0) {
        return {
          success: false,
          channel_id: channelId,
          synced_permissions: 0,
          removed_permissions: 0,
          errors: ['No administrators found or channel not accessible'],
          sync_duration_ms: Date.now() - startTime,
          last_synced_at: new Date()
        };
      }

      syncedPermissions = administrators.length;

      return {
        success: true,
        channel_id: channelId,
        synced_permissions: syncedPermissions,
        removed_permissions: removedPermissions,
        errors,
        sync_duration_ms: Date.now() - startTime,
        last_synced_at: new Date()
      };

    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        channel_id: channelId,
        synced_permissions: syncedPermissions,
        removed_permissions: removedPermissions,
        errors,
        sync_duration_ms: Date.now() - startTime,
        last_synced_at: new Date()
      };
    }
  }

  /**
   * НОВАЯ ФУНКЦИЯ: Получает права пользователя в канале
   */
  async getUserChannelPermissions(userId: number, channelId: string): Promise<TelegramChatMember | null> {
    return this.getChatMember(channelId, userId);
  }

  /**
   * НОВАЯ ФУНКЦИЯ: Маппит права Telegram в права TGeasy
   */
  mapTelegramPermissions(telegramMember: TelegramChatMember): Partial<ChannelPermission> {
    const status = telegramMember.status as TelegramUserStatus;
    
    if (status !== 'creator' && status !== 'administrator') {
      throw new Error('User is not an administrator');
    }

    return {
      telegram_status: status,
      can_post_messages: telegramMember.can_post_messages ?? true,
      can_edit_messages: telegramMember.can_edit_messages ?? (status === 'creator'),
      can_delete_messages: telegramMember.can_delete_messages ?? (status === 'creator'),
      can_change_info: telegramMember.can_change_info ?? (status === 'creator'),
      can_invite_users: telegramMember.can_invite_users ?? (status === 'creator'),
      last_synced_at: new Date()
    };
  }

  /**
   * НОВАЯ ФУНКЦИЯ: Проверяет, является ли пользователь администратором канала
   */
  async isUserChannelAdmin(userId: number, channelId: string): Promise<PermissionCheckResult> {
    try {
      const member = await this.getChatMember(channelId, userId);
      
      if (!member) {
        return {
          has_permission: false,
          reason: 'User not found in channel',
          permission_level: 'none'
        };
      }

      const isAdmin = member.status === 'creator' || member.status === 'administrator';
      
      return {
        has_permission: isAdmin,
        reason: isAdmin ? undefined : 'User is not an administrator',
        permission_level: member.status === 'creator' ? 'creator' : 
                          member.status === 'administrator' ? 'administrator' : 'none',
        telegram_status: member.status as TelegramUserStatus
      };

    } catch (error) {
      return {
        has_permission: false,
        reason: `Error checking permissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        permission_level: 'none'
      };
    }
  }

  /**
   * Проверяет, является ли пользователь администратором канала
   */
  async isUserChannelAdmin_OLD(chatId: string, userId: number): Promise<boolean> {
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

      return await this.isUserChannelAdmin_OLD(chatId, botInfo.id);
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
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params ? JSON.stringify(params) : undefined,
      });

      const data = await response.json() as TelegramApiResponse<T>;
      
      if (!data.ok) {
        console.error(`Telegram API error [${method}]:`, {
          error_code: data.error_code,
          description: data.description,
          params
        });
      }

      return data;

    } catch (error) {
      console.error(`Network error calling Telegram API [${method}]:`, error);
      return {
        ok: false,
        error_code: 500,
        description: 'Network error'
      };
    }
  }

  /**
   * Обрабатывает ошибки Telegram API
   */
  private handleTelegramError(error: any): string {
    if (error && typeof error === 'object') {
      if (error.error_code && error.description) {
        return `Telegram API Error ${error.error_code}: ${error.description}`;
      }
      if (error.message) {
        return error.message;
      }
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Создает instance класса с проверкой token
   */
  static create(botToken?: string): TelegramPermissionsAPI {
    const instance = new TelegramPermissionsAPI(botToken);
    // Можно добавить дополнительную валидацию token здесь
    return instance;
  }
}

/**
 * Получает singleton instance Telegram Permissions API
 */
export function getTelegramPermissionsAPI(): TelegramPermissionsAPI {
  return TelegramPermissionsAPI.create();
}

/**
 * НОВАЯ ФУНКЦИЯ: Валидирует доступ к каналу и права бота
 */
export async function validateChannelAccess(chatId: string): Promise<{
  accessible: boolean;
  botIsAdmin: boolean;
  error?: string;
}> {
  try {
    const api = getTelegramPermissionsAPI();
    
    const accessible = await api.isChannelAccessible(chatId);
    if (!accessible) {
      return {
        accessible: false,
        botIsAdmin: false,
        error: 'Channel not accessible or not found'
      };
    }

    const botIsAdmin = await api.isBotChannelAdmin(chatId);
    
    return {
      accessible: true,
      botIsAdmin,
      error: botIsAdmin ? undefined : 'Bot is not an administrator in this channel'
    };

  } catch (error) {
    return {
      accessible: false,
      botIsAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * НОВАЯ ФУНКЦИЯ: Получает права пользователя в канале (alias для consistency)
 */
export async function getUserChannelPermissions(
  chatId: string,
  userId: number
): Promise<TelegramChatMember | null> {
  const api = getTelegramPermissionsAPI();
  return api.getUserChannelPermissions(userId, chatId);
}

/**
 * НОВАЯ ФУНКЦИЯ: Получает список администраторов канала (alias для consistency)
 */
export async function getChannelAdministrators(
  chatId: string
): Promise<TelegramChatAdministrator[]> {
  const api = getTelegramPermissionsAPI();
  return api.getChatAdministrators(chatId);
} 