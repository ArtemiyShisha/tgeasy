import { z } from 'zod'
import { ChannelValidationResult, ChannelConnectionErrorCode } from '@/types/channel'

/**
 * Валидация username канала
 */
export function validateTelegramUsername(username: string): boolean {
  // Remove @ if present
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username
  
  // Telegram username rules:
  // - 5-32 characters
  // - Can contain a-z, 0-9, and underscores
  // - Must start with a letter
  // - Cannot end with underscore
  // - Cannot have consecutive underscores
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{3,30}[a-zA-Z0-9]$|^[a-zA-Z][a-zA-Z0-9_]{4}$/
  const noConsecutiveUnderscores = !/__/.test(cleanUsername)
  
  return usernameRegex.test(cleanUsername) && noConsecutiveUnderscores
}

/**
 * Валидация и парсинг Telegram invite link
 */
export function parseInviteLink(link: string): { isValid: boolean; channelId?: string } {
  try {
    const url = new URL(link)
    
    // Check if it's a valid Telegram domain
    const validDomains = ['t.me', 'telegram.me', 'telegram.org']
    if (!validDomains.includes(url.hostname)) {
      return { isValid: false }
    }
    
    // Parse different types of links
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    if (pathParts.length === 1) {
      // Format: t.me/channelname
      const username = pathParts[0]
      if (validateTelegramUsername(username)) {
        return { isValid: true, channelId: `@${username}` }
      }
    } else if (pathParts.length >= 2 && pathParts[0] === 'joinchat') {
      // Format: t.me/joinchat/XXXXXXXXX (private invite link)
      const inviteHash = pathParts[1]
      if (inviteHash && inviteHash.length >= 10) {
        return { isValid: true, channelId: link }
      }
    } else if (pathParts.length >= 2 && pathParts[0] === '+') {
      // Format: t.me/+XXXXXXXXX (new invite link format)
      const inviteHash = pathParts[1]
      if (inviteHash && inviteHash.length >= 10) {
        return { isValid: true, channelId: link }
      }
    }
    
    return { isValid: false }
  } catch {
    return { isValid: false }
  }
}

/**
 * Валидация Chat ID (числовой идентификатор)
 */
export function validateChatId(chatId: string): boolean {
  // Chat ID for channels should be negative number starting with -100
  const numChatId = parseInt(chatId, 10)
  return !isNaN(numChatId) && chatId.startsWith('-100') && chatId.length >= 13
}

/**
 * Комплексная валидация идентификатора канала
 */
export function validateChannelIdentifier(identifier: string): ChannelValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!identifier || identifier.trim().length === 0) {
    errors.push('Идентификатор канала не может быть пустым')
    return {
      is_valid: false,
      identifier_type: 'username',
      parsed_identifier: '',
      errors,
      warnings
    }
  }
  
  const trimmedIdentifier = identifier.trim()
  
  // Check if it's a chat ID
  if (validateChatId(trimmedIdentifier)) {
    return {
      is_valid: true,
      identifier_type: 'chat_id',
      parsed_identifier: trimmedIdentifier,
      errors: [],
      warnings: []
    }
  }
  
  // Check if it's an invite link
  const inviteLinkResult = parseInviteLink(trimmedIdentifier)
  if (inviteLinkResult.isValid) {
    return {
      is_valid: true,
      identifier_type: 'invite_link',
      parsed_identifier: inviteLinkResult.channelId!,
      errors: [],
      warnings: []
    }
  }
  
  // Check if it's a username
  if (validateTelegramUsername(trimmedIdentifier)) {
    const cleanUsername = trimmedIdentifier.startsWith('@') 
      ? trimmedIdentifier 
      : `@${trimmedIdentifier}`
    
    return {
      is_valid: true,
      identifier_type: 'username',
      parsed_identifier: cleanUsername,
      errors: [],
      warnings: []
    }
  }
  
  // If none of the above, provide helpful error message
  if (trimmedIdentifier.startsWith('http')) {
    errors.push('Неверный формат ссылки. Используйте ссылки вида t.me/channelname или t.me/joinchat/...')
  } else if (trimmedIdentifier.includes('@') && !trimmedIdentifier.startsWith('@')) {
    errors.push('Символ @ должен быть в начале username')
  } else if (trimmedIdentifier.length < 5) {
    errors.push('Username канала должен содержать минимум 5 символов')
  } else if (trimmedIdentifier.length > 32) {
    errors.push('Username канала не может быть длиннее 32 символов')
  } else {
    errors.push('Неверный формат идентификатора. Используйте @username, ссылку t.me/channel или Chat ID')
  }
  
  return {
    is_valid: false,
    identifier_type: 'username',
    parsed_identifier: trimmedIdentifier,
    errors,
    warnings
  }
}

/**
 * Zod схемы для валидации API запросов
 */
export const ChannelConnectionRequestSchema = z.object({
  identifier: z.string()
    .min(1, 'Идентификатор канала обязателен')
    .refine(
      (val) => validateChannelIdentifier(val).is_valid,
      'Неверный формат идентификатора канала'
    ),
  verify_admin_rights: z.boolean().optional().default(true)
})

export const ChannelUpdateSchema = z.object({
  channel_title: z.string().min(1, 'Название канала обязательно').optional(),
  channel_username: z.string().nullable().optional(),
  is_active: z.boolean().optional()
})

export const ChannelFiltersSchema = z.object({
  status: z.array(z.enum(['active', 'inactive', 'error', 'pending'])).optional(),
  telegram_status: z.array(z.enum(['creator', 'administrator'])).optional(),
  search: z.string().optional(),
  has_permissions: z.array(z.string()).optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

/**
 * Проверка прав администратора
 */
export function validateAdminRights(member: any): { isAdmin: boolean; permissions: string[] } {
  if (!member || !member.status) {
    return { isAdmin: false, permissions: [] }
  }
  
  const isAdmin = member.status === 'creator' || member.status === 'administrator'
  
  if (!isAdmin) {
    return { isAdmin: false, permissions: [] }
  }
  
  const permissions: string[] = []
  
  // Collect available permissions
  if (member.can_post_messages) permissions.push('can_post_messages')
  if (member.can_edit_messages) permissions.push('can_edit_messages')
  if (member.can_delete_messages) permissions.push('can_delete_messages')
  if (member.can_change_info) permissions.push('can_change_info')
  if (member.can_invite_users) permissions.push('can_invite_users')
  if (member.can_pin_messages) permissions.push('can_pin_messages')
  if (member.can_manage_chat) permissions.push('can_manage_chat')
  
  return { isAdmin, permissions }
}

/**
 * Создание понятного сообщения об ошибке
 */
export function getChannelErrorMessage(errorCode: ChannelConnectionErrorCode): string {
  switch (errorCode) {
    case ChannelConnectionErrorCode.INVALID_IDENTIFIER:
      return 'Неверный формат идентификатора канала. Используйте @username, ссылку t.me/channel или Chat ID'
    
    case ChannelConnectionErrorCode.CHANNEL_NOT_FOUND:
      return 'Канал не найден. Проверьте правильность username или ссылки'
    
    case ChannelConnectionErrorCode.ACCESS_DENIED:
      return 'Нет доступа к каналу. Убедитесь, что канал публичный или вы имеете права администратора'
    
    case ChannelConnectionErrorCode.BOT_NOT_ADMIN:
      return 'Бот TGeasy не является администратором канала. Добавьте бота как администратора с правами на отправку сообщений'
    
    case ChannelConnectionErrorCode.USER_NOT_ADMIN:
      return 'У вас нет прав администратора в этом канале. Только создатели и администраторы могут подключать каналы'
    
    case ChannelConnectionErrorCode.ALREADY_CONNECTED:
      return 'Этот канал уже подключен к TGeasy'
    
    case ChannelConnectionErrorCode.TELEGRAM_API_ERROR:
      return 'Ошибка Telegram API. Попробуйте позже или обратитесь в поддержку'
    
    case ChannelConnectionErrorCode.VALIDATION_ERROR:
      return 'Ошибка валидации данных. Проверьте правильность введенной информации'
    
    default:
      return 'Неизвестная ошибка при подключении канала'
  }
}

/**
 * Нормализация идентификатора канала для Telegram API
 */
export function normalizeChannelIdentifier(identifier: string): string {
  const validation = validateChannelIdentifier(identifier)
  
  if (!validation.is_valid) {
    throw new Error(`Invalid channel identifier: ${validation.errors.join(', ')}`)
  }
  
  return validation.parsed_identifier
} 