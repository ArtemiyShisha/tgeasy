import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/services/channel-service'
import { ChannelConnectionRequestSchema } from '@/utils/channel-validation'
import { ChannelConnectionRequest } from '@/types/channel'
import { requireAuth } from '@/lib/auth/session'

/**
 * POST /api/channels/connect - Подключение канала (упрощенная версия)
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем наличие TELEGRAM_BOT_TOKEN
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not set')
      return NextResponse.json(
        { error: 'Конфигурация сервера неполная' },
        { status: 500 }
      )
    }

    // Проверка аутентификации
    const session = await requireAuth()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Неавторизованный запрос' },
        { status: 401 }
      )
    }

    // Парсим тело запроса
    const body = await request.json()
    
    // Создаем объект запроса с user_id из сессии
    const connectionRequest: ChannelConnectionRequest = {
      identifier: body.identifier,
      verify_admin_rights: body.verify_admin_rights || false,
      user_id: session.id
    }
    
    // Валидируем запрос
    const validationResult = ChannelConnectionRequestSchema.safeParse(connectionRequest)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Некорректные данные запроса',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    // Подключение канала
    const channelService = ChannelService.getInstance()
    const result = await channelService.connectChannel(connectionRequest)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          error_code: result.error_code
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Channel connection error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 