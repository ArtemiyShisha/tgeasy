/**
 * Сервис для синхронизации и управления правами доступа на основе Telegram-native ролей
 */

import type {
  ChannelPermission,
  ChannelPermissionCreate,
  SyncChannelPermissionsRequest,
  SyncChannelPermissionsResponse,
  BulkPermissionsSyncRequest,
  BulkPermissionsSyncResponse,
  PermissionCheckResult,
  UserChannelAccess,
  ChannelPermissionsSummary,
  TelegramChatAdministrator,
  PermissionType
} from '@/types/channel-permissions';

import { getChannelPermissionsRepository } from '@/lib/repositories/channel-permissions-repository';
import { 
  getChannelAdministrators, 
  validateChannelAccess,
  getUserChannelPermissions
} from '@/lib/integrations/telegram/permissions';
import { 
  mapTelegramPermissionsToTGeasy,
  comparePermissions,
  needsPermissionsSync,
  formatSyncError
} from '@/utils/telegram-permissions';

export class ChannelPermissionsService {
  private repository;

  constructor() {
    this.repository = getChannelPermissionsRepository();
  }

  /**
   * Синхронизирует права доступа для конкретного канала
   */
  async syncChannelPermissions(request: SyncChannelPermissionsRequest): Promise<SyncChannelPermissionsResponse> {
    const startTime = Date.now();
    const { channel_id, force_sync = false } = request;
    const errors: string[] = [];
    let syncedPermissions = 0;
    let removedPermissions = 0;

    try {
      // 1. Проверяем доступность канала и права бота
      const channelAccess = await validateChannelAccess(channel_id);
      if (!channelAccess.accessible) {
        errors.push(`Channel not accessible: ${channelAccess.error}`);
        return this.createErrorResponse(channel_id, errors, startTime);
      }

      if (!channelAccess.botIsAdmin) {
        errors.push(`Bot is not admin of the channel: ${channelAccess.error}`);
        return this.createErrorResponse(channel_id, errors, startTime);
      }

      // 2. Получаем текущие права из БД
      const existingPermissions = await this.repository.getChannelPermissions(channel_id);
      
      // 3. Проверяем, нужна ли синхронизация (если не принудительная)
      if (!force_sync && existingPermissions.length > 0) {
        const lastSync = existingPermissions.reduce((latest, p) => 
          p.last_synced_at > latest ? p.last_synced_at : latest, 
          existingPermissions[0].last_synced_at
        );
        
        if (!needsPermissionsSync(lastSync)) {
          return {
            success: true,
            channel_id,
            synced_permissions: 0,
            removed_permissions: 0,
            errors: [],
            sync_duration_ms: Date.now() - startTime,
            last_synced_at: lastSync
          };
        }
      }

      // 4. Получаем администраторов из Telegram
      const telegramAdmins = await getChannelAdministrators(channel_id);
      if (telegramAdmins.length === 0) {
        errors.push('No administrators found in Telegram channel');
        return this.createErrorResponse(channel_id, errors, startTime);
      }

      // 5. Синхронизируем права администраторов
      const telegramAdminUserIds = new Set<string>();
      
      for (const admin of telegramAdmins) {
        try {
          const userId = admin.user.id.toString(); // Предполагаем, что user_id в БД соответствует Telegram ID
          telegramAdminUserIds.add(userId);
          
          const telegramPermissions = mapTelegramPermissionsToTGeasy(admin);
          telegramPermissions.channel_id = channel_id;
          telegramPermissions.user_id = userId;

          // Создаем или обновляем права
          const result = await this.repository.upsert(telegramPermissions);
          if (result) {
            syncedPermissions++;
          } else {
            errors.push(`Failed to sync permissions for user ${userId}`);
          }
        } catch (error) {
          const errorMsg = `Error syncing admin ${admin.user.id}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      // 6. Удаляем права пользователей, которые больше не являются администраторами
      for (const existingPermission of existingPermissions) {
        if (!telegramAdminUserIds.has(existingPermission.user_id)) {
          const deleted = await this.repository.delete(existingPermission.user_id, channel_id);
          if (deleted) {
            removedPermissions++;
          } else {
            errors.push(`Failed to remove permissions for user ${existingPermission.user_id}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        channel_id,
        synced_permissions: syncedPermissions,
        removed_permissions: removedPermissions,
        errors,
        sync_duration_ms: Date.now() - startTime,
        last_synced_at: new Date()
      };

    } catch (error) {
      const errorMsg = `Unexpected error syncing channel ${channel_id}: ${error}`;
      errors.push(errorMsg);
      console.error(errorMsg, error);
      return this.createErrorResponse(channel_id, errors, startTime);
    }
  }

  /**
   * Массовая синхронизация прав для нескольких каналов
   */
  async bulkSyncPermissions(request: BulkPermissionsSyncRequest): Promise<BulkPermissionsSyncResponse> {
    const startTime = Date.now();
    const { channel_ids, force_sync = false } = request;
    const results: SyncChannelPermissionsResponse[] = [];
    
    let successfulSyncs = 0;
    let failedSyncs = 0;

    // Синхронизируем каналы один за другим (можно распараллелить при необходимости)
    for (const channelId of channel_ids) {
      try {
        const result = await this.syncChannelPermissions({
          channel_id: channelId,
          force_sync
        });
        
        results.push(result);
        
        if (result.success) {
          successfulSyncs++;
        } else {
          failedSyncs++;
        }
        
        // Добавляем небольшую задержку между запросами для соблюдения rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failedSyncs++;
        results.push(this.createErrorResponse(channelId, [`Sync failed: ${error}`], Date.now()));
      }
    }

    return {
      total_channels: channel_ids.length,
      successful_syncs: successfulSyncs,
      failed_syncs: failedSyncs,
      results,
      total_duration_ms: Date.now() - startTime
    };
  }

  /**
   * Проверяет конкретное право пользователя в канале
   */
  async checkUserPermission(
    userId: string, 
    channelId: string, 
    permission: PermissionType
  ): Promise<PermissionCheckResult> {
    try {
      const userPermissions = await this.repository.getUserChannelPermission(userId, channelId);
      
      if (!userPermissions) {
        return {
          has_permission: false,
          reason: 'User has no permissions for this channel',
          permission_level: 'none'
        };
      }

      const hasPermission = userPermissions[permission];
      
      return {
        has_permission: hasPermission,
        reason: hasPermission ? undefined : `User lacks ${permission} permission`,
        permission_level: userPermissions.telegram_status === 'creator' ? 'creator' : 'administrator',
        telegram_status: userPermissions.telegram_status
      };
    } catch (error) {
      console.error('Error checking user permission:', error);
      return {
        has_permission: false,
        reason: 'Error checking permissions',
        permission_level: 'none'
      };
    }
  }

  /**
   * Получает все каналы, доступные пользователю
   */
  async getUserChannels(userId: string): Promise<UserChannelAccess[]> {
    try {
      return await this.repository.getUserAccessibleChannels(userId);
    } catch (error) {
      console.error('Error getting user channels:', error);
      return [];
    }
  }

  /**
   * Получает сводку по правам канала
   */
  async getChannelPermissionsSummary(channelId: string): Promise<ChannelPermissionsSummary | null> {
    try {
      return await this.repository.getChannelPermissionsSummary(channelId);
    } catch (error) {
      console.error('Error getting channel permissions summary:', error);
      return null;
    }
  }

  /**
   * Получает права конкретного пользователя в канале
   */
  async getUserChannelPermissions(userId: string, channelId: string): Promise<ChannelPermission | null> {
    try {
      return await this.repository.getUserChannelPermission(userId, channelId);
    } catch (error) {
      console.error('Error getting user channel permissions:', error);
      return null;
    }
  }

  /**
   * Синхронизирует права для всех каналов, которые нуждаются в обновлении
   */
  async syncStalePermissions(): Promise<BulkPermissionsSyncResponse> {
    try {
      // Получаем все каналы, которые нуждаются в синхронизации
      const stalePermissions = await this.repository.getPermissionsNeedingSync();
      const channelIds = Array.from(new Set(stalePermissions.map(p => p.channel_id)));
      
      if (channelIds.length === 0) {
        return {
          total_channels: 0,
          successful_syncs: 0,
          failed_syncs: 0,
          results: [],
          total_duration_ms: 0
        };
      }

      return await this.bulkSyncPermissions({
        channel_ids: channelIds,
        force_sync: true
      });
    } catch (error) {
      console.error('Error syncing stale permissions:', error);
      return {
        total_channels: 0,
        successful_syncs: 0,
        failed_syncs: 1,
        results: [],
        total_duration_ms: 0
      };
    }
  }

  /**
   * Проверяет и синхронизирует права пользователя при подключении канала
   */
  async validateAndSyncChannelConnection(channelId: string, userId: string): Promise<{
    success: boolean;
    hasAccess: boolean;
    permissions?: ChannelPermission;
    error?: string;
  }> {
    try {
      // 1. Синхронизируем права канала
      const syncResult = await this.syncChannelPermissions({
        channel_id: channelId,
        force_sync: true
      });

      if (!syncResult.success) {
        return {
          success: false,
          hasAccess: false,
          error: syncResult.errors.join(', ')
        };
      }

      // 2. Проверяем права пользователя
      const userPermissions = await this.repository.getUserChannelPermission(userId, channelId);
      
      return {
        success: true,
        hasAccess: userPermissions !== null,
        permissions: userPermissions || undefined,
        error: userPermissions ? undefined : 'User is not an administrator of this channel'
      };
    } catch (error) {
      console.error('Error validating channel connection:', error);
      return {
        success: false,
        hasAccess: false,
        error: 'Failed to validate channel connection'
      };
    }
  }

  /**
   * Удаляет права пользователя для канала
   */
  async removeUserPermission(userId: string, channelId: string): Promise<boolean> {
    try {
      return await this.repository.delete(userId, channelId);
    } catch (error) {
      console.error('Error removing user permission:', error);
      return false;
    }
  }

  /**
   * Создает response об ошибке
   */
  private createErrorResponse(
    channelId: string, 
    errors: string[], 
    startTime: number
  ): SyncChannelPermissionsResponse {
    return {
      success: false,
      channel_id: channelId,
      synced_permissions: 0,
      removed_permissions: 0,
      errors,
      sync_duration_ms: Date.now() - startTime,
      last_synced_at: new Date()
    };
  }
}

// Singleton instance
let channelPermissionsService: ChannelPermissionsService | null = null;

export function getChannelPermissionsService(): ChannelPermissionsService {
  if (!channelPermissionsService) {
    channelPermissionsService = new ChannelPermissionsService();
  }
  return channelPermissionsService;
} 