import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/services/channel-service'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/channels/[id]/disconnect - Отключение канала от аккаунта пользователя
 * 
 * Логика:
 * - Канал остается в БД (telegram_channels)
 * - Удаляется связь пользователя с каналом (channel_permissions)
 * - Канал исчезает из интерфейса пользователя
 * - Пользователь может заново подключить канал через обычный flow
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Получаем user_id из аутентифицированного запроса
    const user_id = await getUserIdFromRequest(request)

    const channelService = ChannelService.getInstance()
    
    // Отключаем пользователя от канала
    const result = await channelService.disconnectUserFromChannel(params.id, user_id)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Не удалось отключить канал',
          error_code: result.error_code
        },
        { status: result.status || 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Канал успешно отключен от вашего аккаунта',
      data: {
        channel_id: params.id,
        disconnected_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Channel disconnect error:', error)
    
    // Специальная обработка ошибок прав доступа
    if (error instanceof Error) {
      if (error.message.includes('не найден') || error.message.includes('нет прав')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      if (error.message.includes('уже отключен')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
} 