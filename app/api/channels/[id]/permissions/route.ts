import { NextRequest, NextResponse } from 'next/server';
import { getChannelPermissionsService } from '@/lib/services/channel-permissions-service';
import { ChannelService } from '@/lib/services/channel-service';

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/channels/[id]/permissions - Получение текущих Telegram прав канала
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1'; // TODO: получить из session

    const permissionsService = getChannelPermissionsService();
    
    // Получение прав пользователя для канала
    const permissions = await permissionsService.getUserChannelPermissions(user_id, params.id);
    
    if (!permissions) {
      return NextResponse.json(
        { error: 'Канал не найден или у вас нет прав доступа' },
        { status: 404 }
      );
    }

    // Получение сводки по всем правам канала
    const summary = await permissionsService.getChannelPermissionsSummary(params.id);

    return NextResponse.json({
      success: true,
      data: {
        user_permissions: permissions,
        channel_summary: summary
      }
    });

  } catch (error) {
    console.error('Channel permissions GET error:', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/[id]/permissions - Принудительная синхронизация прав из Telegram
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1'; // TODO: получить из session

    // Парсинг опций синхронизации
    const body = await request.json().catch(() => ({}));
    const { force_sync = false } = body;

    const channelService = ChannelService.getInstance();
    
    // Проверка доступа пользователя к каналу
    const channel = await channelService.getChannelById(params.id, user_id);
    if (!channel) {
      return NextResponse.json(
        { error: 'Канал не найден или у вас нет прав доступа' },
        { status: 404 }
      );
    }

    // Синхронизация прав
    const syncResult = await channelService.syncChannelPermissions(params.id, user_id);

    return NextResponse.json({
      success: syncResult.success,
      data: syncResult,
      message: syncResult.success 
        ? 'Права канала успешно синхронизированы'
        : 'Ошибка синхронизации прав'
    });

  } catch (error) {
    console.error('Channel permissions POST error:', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/channels/[id]/permissions - Проверка конкретного права пользователя
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1'; // TODO: получить из session

    // Парсинг запроса проверки права
    const body = await request.json();
    const { permission } = body;

    if (!permission) {
      return NextResponse.json(
        { error: 'Необходимо указать проверяемое право' },
        { status: 400 }
      );
    }

    const permissionsService = getChannelPermissionsService();
    const checkResult = await permissionsService.checkUserPermission(
      user_id,
      params.id,
      permission
    );

    return NextResponse.json({
      success: true,
      data: {
        permission,
        check_result: checkResult
      }
    });

  } catch (error) {
    console.error('Channel permission check error:', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels/[id]/permissions - Удаление прав пользователя (только для отладки)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Временно используем фиксированный user_id пока не настроена аутентификация
    const user_id = '1'; // TODO: получить из session

    // Проверка окружения - только в development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Операция недоступна в production' },
        { status: 403 }
      );
    }

    const permissionsService = getChannelPermissionsService();
    const success = await permissionsService.removeUserPermission(user_id, params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Не удалось удалить права пользователя' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Права пользователя удалены'
    });

  } catch (error) {
    console.error('Channel permissions DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
} 