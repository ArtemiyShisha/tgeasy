import { NextRequest, NextResponse } from 'next/server';
import { getChannelPermissionsService } from '@/lib/services/channel-permissions-service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Схема для синхронизации прав
const SyncPermissionsSchema = z.object({
  force: z.boolean().optional().default(false),
});

/**
 * GET /api/channels/[id]/permissions
 * Получение прав доступа к каналу
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const channelId = params.id;
    const service = getChannelPermissionsService();

    // Получаем права пользователя для этого канала
    const userPermission = await service.getUserChannelPermissions(user.id, channelId);
    
    if (!userPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permissions for this channel.' },
        { status: 403 }
      );
    }

    // Получаем все права для канала (только если пользователь creator)
    if (userPermission.telegram_status === 'creator') {
      const summary = await service.getChannelPermissionsSummary(channelId);
      
      return NextResponse.json({
        user_permission: userPermission,
        summary,
      });
    } else {
      // Обычные администраторы видят только свои права
      return NextResponse.json({
        user_permission: userPermission,
      });
    }
  } catch (error) {
    console.error('Error getting channel permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/[id]/permissions
 * Синхронизация прав доступа с Telegram
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const channelId = params.id;
    const body = await request.json();
    const { force } = SyncPermissionsSchema.parse(body);

    const service = getChannelPermissionsService();

    // Проверяем, что пользователь имеет права на этот канал
    const userPermission = await service.getUserChannelPermissions(user.id, channelId);
    
    if (!userPermission) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permissions for this channel.' },
        { status: 403 }
      );
    }

    // Синхронизируем права с Telegram
    const result = await service.syncChannelPermissions({
      channel_id: channelId,
      force_sync: force
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to sync permissions',
          details: result.errors.join(', '),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      synced_permissions: result.synced_permissions,
      removed_permissions: result.removed_permissions,
      message: 'Permissions synchronized successfully',
    });
  } catch (error) {
    console.error('Error syncing channel permissions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels/[id]/permissions
 * Удаление прав пользователя (только для creator)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const channelId = params.id;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    const service = getChannelPermissionsService();

    // Проверяем, что текущий пользователь - creator канала
    const userPermission = await service.getUserChannelPermissions(user.id, channelId);
    
    if (!userPermission || userPermission.telegram_status !== 'creator') {
      return NextResponse.json(
        { error: 'Access denied. Only channel creators can remove permissions.' },
        { status: 403 }
      );
    }

    // Нельзя удалить права самого себя
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove your own permissions' },
        { status: 400 }
      );
    }

    // Удаляем права пользователя
    const success = await service.removeUserPermission(targetUserId, channelId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove user permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User permissions removed successfully',
    });
  } catch (error) {
    console.error('Error removing user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 