import crypto from 'crypto'
import type { TelegramUser, TelegramAuthValidation } from '@/types/auth'

/**
 * Проверяет подпись данных от Telegram
 * @param authData - данные аутентификации от Telegram
 * @param botToken - токен бота
 * @returns результат валидации
 */
export function validateTelegramAuth(
  authData: TelegramUser,
  botToken: string
): TelegramAuthValidation {
  try {
    // Проверяем наличие обязательных полей
    if (!authData.id || !authData.auth_date || !authData.hash) {
      return {
        isValid: false,
        isExpired: false,
        error: 'Missing required fields'
      }
    }

    // Проверяем срок действия (не старше 24 часов)
    const currentTime = Math.floor(Date.now() / 1000)
    const authTime = authData.auth_date
    const maxAge = 24 * 60 * 60 // 24 часа
    
    if (currentTime - authTime > maxAge) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Auth data is too old'
      }
    }

    // Создаем строку для проверки подписи
    const dataCheckString = createDataCheckString(authData)
    
    // Создаем секретный ключ из токена бота
    const secretKey = crypto
      .createHash('sha256')
      .update(botToken)
      .digest()

    // Вычисляем ожидаемую подпись
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Сравниваем подписи
    const isValid = crypto.timingSafeEqual(
      Buffer.from(authData.hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    )

    return {
      isValid,
      isExpired: false,
      error: isValid ? undefined : 'Invalid signature'
    }
  } catch (error) {
    return {
      isValid: false,
      isExpired: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Создает строку для проверки подписи согласно документации Telegram
 * @param authData - данные аутентификации
 * @returns строка для проверки
 */
function createDataCheckString(authData: TelegramUser): string {
  const { hash, ...dataWithoutHash } = authData

  // Преобразуем объект в массив пар ключ-значение
  const pairs = Object.entries(dataWithoutHash)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)

  // Сортируем по ключам
  pairs.sort()

  // Объединяем в строку
  return pairs.join('\n')
}

/**
 * Извлекает данные аутентификации из URL параметров
 * @param searchParams - URL search parameters
 * @returns данные аутентификации или null
 */
export function extractTelegramAuthData(searchParams: URLSearchParams): TelegramUser | null {
  try {
    const id = searchParams.get('id')
    const first_name = searchParams.get('first_name')
    const auth_date = searchParams.get('auth_date')
    const hash = searchParams.get('hash')

    if (!id || !first_name || !auth_date || !hash) {
      return null
    }

    return {
      id: parseInt(id, 10),
      first_name,
      last_name: searchParams.get('last_name') || undefined,
      username: searchParams.get('username') || undefined,
      photo_url: searchParams.get('photo_url') || undefined,
      auth_date: parseInt(auth_date, 10),
      hash
    }
  } catch {
    return null
  }
}

/**
 * Генерирует URL для Telegram OAuth
 * @param botUsername - имя пользователя бота
 * @param redirectUrl - URL для редиректа
 * @param requestAccess - запрашивать ли доступ к написанию боту
 * @returns URL для OAuth
 */
export function generateTelegramAuthUrl(
  botUsername: string,
  redirectUrl: string,
  requestAccess: boolean = false
): string {
  const params = new URLSearchParams({
    bot_username: botUsername,
    redirect_url: redirectUrl,
    request_access: requestAccess ? 'write' : ''
  })

  return `https://oauth.telegram.org/auth?${params.toString()}`
}

/**
 * Создает безопасный state параметр для CSRF защиты
 * @returns случайная строка
 */
export function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Проверяет CSRF state параметр
 * @param state - state из запроса
 * @param expectedState - ожидаемый state из сессии
 * @returns true если state валидный
 */
export function validateState(state: string | null, expectedState: string | null): boolean {
  if (!state || !expectedState || state.length !== 64) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(state, 'hex'),
    Buffer.from(expectedState, 'hex')
  )
} 