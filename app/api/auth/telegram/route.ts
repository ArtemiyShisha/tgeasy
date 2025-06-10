import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateTelegramAuthUrl, generateSecureState } from '@/utils/telegram-auth'

/**
 * API для конфигурации Telegram Login Widget
 * Возвращает настройки для встраивания виджета на фронтенде
 */
export async function GET(request: NextRequest) {
  try {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'

    if (!botUsername) {
      return NextResponse.json(
        { error: 'Telegram bot username not configured' },
        { status: 500 }
      )
    }

    // Возвращаем конфигурацию для Telegram Login Widget
    return NextResponse.json({
      botUsername,
      callbackUrl: `${baseUrl}/api/auth/callback`,
      requestAccess: 'write', // запрашиваем права на отправку сообщений
      origin: baseUrl
    })

  } catch (error) {
    console.error('Telegram widget config error:', error)
    return NextResponse.json(
      { error: 'Failed to get widget config' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/telegram
 * Альтернативный endpoint для получения auth URL
 */
export async function POST(request: NextRequest) {
  return GET(request)
} 