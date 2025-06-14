import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/services/channel-service'
import { getChannelPermissionsService } from '@/lib/services/channel-permissions-service'
import { ChannelUpdateSchema } from '@/utils/channel-validation'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/channels/[id] - Получение канала по ID с правами пользователя
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1' // TODO: получить из session

    const channelService = ChannelService.getInstance()
    const channel = await channelService.getChannelById(params.id, user_id)

    if (!channel) {
      return NextResponse.json(
        { error: 'Канал не найден или у вас нет прав доступа' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { channel }
    })

  } catch (error) {
    console.error('Channel GET error:', error)
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/channels/[id] - Обновление канала с проверкой прав
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1' // TODO: получить из session

    // Парсинг тела запроса
    const body = await request.json()

    // Валидация данных обновления
    const validation = ChannelUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные данные для обновления',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Обновление канала
    const channelService = ChannelService.getInstance()
    const updatedChannel = await channelService.updateChannel(
      params.id,
      user_id,
      validation.data
    )

    if (!updatedChannel) {
      return NextResponse.json(
        { error: 'Канал не найден или у вас нет прав доступа' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { channel: updatedChannel }
    })

  } catch (error) {
    console.error('Channel PUT error:', error)
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/channels/[id] - Отключение канала (только для создателя)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1' // TODO: получить из session

    const channelService = ChannelService.getInstance()
    await channelService.disconnectChannel(params.id, user_id)

    return NextResponse.json({
      success: true,
      message: 'Канал успешно отключен'
    })

  } catch (error) {
    console.error('Channel DELETE error:', error)
    
    // Специальная обработка ошибок прав доступа
    if (error instanceof Error) {
      if (error.message.includes('не найден') || error.message.includes('нет прав')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      if (error.message.includes('создатель')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
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

/**
 * PATCH /api/channels/[id] - Синхронизация прав канала
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1' // TODO: получить из session

    // Проверяем доступ к каналу
    const channelService = ChannelService.getInstance()
    const channel = await channelService.getChannelById(params.id, user_id)
    if (!channel) {
      return NextResponse.json(
        { error: 'Канал не найден или у вас нет прав доступа' },
        { status: 404 }
      )
    }

    // Синхронизируем права через permissions service
    const permissionsService = getChannelPermissionsService()
    const syncResult = await permissionsService.syncChannelPermissions({
      channel_id: params.id,
      force_sync: true
    })

    return NextResponse.json({
      success: syncResult.success,
      data: syncResult
    })

  } catch (error) {
    console.error('Channel PATCH error:', error)
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
} 