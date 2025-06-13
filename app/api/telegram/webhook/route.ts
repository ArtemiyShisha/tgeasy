import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Отправка сообщения пользователю
 */
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML'
      })
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('Failed to send message:', result)
      return false
    }

    console.log('✅ Message sent successfully')
    return true
  } catch (error) {
    console.error('Error sending message:', error)
    return false
  }
}

/**
 * Обработка команды /start с параметрами авторизации
 */
async function handleStartCommand(telegramUserId: number, firstName: string, startParam?: string) {
  const supabase = createClient()
  
  console.log(`🔍 Start command from user ${telegramUserId}, param: ${startParam}`)
  
  // Если это команда авторизации
  if (startParam && startParam.startsWith('auth_')) {
    const state = startParam.replace('auth_', '')
    
    // Создаем или обновляем пользователя
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        telegram_id: telegramUserId,
        telegram_first_name: firstName,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      })
      .select('id')
      .single()

    if (error || !user) {
      console.error('Failed to create/update user:', error)
      return await sendMessage(telegramUserId, '❌ Ошибка при регистрации. Попробуйте позже.')
    }

    // Отправляем успешное сообщение с кнопкой для возврата на сайт
    const message = `✅ Авторизация успешна!

Добро пожаловать в TGeasy, ${firstName}!

Нажмите кнопку ниже чтобы завершить вход на сайте.`

    const keyboard = {
      inline_keyboard: [[
        {
          text: '🚀 Завершить вход',
          url: `https://tgeasy.vercel.app/auth/complete?telegram_id=${telegramUserId}&state=${state}`
        }
      ]]
    }

    return await sendMessage(telegramUserId, message, keyboard)
  }

  // Обычное приветствие
  const message = `👋 Привет, ${firstName}!

Это бот TGeasy для управления рекламными размещениями в Telegram каналах.

Для авторизации перейдите на сайт и нажмите "Войти через Telegram".`

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📝 Перейти на сайт',
        url: 'https://tgeasy.vercel.app/login'
      }
    ]]
  }

  return await sendMessage(telegramUserId, message, keyboard)
}

/**
 * POST /api/telegram/webhook
 * Обработка webhook от Telegram
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Telegram webhook received:', JSON.stringify(body, null, 2))

    // Обработка сообщений
    if (body.message) {
      const message = body.message
      const from = message.from
      const text = message.text

      if (!from || !text) {
        return NextResponse.json({ ok: true })
      }

      // Обработка команды /start
      if (text.startsWith('/start')) {
        const parts = text.split(' ')
        const startParam = parts.length > 1 ? parts[1] : undefined
        
        await handleStartCommand(from.id, from.first_name, startParam)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/telegram/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
} 