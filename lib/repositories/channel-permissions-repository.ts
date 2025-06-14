/**
 * Репозиторий для работы с правами доступа к каналам в БД
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ChannelPermission,
  ChannelPermissionCreate,
  ChannelPermissionUpdate,
  PermissionFilter,
  UserChannelAccess,
  ChannelPermissionsSummary,
  TelegramUserStatus
} from '@/types/channel-permissions';

export class ChannelPermissionsRepository {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Создает новые права доступа пользователя к каналу
   */
  async create(data: ChannelPermissionCreate): Promise<ChannelPermission | null> {
    try {
      const { data: permission, error } = await this.supabase
        .from('channel_permissions')
        .insert({
          channel_id: data.channel_id,
          user_id: data.user_id,
          telegram_status: data.telegram_status,
          can_post_messages: data.can_post_messages,
          can_edit_messages: data.can_edit_messages,
          can_delete_messages: data.can_delete_messages,
          can_change_info: data.can_change_info,
          can_invite_users: data.can_invite_users,
          last_synced_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating channel permission:', error);
        return null;
      }

      return this.mapDbToPermission(permission);
    } catch (error) {
      console.error('Error in create channel permission:', error);
      return null;
    }
  }

  /**
   * Обновляет права доступа пользователя к каналу
   */
  async update(id: string, data: ChannelPermissionUpdate): Promise<ChannelPermission | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      };

      // Добавляем только переданные поля
      Object.keys(data).forEach(key => {
        if (data[key as keyof ChannelPermissionUpdate] !== undefined) {
          updateData[key] = data[key as keyof ChannelPermissionUpdate];
        }
      });

      const { data: permission, error } = await this.supabase
        .from('channel_permissions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating channel permission:', error);
        return null;
      }

      return this.mapDbToPermission(permission);
    } catch (error) {
      console.error('Error in update channel permission:', error);
      return null;
    }
  }

  /**
   * Получает права пользователя для конкретного канала
   */
  async getUserChannelPermission(userId: string, channelId: string): Promise<ChannelPermission | null> {
    try {
      const { data: permission, error } = await this.supabase
        .from('channel_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('channel_id', channelId)
        .single();

      if (error || !permission) {
        return null;
      }

      return this.mapDbToPermission(permission);
    } catch (error) {
      console.error('Error getting user channel permission:', error);
      return null;
    }
  }

  /**
   * Получает все права пользователя (все каналы, к которым у него есть доступ)
   */
  async getUserPermissions(userId: string): Promise<ChannelPermission[]> {
    try {
      const { data: permissions, error } = await this.supabase
        .from('channel_permissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user permissions:', error);
        return [];
      }

      return permissions.map(this.mapDbToPermission);
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return [];
    }
  }

  /**
   * Получает все права для конкретного канала
   */
  async getChannelPermissions(channelId: string): Promise<ChannelPermission[]> {
    try {
      const { data: permissions, error } = await this.supabase
        .from('channel_permissions')
        .select('*')
        .eq('channel_id', channelId)
        .order('telegram_status', { ascending: false }) // Сначала создатели, потом администраторы
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting channel permissions:', error);
        return [];
      }

      return permissions.map(this.mapDbToPermission);
    } catch (error) {
      console.error('Error in getChannelPermissions:', error);
      return [];
    }
  }

  /**
   * Получает список каналов, к которым у пользователя есть доступ
   */
  async getUserAccessibleChannels(userId: string): Promise<UserChannelAccess[]> {
    try {
      const { data, error } = await this.supabase
        .from('channel_permissions')
        .select(`
          *,
          channel:telegram_channels(*)
        `)
        .eq('user_id', userId)
        .order('telegram_status', { ascending: false });

      if (error) {
        console.error('Error getting user accessible channels:', error);
        return [];
      }

      return data.map((item: any) => ({
        channel_id: item.channel_id,
        user_id: item.user_id,
        has_access: true,
        telegram_status: item.telegram_status,
        permissions: this.mapDbToPermission(item),
        access_level: this.getAccessLevel(item.telegram_status),
      }));
    } catch (error) {
      console.error('Error in getUserAccessibleChannels:', error);
      return [];
    }
  }

  /**
   * Фильтрует права по заданным критериям
   */
  async findByFilter(filter: PermissionFilter): Promise<ChannelPermission[]> {
    try {
      let query = this.supabase.from('channel_permissions').select('*');

      if (filter.channel_id) {
        query = query.eq('channel_id', filter.channel_id);
      }
      
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      
      if (filter.telegram_status) {
        query = query.eq('telegram_status', filter.telegram_status);
      }
      
      if (filter.has_permission !== undefined && filter.permission_type) {
        query = query.eq(filter.permission_type, filter.has_permission);
      }
      
      if (filter.last_synced_after) {
        query = query.gte('last_synced_at', filter.last_synced_after.toISOString());
      }
      
      if (filter.has_sync_errors !== undefined) {
        if (filter.has_sync_errors) {
          query = query.not('sync_error', 'is', null);
        } else {
          query = query.is('sync_error', null);
        }
      }

      const { data: permissions, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error filtering permissions:', error);
        return [];
      }

      return permissions.map(this.mapDbToPermission);
    } catch (error) {
      console.error('Error in findByFilter:', error);
      return [];
    }
  }

  /**
   * Создает или обновляет права пользователя (upsert)
   */
  async upsert(data: ChannelPermissionCreate): Promise<ChannelPermission | null> {
    try {
      const existing = await this.getUserChannelPermission(data.user_id, data.channel_id);
      
      if (existing) {
        return await this.update(existing.id, {
          telegram_status: data.telegram_status,
          can_post_messages: data.can_post_messages,
          can_edit_messages: data.can_edit_messages,
          can_delete_messages: data.can_delete_messages,
          can_change_info: data.can_change_info,
          can_invite_users: data.can_invite_users,
          sync_error: undefined, // Сбрасываем ошибку при успешной синхронизации
        });
      } else {
        return await this.create(data);
      }
    } catch (error) {
      console.error('Error in upsert channel permission:', error);
      return null;
    }
  }

  /**
   * Удаляет права пользователя для канала
   */
  async delete(userId: string, channelId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('channel_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('channel_id', channelId);

      if (error) {
        console.error('Error deleting channel permission:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in delete channel permission:', error);
      return false;
    }
  }

  /**
   * Получает права, которые нуждаются в синхронизации (старше 24 часов или с ошибками)
   */
  async getPermissionsNeedingSync(): Promise<ChannelPermission[]> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data: permissions, error } = await this.supabase
        .from('channel_permissions')
        .select('*')
        .or(`last_synced_at.lt.${oneDayAgo.toISOString()},sync_error.not.is.null`)
        .order('last_synced_at', { ascending: true });

      if (error) {
        console.error('Error getting permissions needing sync:', error);
        return [];
      }

      return permissions.map(this.mapDbToPermission);
    } catch (error) {
      console.error('Error in getPermissionsNeedingSync:', error);
      return [];
    }
  }

  /**
   * Получает сводку по правам канала
   */
  async getChannelPermissionsSummary(channelId: string): Promise<ChannelPermissionsSummary | null> {
    try {
      const permissions = await this.getChannelPermissions(channelId);
      
      if (permissions.length === 0) {
        return null;
      }

      const totalCreators = permissions.filter(p => p.telegram_status === 'creator').length;
      const totalAdmins = permissions.filter(p => p.telegram_status === 'administrator').length;
      const syncErrors = permissions.filter(p => p.sync_error).length;
      const lastSync = permissions.reduce((latest, p) => 
        p.last_synced_at > latest ? p.last_synced_at : latest, 
        permissions[0].last_synced_at
      );

      // Проверяем, нужна ли синхронизация (старше 24 часов)
      const now = new Date();
      const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      const needsSync = diffHours >= 24;

      return {
        channel_id: channelId,
        total_creators: totalCreators,
        total_admins: totalAdmins,
        active_permissions: permissions.length,
        last_sync: lastSync,
        sync_errors: syncErrors,
        needs_sync: needsSync,
      };
    } catch (error) {
      console.error('Error getting channel permissions summary:', error);
      return null;
    }
  }

  /**
   * Отмечает ошибку синхронизации для пользователя
   */
  async markSyncError(userId: string, channelId: string, error: string): Promise<boolean> {
    try {
      const permission = await this.getUserChannelPermission(userId, channelId);
      if (!permission) return false;

      return !!(await this.update(permission.id, {
        sync_error: error,
      }));
    } catch (error) {
      console.error('Error marking sync error:', error);
      return false;
    }
  }



  /**
   * Маппинг данных из БД в объект ChannelPermission
   */
  private mapDbToPermission(dbData: any): ChannelPermission {
    return {
      id: dbData.id,
      channel_id: dbData.channel_id,
      user_id: dbData.user_id,
      telegram_status: dbData.telegram_status,
      can_post_messages: dbData.can_post_messages,
      can_edit_messages: dbData.can_edit_messages,
      can_delete_messages: dbData.can_delete_messages,
      can_change_info: dbData.can_change_info,
      can_invite_users: dbData.can_invite_users,
      last_synced_at: new Date(dbData.last_synced_at),
      sync_error: dbData.sync_error,
      created_at: new Date(dbData.created_at),
      updated_at: new Date(dbData.updated_at),
    };
  }

  /**
   * Получает уровень доступа на основе Telegram статуса
   */
  private getAccessLevel(telegramStatus: TelegramUserStatus): UserChannelAccess['access_level'] {
    switch (telegramStatus) {
      case 'creator':
        return 'creator';
      case 'administrator':
        return 'administrator';
      default:
        return 'none';
    }
  }
}

// Экспортируем singleton instance
let channelPermissionsRepository: ChannelPermissionsRepository | null = null;

export function getChannelPermissionsRepository(): ChannelPermissionsRepository {
  if (!channelPermissionsRepository) {
    channelPermissionsRepository = new ChannelPermissionsRepository();
  }
  return channelPermissionsRepository;
} 