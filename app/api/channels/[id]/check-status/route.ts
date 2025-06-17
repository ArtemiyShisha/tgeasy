import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/services/channel-service'
import { BotStatusCheckResult } from '@/types/channel'
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * POST /api/channels/[id]/check-status
 * 
 * Проверяет статус бота в канале и обновляет информацию в БД
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    // Получаем user_id из аутентифицированного запроса
    const userId = await getUserIdFromRequest(request)

    // Проверяем статус бота через сервис
    const channelService = ChannelService.getInstance()
    const result: BotStatusCheckResult = await channelService.checkBotStatus(channelId, userId)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to check bot status',
          bot_status: result.bot_status,
          checked_at: result.checked_at
        },
        { status: 400 }
      )
    }

    // Возвращаем результат проверки
    return NextResponse.json({
      success: true,
      bot_status: result.bot_status,
      bot_permissions: result.bot_permissions,
      checked_at: result.checked_at,
      message: result.error || 'Bot status checked successfully'
    })

  } catch (error) {
    console.error('Error checking bot status:', error)

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Метод GET для получения текущего статуса без проверки
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    // Получаем user_id из аутентифицированного запроса
    const userId = await getUserIdFromRequest(request)

    // Получаем канал из БД с текущим статусом
    const channelService = ChannelService.getInstance()
    const channel = await channelService.getChannelById(channelId, userId)

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      bot_status: channel.bot_status || 'pending_bot',
      bot_last_checked_at: channel.bot_last_checked_at,
      channel_id: channel.id,
      channel_title: channel.channel_title
    })

  } catch (error) {
    console.error('Error getting bot status:', error)

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 