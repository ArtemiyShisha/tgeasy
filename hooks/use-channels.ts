'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { channelsApi, ChannelsApiError } from '@/lib/api/channels-api';
import { 
  ChannelWithPermissions,
  ChannelFilters,
  UseChannelsOptions,
  ChannelConnectionResponse
} from '@/types/channel-ui';
import { BotStatusCheckResult } from '@/types/channel';
import { 
  applyChannelFilters, 
  filterChannelsByPermissions,
  getErrorMessage 
} from '@/utils/channel-helpers';

interface UseChannelsReturn {
  // Data
  channels: ChannelWithPermissions[];
  filteredChannels: ChannelWithPermissions[];
  
  // Loading states
  loading: boolean;
  connecting: boolean;
  updating: boolean;
  
  // Error handling
  error: string | null;
  
  // Filters and search
  filters: ChannelFilters;
  setFilters: (filters: ChannelFilters) => void;
  updateFilter: (key: keyof ChannelFilters, value: any) => void;
  clearFilters: () => void;
  
  // Actions
  refetch: () => Promise<void>;
  connectChannel: (usernameOrLink: string) => Promise<ChannelConnectionResponse>;
  updateChannel: (channelId: string, updates: any) => Promise<ChannelWithPermissions>;
  disconnectChannel: (channelId: string) => Promise<void>;
  checkBotStatus: (channelId: string) => Promise<BotStatusCheckResult>;
  
  // Permission-based filtering
  filterByPermissions: (permission: string) => ChannelWithPermissions[];
  getCreatorChannels: () => ChannelWithPermissions[];
  getAdministratorChannels: () => ChannelWithPermissions[];
  getPostableChannels: () => ChannelWithPermissions[];
  
  // UI helpers
  hasChannels: boolean;
  isEmpty: boolean;
  totalCount: number;
  selectedCount: number;
}

const defaultFilters: ChannelFilters = {
  status: 'all'
};

export function useChannels(options: UseChannelsOptions = {}): UseChannelsReturn {
  const {
    filters: initialFilters = defaultFilters,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State
  const [channels, setChannels] = useState<ChannelWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChannelFilters>(initialFilters);

  // Optimistic updates state
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<ChannelWithPermissions>>>(new Map());

  // Clear error when data changes
  useEffect(() => {
    if (channels.length > 0 && error) {
      setError(null);
    }
  }, [channels.length, error]);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      setError(null);
      console.log('🔍 Fetching channels with filters:', filters);
      const response = await channelsApi.getChannels(filters);
      console.log('📦 API response:', response);
      
      if (!response || !response.channels) {
        console.error('❌ Invalid API response structure:', response);
        setError('Invalid response from server');
        return;
      }
      
      setChannels(response.channels.map(channel => ({
        ...channel,
        // Add default permission flags (simplified system)
        isCreator: true, // В упрощенной системе пользователь видит только свои каналы
        isAdministrator: true,
        canPost: true,
        canEdit: true,
        canDelete: true,
        canChangeInfo: true,
        canInviteUsers: true,
      })));
      
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchChannels, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchChannels]);

  // Manual refetch
  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchChannels();
  }, [fetchChannels]);

  // Connect channel
  const connectChannel = useCallback(async (usernameOrLink: string): Promise<ChannelConnectionResponse> => {
    setConnecting(true);
    setError(null);

    try {
      const response = await channelsApi.connectChannel(usernameOrLink);
      
      if (response.success) {
        // Add new channel to list with optimistic update
        const newChannel = {
          ...response.channel,
          isCreator: true, // В упрощенной системе пользователь видит только свои каналы
          isAdministrator: true,
          canPost: true,
          canEdit: true,
          canDelete: true,
          canChangeInfo: true,
          canInviteUsers: true,
        };
        
        setChannels(prev => [newChannel, ...prev]);
      }
      
      return response;
    } catch (err) {
      console.error('Failed to connect channel:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new ChannelsApiError(errorMessage, 'CONNECTION_FAILED', true);
    } finally {
      setConnecting(false);
    }
  }, []);

  // Update channel
  const updateChannel = useCallback(async (
    channelId: string, 
    updates: Partial<ChannelWithPermissions>
  ): Promise<ChannelWithPermissions> => {
    setUpdating(true);
    setError(null);

    // Optimistic update
    setOptimisticUpdates(prev => new Map(prev.set(channelId, updates)));

    try {
      const updatedChannel = await channelsApi.updateChannel(channelId, updates);
      
      const enrichedChannel = {
        ...updatedChannel,
        isCreator: true, // В упрощенной системе пользователь видит только свои каналы
        isAdministrator: true,
        canPost: true,
        canEdit: true,
        canDelete: true,
        canChangeInfo: true,
        canInviteUsers: true,
      };

      setChannels(prev => prev.map(channel => 
        channel.id === channelId ? enrichedChannel : channel
      ));

      // Clear optimistic update
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelId);
        return newMap;
      });

      return enrichedChannel;
    } catch (err) {
      console.error('Failed to update channel:', err);
      setError(getErrorMessage(err));
      
      // Revert optimistic update
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelId);
        return newMap;
      });
      
      throw err;
    } finally {
      setUpdating(false);
    }
  }, []);

  // Disconnect channel
  const disconnectChannel = useCallback(async (channelId: string): Promise<void> => {
    setUpdating(true);
    setError(null);

    // Optimistic removal
    const originalChannels = channels;
    setChannels(prev => prev.filter(channel => channel.id !== channelId));

    try {
      await channelsApi.disconnectUserFromChannel(channelId);
    } catch (err) {
      console.error('Failed to disconnect channel:', err);
      setError(getErrorMessage(err));
      
      // Revert optimistic removal
      setChannels(originalChannels);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [channels]);

  // Check bot status
  const checkBotStatus = useCallback(async (channelId: string): Promise<BotStatusCheckResult> => {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    try {
      const response = await fetch(`/api/channels/${channelId}/check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check bot status');
      }

      const result = await response.json();
      
      // Обновляем локальное состояние каналов с новым статусом бота
      setChannels(prev => prev.map(channel => 
        channel.id === channelId 
          ? { 
              ...channel, 
              bot_status: result.bot_status,
              bot_last_checked_at: result.checked_at
            }
          : channel
      ));

      return {
        success: result.success,
        bot_status: result.bot_status,
        bot_permissions: result.bot_permissions,
        checked_at: result.checked_at,
        error: result.message
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }, []);

  // Apply optimistic updates to channels
  const channelsWithOptimisticUpdates = useMemo(() => {
    return channels.map(channel => {
      const optimisticUpdate = optimisticUpdates.get(channel.id);
      return optimisticUpdate ? { ...channel, ...optimisticUpdate } : channel;
    });
  }, [channels, optimisticUpdates]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return applyChannelFilters(channelsWithOptimisticUpdates, filters);
  }, [channelsWithOptimisticUpdates, filters]);

  // Filter utilities
  const filterByPermissions = useCallback((permission: string) => {
    return filterChannelsByPermissions(channelsWithOptimisticUpdates, permission);
  }, [channelsWithOptimisticUpdates]);

  const getCreatorChannels = useCallback(() => {
    return channelsWithOptimisticUpdates.filter(channel => channel.isCreator);
  }, [channelsWithOptimisticUpdates]);

  const getAdministratorChannels = useCallback(() => {
    return channelsWithOptimisticUpdates.filter(channel => channel.isAdministrator);
  }, [channelsWithOptimisticUpdates]);

  const getPostableChannels = useCallback(() => {
    return channelsWithOptimisticUpdates.filter(channel => channel.canPost);
  }, [channelsWithOptimisticUpdates]);

  // Filter management
  const updateFilter = useCallback((key: keyof ChannelFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // UI helpers
  const hasChannels = channelsWithOptimisticUpdates.length > 0;
  const isEmpty = !hasChannels && !loading;
  const totalCount = channelsWithOptimisticUpdates.length;
  const selectedCount = filteredChannels.length;

  return {
    // Data
    channels: channelsWithOptimisticUpdates,
    filteredChannels,
    
    // Loading states
    loading,
    connecting,
    updating,
    
    // Error handling
    error,
    
    // Filters and search
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    
    // Actions
    refetch,
    connectChannel,
    updateChannel,
    disconnectChannel,
    checkBotStatus,
    
    // Permission-based filtering
    filterByPermissions,
    getCreatorChannels,
    getAdministratorChannels,
    getPostableChannels,
    
    // UI helpers
    hasChannels,
    isEmpty,
    totalCount,
    selectedCount,
  };
}

export default useChannels; 