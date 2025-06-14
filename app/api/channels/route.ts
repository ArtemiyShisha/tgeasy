import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/session'
import { ChannelService } from '@/lib/services/channel-service'
import { ChannelFiltersSchema } from '@/utils/channel-validation'

/**
 * GET /api/channels - Получение каналов пользователя с фильтрацией по правам
 */
export async function GET(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await requireAuth()
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Неавторизованный запрос' },
        { status: 401 }
      )
    }

    // Парсинг query параметров
    const url = new URL(request.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    
    // Обработка массивов в query params
    const filters = {
      ...searchParams,
      status: searchParams.status ? searchParams.status.split(',') : undefined,
      telegram_status: searchParams.telegram_status ? searchParams.telegram_status.split(',') : undefined,
      has_permissions: searchParams.has_permissions ? searchParams.has_permissions.split(',') : undefined,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 20
    }

    // Валидация фильтров
    const validation = ChannelFiltersSchema.safeParse(filters)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Неверные параметры фильтрации',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Получение каналов
    const channelService = ChannelService.getInstance()
    const result = await channelService.getUserChannels(
      session.id,
      validation.data
    )

    return NextResponse.json({
      success: true,
      data: {
        channels: result.channels,
        pagination: {
          total: result.total,
          page: validation.data.page,
          limit: validation.data.limit,
          pages: Math.ceil(result.total / validation.data.limit)
        }
      }
    })

  } catch (error) {
    console.error('Channels GET error:', error)
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
 * POST /api/channels - Создание нового канала (redirect to connect endpoint)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Для подключения канала используйте POST /api/channels/connect',
      redirect: '/api/channels/connect'
    },
    { status: 400 }
  )
} 