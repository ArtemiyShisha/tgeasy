/**
 * Утилиты для работы с Telegram API
 * Включает error handling, retry logic и валидацию
 */

import { TelegramError, type TelegramApiResponse } from '@/types/telegram';

/**
 * Обрабатывает ошибки Telegram API
 */
export function handleTelegramError(error: any): TelegramError {
  if (error instanceof TelegramError) {
    return error;
  }

  if (error && typeof error === 'object') {
    // Обработка ответа Telegram API
    if ('error_code' in error && 'description' in error) {
      return new TelegramError(
        error.error_code || 500,
        error.description || 'Unknown Telegram API error',
        error.description
      );
    }

    // Обработка сетевых ошибок
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new TelegramError(500, 'Network error: Unable to connect to Telegram API');
    }

    // Обработка timeout ошибок
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return new TelegramError(408, 'Request timeout');
    }
  }

  // Fallback для неизвестных ошибок
  return new TelegramError(500, error?.message || 'Unknown error occurred');
}

/**
 * Определяет, можно ли повторить запрос при данной ошибке
 */
export function shouldRetryError(error: any): boolean {
  if (error instanceof TelegramError) {
    // Коды ошибок, при которых можно повторить запрос
    const retryableCodes = [
      429, // Too Many Requests
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
      408, // Request Timeout
    ];

    return retryableCodes.includes(error.code);
  }

  // Сетевые ошибки обычно можно повторить
  if (error && typeof error === 'object') {
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      return true;
    }
    if (error.name === 'AbortError') {
      return true;
    }
  }

  return false;
}

/**
 * Валидирует и форматирует chat ID
 */
export function validateChatId(chatId: string | number): string {
  if (typeof chatId === 'number') {
    return chatId.toString();
  }

  if (typeof chatId === 'string') {
    // Удаляем префикс @ если есть
    const cleanId = chatId.startsWith('@') ? chatId.slice(1) : chatId;
    
    // Проверяем, что это валидный username или chat ID
    if (/^-?\d+$/.test(cleanId) || /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cleanId)) {
      return cleanId;
    }
  }

  throw new TelegramError(400, 'Invalid chat ID format');
}

/**
 * Валидирует user ID
 */
export function validateUserId(userId: string | number): number {
  const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new TelegramError(400, 'Invalid user ID: must be a positive integer');
  }

  return numericId;
}

/**
 * Экранирует специальные символы для Telegram HTML режима
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Экранирует специальные символы для Telegram MarkdownV2 режима
 */
export function escapeMarkdownV2(text: string): string {
  const specialChars = /[_*[\]()~`>#+\-=|{}.!]/g;
  return text.replace(specialChars, '\\$&');
}

/**
 * Форматирует текст сообщения для Telegram
 */
export function formatTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'MarkdownV2' | 'Markdown' = 'HTML'
): string {
  switch (parseMode) {
    case 'HTML':
      return escapeHtml(text);
    case 'MarkdownV2':
      return escapeMarkdownV2(text);
    case 'Markdown':
      // Для обратной совместимости, но рекомендуется использовать MarkdownV2
      return text;
    default:
      return text;
  }
}

/**
 * Проверяет, является ли строка валидным Telegram token
 */
export function validateBotToken(token: string): boolean {
  // Формат Telegram bot token: {bot_id}:{auth_token}
  // bot_id - число, auth_token - строка из букв, цифр, дефисов и подчеркиваний
  const tokenRegex = /^\d+:[a-zA-Z0-9_-]{35}$/;
  return tokenRegex.test(token);
}

/**
 * Извлекает bot ID из token
 */
export function extractBotId(token: string): number | null {
  if (!validateBotToken(token)) {
    return null;
  }

  const botId = token.split(':')[0];
  return parseInt(botId, 10);
}

/**
 * Создает безопасный URL для webhook
 */
export function createWebhookUrl(baseUrl: string, secretPath?: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const path = secretPath || 'webhook';
  
  // Добавляем случайный компонент для безопасности
  const secureComponent = Math.random().toString(36).substring(2, 15);
  
  return `${cleanBaseUrl}/api/telegram/${path}/${secureComponent}`;
}

/**
 * Проверяет webhook подпись (если используется secret token)
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secretToken: string
): boolean {
  if (!signature || !secretToken) {
    return false;
  }

  try {
    // Telegram использует HMAC-SHA256 для подписи
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secretToken)
      .update(body)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Обрезает текст до максимальной длины сообщения Telegram
 */
export function truncateMessage(text: string, maxLength: number = 4096): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Обрезаем и добавляем индикатор обрезки
  const truncated = text.substring(0, maxLength - 3);
  return truncated + '...';
}

/**
 * Разбивает длинный текст на несколько сообщений
 */
export function splitLongMessage(text: string, maxLength: number = 4096): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const messages: string[] = [];
  let currentMessage = '';

  // Разбиваем по предложениям для лучшей читаемости
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if (currentMessage.length + sentence.length <= maxLength) {
      currentMessage += (currentMessage ? ' ' : '') + sentence;
    } else {
      if (currentMessage) {
        messages.push(currentMessage);
        currentMessage = sentence;
      } else {
        // Если одно предложение больше лимита, принудительно обрезаем
        messages.push(truncateMessage(sentence, maxLength));
      }
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

/**
 * Создает inline keyboard для сообщения
 */
export function createInlineKeyboard(
  buttons: Array<{ text: string; url?: string; callback_data?: string }>
): { inline_keyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> } {
  return {
    inline_keyboard: buttons.map(button => [button])
  };
}

/**
 * Задержка для rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Проверяет, является ли chat каналом
 */
export function isChannel(chatType: string): boolean {
  return chatType === 'channel';
}

/**
 * Проверяет, является ли chat супергруппой
 */
export function isSupergroup(chatType: string): boolean {
  return chatType === 'supergroup';
}

/**
 * Проверяет, может ли chat иметь администраторов
 */
export function canHaveAdministrators(chatType: string): boolean {
  return chatType === 'channel' || chatType === 'supergroup' || chatType === 'group';
}

/**
 * Логирует API call для отладки
 */
export function logTelegramApiCall(
  method: string,
  params?: any,
  response?: TelegramApiResponse,
  error?: any
): void {
  const logData = {
    method,
    params: params ? JSON.stringify(params) : undefined,
    success: response?.ok || false,
    error_code: response?.error_code || error?.code,
    description: response?.description || error?.message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('Telegram API Call:', logData);
  }
}

/**
 * Проверяет rate limit headers (если доступны)
 */
export function checkRateLimit(headers: Record<string, string>): {
  remaining?: number;
  resetTime?: Date;
  retryAfter?: number;
} {
  const remaining = headers['x-ratelimit-remaining'];
  const resetTime = headers['x-ratelimit-reset'];
  const retryAfter = headers['retry-after'];

  return {
    remaining: remaining ? parseInt(remaining, 10) : undefined,
    resetTime: resetTime ? new Date(parseInt(resetTime, 10) * 1000) : undefined,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined
  };
} 