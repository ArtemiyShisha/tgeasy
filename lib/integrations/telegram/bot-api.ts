/**
 * Основной клиент Telegram Bot API с фокусом на права доступа
 * Включает rate limiting, retry logic и comprehensive error handling
 */

import type { 
  TelegramChatMember, 
  TelegramChatAdministrator 
} from '@/types/channel-permissions';
import type {
  TelegramBot,
  TelegramChat,
  TelegramMessage,
  TelegramWebhookInfo,
  TelegramApiResponse,
  SendMessageOptions
} from '@/types/telegram';
import { TelegramError } from '@/types/telegram';
import { handleTelegramError, shouldRetryError } from '@/utils/telegram-helpers';

export class TelegramBotAPI {
  private readonly botToken: string;
  private readonly baseUrl = 'https://api.telegram.org/bot';
  private readonly rateLimiter: RateLimiter;
  private readonly retryConfig: RetryConfig;

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.rateLimiter = new RateLimiter({
      requestsPerSecond: 30,
      burstSize: 5
    });

    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    };
  }

  /**
   * Получает информацию о боте
   */
  async getMe(): Promise<TelegramBot> {
    const response = await this.makeApiCall<TelegramBot>('getMe');
    
    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to get bot info'
      );
    }

    return response.result;
  }

  /**
   * Получает информацию о чате/канале
   */
  async getChat(chatId: string): Promise<TelegramChat> {
    const response = await this.makeApiCall<TelegramChat>('getChat', {
      chat_id: chatId
    });

    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 404,
        response.description || 'Chat not found'
      );
    }

    return response.result;
  }

  /**
   * Получает информацию о члене чата (ключевая функция для прав доступа)
   */
  async getChatMember(chatId: string, userId: number): Promise<TelegramChatMember> {
    const response = await this.makeApiCall<TelegramChatMember>('getChatMember', {
      chat_id: chatId,
      user_id: userId
    });

    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 404,
        response.description || 'Chat member not found'
      );
    }

    return response.result;
  }

  /**
   * Получает список администраторов канала (ключевая функция для синхронизации прав)
   */
  async getChatAdministrators(chatId: string): Promise<TelegramChatAdministrator[]> {
    const response = await this.makeApiCall<TelegramChatMember[]>('getChatAdministrators', {
      chat_id: chatId
    });

    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 404,
        response.description || 'Failed to get chat administrators'
      );
    }

    // Фильтруем только creator и administrator
    const administrators = response.result.filter(
      member => member.status === 'creator' || member.status === 'administrator'
    ) as TelegramChatAdministrator[];

    return administrators;
  }

  /**
   * Отправляет сообщение в канал
   */
  async sendMessage(
    chatId: string, 
    text: string, 
    options?: SendMessageOptions
  ): Promise<TelegramMessage> {
    const response = await this.makeApiCall<TelegramMessage>('sendMessage', {
      chat_id: chatId,
      text,
      ...options
    });

    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to send message'
      );
    }

    return response.result;
  }

  /**
   * Получает количество участников чата
   */
  async getChatMemberCount(chatId: string): Promise<number> {
    const response = await this.makeApiCall<number>('getChatMemberCount', {
      chat_id: chatId
    });

    if (!response.ok || response.result === undefined) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to get member count'
      );
    }

    return response.result;
  }

  /**
   * Устанавливает webhook для получения уведомлений
   */
  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    const response = await this.makeApiCall<boolean>('setWebhook', {
      url,
      secret_token: secretToken
    });

    if (!response.ok) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to set webhook'
      );
    }

    return response.result || false;
  }

  /**
   * Получает информацию о текущем webhook
   */
  async getWebhookInfo(): Promise<TelegramWebhookInfo> {
    const response = await this.makeApiCall<TelegramWebhookInfo>('getWebhookInfo');

    if (!response.ok || !response.result) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to get webhook info'
      );
    }

    return response.result;
  }

  /**
   * Удаляет webhook
   */
  async deleteWebhook(): Promise<boolean> {
    const response = await this.makeApiCall<boolean>('deleteWebhook');

    if (!response.ok) {
      throw new TelegramError(
        response.error_code || 500,
        response.description || 'Failed to delete webhook'
      );
    }

    return response.result || false;
  }

  /**
   * Проверяет доступность API и валидность токена
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getMe();
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Выполняет API запрос с rate limiting и retry logic
   */
  private async makeApiCall<T>(
    method: string,
    params?: Record<string, any>
  ): Promise<TelegramApiResponse<T>> {
    return this.executeWithRetry(async () => {
      await this.rateLimiter.acquire();

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
        
        // Логируем ошибки для отладки
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
        throw new TelegramError(500, 'Network error');
      }
    });
  }

  /**
   * Выполняет операцию с retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Проверяем, можно ли повторить запрос
        if (attempt === this.retryConfig.maxAttempts || !shouldRetryError(error)) {
          throw error;
        }

        // Вычисляем задержку с exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );

        console.warn(`Telegram API retry attempt ${attempt}/${this.retryConfig.maxAttempts} after ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * Rate limiter для соблюдения лимитов Telegram API
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly requestsPerSecond: number;
  private readonly burstSize: number;

  constructor(config: { requestsPerSecond: number; burstSize: number }) {
    this.requestsPerSecond = config.requestsPerSecond;
    this.burstSize = config.burstSize;
    this.tokens = config.burstSize;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) * (1000 / this.requestsPerSecond);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.requestsPerSecond;
    
    this.tokens = Math.min(this.burstSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * Конфигурация retry logic
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Singleton instance
let telegramBotAPI: TelegramBotAPI | null = null;

/**
 * Получает singleton instance Telegram Bot API
 */
export function getTelegramBotAPI(botToken?: string): TelegramBotAPI {
  if (!telegramBotAPI) {
    telegramBotAPI = new TelegramBotAPI(botToken);
  }
  return telegramBotAPI;
}

/**
 * Создает новый instance Telegram Bot API
 */
export function createTelegramBotAPI(botToken?: string): TelegramBotAPI {
  return new TelegramBotAPI(botToken);
} 