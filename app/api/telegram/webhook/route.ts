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
      console.error('Telegram API error:', result)
      return false
    }

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
        last_login_at: new Date().toISOString()
      }, {
        onConflict: 'telegram_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating user:', error)
      return false
    }

    console.log(`✅ User created/updated: ${user.id}`)

    // Отправляем сообщение с кнопкой для завершения авторизации
    const completeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tgeasy.vercel.app'}/auth/complete?telegram_id=${telegramUserId}&state=${state}`
    
    const keyboard = {
      inline_keyboard: [[
        {
          text: '🚀 Завершить вход',
          url: completeUrl
        }
      ]]
    }

    const message = `🎉 <b>Отлично!</b>

Ваш аккаунт успешно создан в TGeasy!

👤 <b>Пользователь:</b> ${firstName}
🆔 <b>ID:</b> ${telegramUserId}

Нажмите кнопку ниже чтобы завершить авторизацию и перейти в дашборд:`

    return await sendMessage(telegramUserId, message, keyboard)
  }

  // Обычная команда /start без параметров
  const welcomeMessage = `👋 <b>Добро пожаловать в TGeasy!</b>

🚀 <b>TGeasy</b> - это платформа для автоматизации рекламных размещений в Telegram каналах.

<b>Возможности:</b>
📺 Управление множественными каналами
📝 Создание рекламных размещений
📊 Аналитика и отчеты
💰 Автоматическая маркировка ОРД

Для начала работы перейдите на сайт и авторизуйтесь через Telegram.`

  return await sendMessage(telegramUserId, welcomeMessage)
}

/**
 * POST /api/telegram/webhook
 * Обработка webhook от Telegram Bot API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📨 Telegram webhook received:', JSON.stringify(body, null, 2))

    // Обработка сообщений
    if (body.message) {
      const message = body.message
      const chatId = message.chat.id
      const userId = message.from.id
      const firstName = message.from.first_name || 'Пользователь'
      const text = message.text

      console.log(`💬 Message from ${firstName} (${userId}): ${text}`)

      // Обработка команды /start
      if (text && text.startsWith('/start')) {
        const parts = text.split(' ')
        const startParam = parts.length > 1 ? parts[1] : undefined
        
        const success = await handleStartCommand(userId, firstName, startParam)
        
        if (success) {
          console.log(`✅ Start command handled successfully for user ${userId}`)
        } else {
          console.error(`❌ Failed to handle start command for user ${userId}`)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
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