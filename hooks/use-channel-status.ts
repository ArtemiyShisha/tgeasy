'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { channelsApi } from '@/lib/api/channels-api';
import { 
  ChannelStatus,
  TelegramChannelPermissions,
  UseChannelStatusOptions 
} from '@/types/channel-ui';
import { getErrorMessage, formatLastSync } from '@/utils/channel-helpers';

interface UseChannelStatusReturn {
  // Data
  status: ChannelStatus | null;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Status indicators
  isOnline: boolean;
  isConnected: boolean;
  memberCount: number;
  lastCheck: Date | null;
  lastError: string | null;
  
  // Telegram permissions from status
  telegramPermissions: TelegramChannelPermissions | null;
  
  // Actions
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  
  // UI helpers
  hasData: boolean;
  statusMessage: string;
  checkTimeAgo: string;
}

export function useChannelStatus(
  channelId: string,
  options: UseChannelStatusOptions = {}
): UseChannelStatusReturn {
  const {
    pollingInterval = 60000, // 1 minute
    enabled = true
  } = options;

  // State
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch channel status
  const fetchStatus = useCallback(async (force = false) => {
    if (!channelId || !enabled) return;

    const isForced = force || !status;
    if (isForced) {
      setRefreshing(true);
    }

    try {
      setError(null);
      const data = await channelsApi.getChannelStatus(channelId);
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch channel status:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      if (isForced) {
        setRefreshing(false);
      }
    }
  }, [channelId, enabled, status]);

  // Force refresh with API call
  const forceRefresh = useCallback(async (): Promise<void> => {
    if (!channelId || !enabled) return;

    setRefreshing(true);
    setError(null);

    try {
      const updatedStatus = await channelsApi.refreshChannelStatus(channelId);
      setStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to force refresh channel status:', err);
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, [channelId, enabled]);

  // Manual refresh (alias for fetchStatus with force)
  const refresh = useCallback(async (): Promise<void> => {
    await fetchStatus(true);
  }, [fetchStatus]);

  // Initial load
  useEffect(() => {
    if (enabled && channelId) {
      fetchStatus();
    }
  }, [enabled, channelId, fetchStatus]);

  // Polling
  useEffect(() => {
    if (!enabled || !channelId || pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enabled, channelId, pollingInterval, fetchStatus]);

  // Computed values
  const computedValues = useMemo(() => {
    if (!status) {
      return {
        isOnline: false,
        isConnected: false,
        memberCount: 0,
        lastCheck: null,
        lastError: null,
        telegramPermissions: null,
        statusMessage: 'Статус неизвестен',
        checkTimeAgo: 'Никогда',
      };
    }

    const statusMessage = status.isOnline 
      ? 'Канал онлайн' 
      : status.lastError 
        ? `Ошибка: ${status.lastError}`
        : 'Канал недоступен';

    const checkTimeAgo = formatLastSync(status.lastCheck);

    return {
      isOnline: status.isOnline,
      isConnected: status.isConnected,
      memberCount: status.memberCount,
      lastCheck: status.lastCheck,
      lastError: status.lastError || null,
      telegramPermissions: status.telegramPermissions || null,
      statusMessage,
      checkTimeAgo,
    };
  }, [status]);

  // UI helpers
  const hasData = status !== null;

  return {
    // Data
    status,
    
    // Loading states
    loading,
    refreshing,
    
    // Error handling
    error,
    
    // Status indicators
    ...computedValues,
    
    // Actions
    refresh,
    forceRefresh,
    
    // UI helpers
    hasData,
  };
}

export default useChannelStatus; 