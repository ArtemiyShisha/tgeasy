import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/services/channel-service'
import { ChannelConnectionRequestSchema } from '@/utils/channel-validation'

/**
 * POST /api/channels/connect - Подключение канала с автоматической синхронизацией прав
 */
export async function POST(request: NextRequest) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1' // TODO: получить из session

    // Парсинг тела запроса
    const body = await request.json()

    // Валидация запроса
    const validation = ChannelConnectionRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные запроса',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Подключение канала
    const channelService = ChannelService.getInstance()
    const result = await channelService.connectChannel({
      ...validation.data,
      user_id
    })

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
      data: {
        channel: result.channel,
        telegram_data: result.telegram_data
      }
    })

  } catch (error) {
    console.error('Channel connection error:', error)
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
} 