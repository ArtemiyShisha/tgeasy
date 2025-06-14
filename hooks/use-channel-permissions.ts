'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { channelsApi } from '@/lib/api/channels-api';
import { 
  TelegramChannelPermissions,
  UseChannelPermissionsOptions 
} from '@/types/channel-ui';
import { 
  isCreator,
  isAdministrator,
  canPost,
  canEdit,
  canDelete,
  canChangeInfo,
  canInviteUsers,
  getPermissionsSyncStatus,
  getErrorMessage
} from '@/utils/channel-helpers';

interface UseChannelPermissionsReturn {
  // Data
  permissions: TelegramChannelPermissions | null;
  
  // Loading states
  loading: boolean;
  syncing: boolean;
  
  // Error handling
  error: string | null;
  
  // Permission checks
  hasPermission: (permission: keyof TelegramChannelPermissions) => boolean;
  isCreator: boolean;
  isAdministrator: boolean;
  canPost: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeInfo: boolean;
  canInviteUsers: boolean;
  
  // Sync status
  syncStatus: {
    status: 'synced' | 'outdated' | 'never' | 'error';
    message: string;
    needsSync: boolean;
  };
  
  // Actions
  syncPermissions: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // UI helpers
  hasData: boolean;
  isPermissionsLoaded: boolean;
}

export function useChannelPermissions(
  channelId: string,
  options: UseChannelPermissionsOptions = {}
): UseChannelPermissionsReturn {
  const {
    autoSync = false,
    syncInterval = 3600000 // 1 hour
  } = options;

  // State
  const [permissions, setPermissions] = useState<TelegramChannelPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    if (!channelId) return;

    try {
      setError(null);
      const data = await channelsApi.getChannelPermissions(channelId);
      setPermissions(data);
    } catch (err) {
      console.error('Failed to fetch channel permissions:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Sync permissions with Telegram
  const syncPermissions = useCallback(async (): Promise<void> => {
    if (!channelId) return;

    setSyncing(true);
    setError(null);

    try {
      const updatedPermissions = await channelsApi.syncChannelPermissions(channelId);
      setPermissions(updatedPermissions);
    } catch (err) {
      console.error('Failed to sync channel permissions:', err);
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [channelId]);

  // Refresh (alias for fetchPermissions)
  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    await fetchPermissions();
  }, [fetchPermissions]);

  // Initial load
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Auto-sync
  useEffect(() => {
    if (!autoSync || !channelId) return;

    const interval = setInterval(() => {
      // Only auto-sync if permissions are outdated
      const syncStatus = getPermissionsSyncStatus(permissions ?? undefined);
      if (syncStatus.needsSync) {
        syncPermissions().catch(console.error);
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, channelId, permissions, syncPermissions]);

  // Permission check function
  const hasPermission = useCallback((permission: keyof TelegramChannelPermissions): boolean => {
    if (!permissions) return false;
    
    if (permission === 'telegram_status') {
      return permissions.telegram_status === 'creator' || permissions.telegram_status === 'administrator';
    }
    
    return Boolean(permissions[permission]);
  }, [permissions]);

  // Computed permission flags
  const permissionFlags = useMemo(() => {
    return {
      isCreator: isCreator(permissions ?? undefined),
      isAdministrator: isAdministrator(permissions ?? undefined),
      canPost: canPost(permissions ?? undefined),
      canEdit: canEdit(permissions ?? undefined),
      canDelete: canDelete(permissions ?? undefined),
      canChangeInfo: canChangeInfo(permissions ?? undefined),
      canInviteUsers: canInviteUsers(permissions ?? undefined),
    };
  }, [permissions]);

  // Sync status
  const syncStatus = useMemo(() => {
    return getPermissionsSyncStatus(permissions ?? undefined);
  }, [permissions]);

  // UI helpers
  const hasData = permissions !== null;
  const isPermissionsLoaded = !loading && hasData;

  return {
    // Data
    permissions,
    
    // Loading states
    loading,
    syncing,
    
    // Error handling
    error,
    
    // Permission checks
    hasPermission,
    ...permissionFlags,
    
    // Sync status
    syncStatus,
    
    // Actions
    syncPermissions,
    refresh,
    
    // UI helpers
    hasData,
    isPermissionsLoaded,
  };
}

export default useChannelPermissions; 