import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { validateTelegramAuth, extractTelegramAuthData } from '@/utils/telegram-auth'

export const dynamic = 'force-dynamic'

/**
 * Получает базовый URL из заголовков запроса
 */
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3001'
  const protocol = host.includes('loca.lt') ? 'https' : 'http'
  return `${protocol}://${host}`
}

/**
 * Основная логика обработки аутентификации Telegram
 */
async function handleTelegramAuth(request: NextRequest, telegramData: any) {
  // Проверяем подпись данных от Telegram
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL('/login?error=server_error', baseUrl))
  }

  const validation = validateTelegramAuth(telegramData, botToken)
  if (!validation.isValid) {
    console.error('Invalid Telegram signature:', validation.error)
    const baseUrl = getBaseUrl(request)
    return NextResponse.redirect(new URL('/login?error=invalid_signature', baseUrl))
  }

  // Создаем Supabase клиент
  const supabase = createClient()

  // Проверяем, существует ли уже пользователь
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', telegramData.id)
    .single()

  let userId: string

  console.log('📋 Telegram user data:', {
    id: telegramData.id,
    first_name: telegramData.first_name,
    last_name: telegramData.last_name,
    username: telegramData.username,
    photo_url: telegramData.photo_url
  })

  if (existingUser) {
    // Обновляем существующего пользователя
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        telegram_first_name: telegramData.first_name,
        telegram_last_name: telegramData.last_name || null,
        telegram_username: telegramData.username || null,
        last_login_at: new Date().toISOString()
      })
      .eq('telegram_id', telegramData.id)
      .select('id')
      .single()

    if (error || !updatedUser) {
      console.error('Failed to update user:', error)
      const baseUrl = getBaseUrl(request)
      return NextResponse.redirect(new URL('/login?error=database_error', baseUrl))
    }

    userId = updatedUser.id
    console.log('✅ User updated successfully:', userId)
  } else {
    // Создаем нового пользователя
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramData.id,
        telegram_first_name: telegramData.first_name,
        telegram_last_name: telegramData.last_name || null,
        telegram_username: telegramData.username || null,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error || !newUser) {
      console.error('Failed to create user:', error)
      return NextResponse.redirect(new URL('/login?error=database_error', request.url))
    }

    userId = newUser.id
    console.log('✅ User created successfully:', userId)
  }

  // Устанавливаем сессию через cookies
  const cookieStore = cookies()
  
  // Простая сессия через cookies (в production лучше использовать JWT)
  cookieStore.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 дней
  })
  
  cookieStore.set('telegram_id', telegramData.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 дней
  })

  // Получаем правильный хост из заголовков (для localtunnel)
  const baseUrl = getBaseUrl(request)
  
  // Сразу перенаправляем в дашборд - авторизация завершена
  return NextResponse.redirect(new URL('/dashboard', baseUrl))
}

/**
 * GET /api/auth/callback
 * Обрабатывает данные от Telegram Login Widget (GET запрос)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Извлекаем данные аутентификации Telegram
    const telegramData = extractTelegramAuthData(searchParams)
    if (!telegramData) {
      console.error('No valid Telegram data provided')
      return NextResponse.redirect(new URL('/login?error=invalid_data', getBaseUrl(request)))
    }

    return await handleTelegramAuth(request, telegramData)

  } catch (error) {
    console.error('Auth callback error (GET):', error)
    return NextResponse.redirect(new URL('/login?error=server_error', getBaseUrl(request)))
  }
}

/**
 * POST /api/auth/callback
 * Обрабатывает данные от Telegram Login Widget (POST запрос)
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем Content-Type заголовок
    const contentType = request.headers.get('content-type') || ''
    
    let searchParams: URLSearchParams
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Обрабатываем URL-encoded данные
      const body = await request.text()
      searchParams = new URLSearchParams(body)
    } else if (contentType.includes('multipart/form-data')) {
      // Обрабатываем multipart/form-data
      const body = await request.formData()
      searchParams = new URLSearchParams()
      body.forEach((value, key) => {
        searchParams.set(key, value.toString())
      })
    } else if (contentType.includes('application/json')) {
      // Обрабатываем JSON данные от Telegram
      const body = await request.json()
      searchParams = new URLSearchParams()
      
      // Конвертируем JSON объект в URLSearchParams
      for (const [key, value] of Object.entries(body)) {
        if (value !== null && value !== undefined) {
          searchParams.set(key, String(value))
        }
      }
    } else {
      // Попробуем как данные из URL
      const { searchParams: urlParams } = new URL(request.url)
      if (urlParams.toString()) {
        searchParams = urlParams
      } else {
        console.error('Unsupported content type:', contentType)
        return NextResponse.redirect(new URL('/login?error=invalid_request', request.url))
      }
    }
    
    console.log('POST data received:', Object.fromEntries(searchParams.entries()))
    
    // Извлекаем данные аутентификации Telegram
    const telegramData = extractTelegramAuthData(searchParams)
    if (!telegramData) {
      console.error('No valid Telegram data provided in POST')
      console.error('Available params:', Object.fromEntries(searchParams.entries()))
      return NextResponse.redirect(new URL('/login?error=invalid_data', request.url))
    }

    return await handleTelegramAuth(request, telegramData)

  } catch (error) {
    console.error('Auth callback error (POST):', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
} 