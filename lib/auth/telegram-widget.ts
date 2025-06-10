import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

/**
 * Правильная реализация Telegram Login Widget (БЕЗ бота!)
 * Документация: https://core.telegram.org/widgets/login
 */

export interface TelegramWidgetData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

/**
 * Валидирует данные от Telegram Login Widget
 * Использует bot token только для проверки подписи
 */
export async function validateTelegramWidgetData(data: TelegramWidgetData): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    throw new Error('Telegram bot token not configured')
  }

  // Создаем строку данных для проверки
  const dataCheckArr: string[] = []
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${value}`)
    }
  })
  
  dataCheckArr.sort()
  const dataCheckString = dataCheckArr.join('\n')

  // Создаем секретный ключ
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  
  // Создаем HMAC подпись
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  
  return hmac === data.hash
}

/**
 * Обрабатывает данные от Telegram Widget и создает/обновляет пользователя
 */
export async function handleTelegramWidgetAuth(data: TelegramWidgetData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    console.log('Processing Telegram auth data:', data)

    // Валидируем подпись Telegram
    const isValid = await validateTelegramWidgetData(data)
    if (!isValid) {
      throw new Error('Invalid Telegram widget data')
    }

    // Проверяем время авторизации (не старше 24 часов)
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const authAge = currentTimestamp - data.auth_date
    if (authAge > 86400) { // 24 часа
      throw new Error('Authorization data is too old')
    }

    // Создаем клиент Supabase
    const supabase = createClient()

    // Проверяем, существует ли пользователь
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', data.id)
      .single()

    let user = existingUser

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Database error: ${fetchError.message}`)
    }

    // Если пользователь не существует, создаем нового
    if (!existingUser) {
      console.log('Creating new user for Telegram ID:', data.id)
      
      const newUser = {
        id: crypto.randomUUID(),
        telegram_id: data.id,
        telegram_first_name: data.first_name,
        telegram_last_name: data.last_name || null,
        telegram_username: data.username || null,
        email: null,
        company_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      }

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      user = createdUser
    } else {
      // Обновляем информацию существующего пользователя
      const updates = {
        telegram_first_name: data.first_name,
        telegram_last_name: data.last_name || null,
        telegram_username: data.username || null,
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
        throw new Error(`Failed to update user: ${updateError.message}`)
      }

      user = updatedUser
    }

    // Создаем Supabase Auth сессию
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${user.telegram_id}@telegram.local`,
      password: user.telegram_id.toString()
    })

    if (authError) {
      // Если пользователь не существует в Supabase Auth, создаем его
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${user.telegram_id}@telegram.local`,
        password: user.telegram_id.toString(),
        options: {
          data: {
            telegram_id: user.telegram_id,
            user_id: user.id
          }
        }
      })

      if (signUpError) {
        console.error('Error creating auth user:', signUpError)
        throw new Error(`Failed to create auth session: ${signUpError.message}`)
      }
    }

    console.log('Auth successful for user:', user.id)
    return { success: true, user }

  } catch (error) {
    console.error('Telegram widget auth error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    }
  }
}

/**
 * Создает сессию в Supabase Auth для Telegram пользователя
 */
async function createSupabaseSession(user: any) {
  const supabase = createClient()
  
  // Создаем email на основе Telegram ID
  const email = `telegram_${user.telegram_id}@tgeasy.internal`
  const password = generatePasswordForTelegramUser(user.telegram_id)

  // Пытаемся войти
  let { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError?.message.includes('Invalid login credentials')) {
    // Пользователя нет в auth.users, создаем
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // отключаем email подтверждение
        data: {
          telegram_id: user.telegram_id,
          telegram_username: user.telegram_username,
          telegram_first_name: user.telegram_first_name,
          telegram_last_name: user.telegram_last_name
        }
      }
    })

    if (signUpError) {
      throw new Error(`Failed to create auth user: ${signUpError.message}`)
    }

    // Повторная попытка входа
    const { error: retrySignInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (retrySignInError) {
      throw new Error(`Failed to sign in after signup: ${retrySignInError.message}`)
    }
  } else if (signInError) {
    throw new Error(`Failed to sign in: ${signInError.message}`)
  }

  return true
}

/**
 * Генерирует стабильный пароль для Telegram пользователя
 */
function generatePasswordForTelegramUser(telegramId: number): string {
  const salt = process.env.TELEGRAM_BOT_TOKEN || 'fallback-salt'
  return crypto
    .createHmac('sha256', salt)
    .update(`telegram_user_${telegramId}`)
    .digest('hex')
    .substring(0, 32)
} 