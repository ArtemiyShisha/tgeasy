import { Tables } from '@/types/database';

// Type aliases
type Channel = Tables<'telegram_channels'>;

// Import types from channel-ui.ts
import {
  ChannelWithPermissions,
  ChannelStatus,
  TelegramChannelPermissions,
  ChannelConnectionState,
  ChannelFilters,
  ChannelsListResponse,
  ChannelConnectionResponse,
  ChannelAnalytics,
  ChannelError
} from '@/types/channel-ui';

class ChannelsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'ChannelsApiError';
  }
}

class ChannelsApi {
  private baseUrl = '/api/channels';

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      const isRetryable = response.status >= 500 || response.status === 429;
      
      throw new ChannelsApiError(
        errorData.message || `HTTP ${response.status}`,
        errorData.code || `HTTP_${response.status}`,
        isRetryable,
        errorData
      );
    }

    return response.json();
  }

  // Core channel operations
  async getChannels(filters?: ChannelFilters): Promise<ChannelsListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.permission) params.append('permission', filters.permission);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const url = `${this.baseUrl}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    const apiResponse = await this.handleResponse<{
      success: boolean;
      data: {
        channels: any[];
        pagination: any;
      };
    }>(response);

    // Преобразуем структуру ответа API в ожидаемый формат
    return {
      channels: apiResponse.data.channels,
      pagination: apiResponse.data.pagination
    };
  }

  async getChannel(channelId: string): Promise<ChannelWithPermissions> {
    const response = await fetch(`${this.baseUrl}/${channelId}`);
    return this.handleResponse<ChannelWithPermissions>(response);
  }

  // Channel connection
  async connectChannel(identifier: string): Promise<ChannelConnectionResponse> {
    const response = await fetch(`${this.baseUrl}/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier }),
    });

    const apiResponse = await this.handleResponse<{
      success: boolean;
      data?: ChannelConnectionResponse;
      error?: string;
      error_code?: string;
    }>(response);

    // Если API вернул ошибку
    if (!apiResponse.success || !apiResponse.data) {
      return {
        success: false,
        error: apiResponse.error || 'Unknown error',
        error_code: apiResponse.error_code || 'VALIDATION_ERROR'
      } as any;
    }

    // Возвращаем данные из data поля
    return apiResponse.data;
  }

  async updateChannel(
    channelId: string, 
    updates: Partial<Channel>
  ): Promise<ChannelWithPermissions> {
    const response = await fetch(`${this.baseUrl}/${channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    return this.handleResponse<ChannelWithPermissions>(response);
  }

  async disconnectChannel(channelId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${channelId}`, {
      method: 'DELETE'
    });

    await this.handleResponse<void>(response);
  }

  async disconnectUserFromChannel(channelId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${channelId}/disconnect`, {
      method: 'POST'
    });

    await this.handleResponse<void>(response);
  }

  async verifyChannel(channelId: string): Promise<ChannelStatus> {
    const response = await fetch(`${this.baseUrl}/${channelId}/verify`, {
      method: 'POST'
    });

    return this.handleResponse<ChannelStatus>(response);
  }

  // Permissions operations
  async getChannelPermissions(channelId: string): Promise<TelegramChannelPermissions> {
    const response = await fetch(`${this.baseUrl}/${channelId}/permissions`);
    return this.handleResponse<TelegramChannelPermissions>(response);
  }

  async syncChannelPermissions(channelId: string): Promise<TelegramChannelPermissions> {
    const response = await fetch(`${this.baseUrl}/${channelId}/permissions`, {
      method: 'POST'
    });

    return this.handleResponse<TelegramChannelPermissions>(response);
  }

  async getUserAccessibleChannels(): Promise<ChannelWithPermissions[]> {
    const response = await fetch(`${this.baseUrl}?accessible_only=true`);
    const data = await this.handleResponse<ChannelsListResponse>(response);
    return data.channels;
  }

  // Status and monitoring
  async getChannelStatus(channelId: string): Promise<ChannelStatus> {
    const response = await fetch(`${this.baseUrl}/${channelId}/status`);
    return this.handleResponse<ChannelStatus>(response);
  }

  async refreshChannelStatus(channelId: string): Promise<ChannelStatus> {
    const response = await fetch(`${this.baseUrl}/${channelId}/status`, {
      method: 'POST'
    });

    return this.handleResponse<ChannelStatus>(response);
  }

  // Analytics
  async getChannelAnalytics(
    channelId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<ChannelAnalytics> {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from.toISOString());
    if (dateRange?.to) params.append('to', dateRange.to.toISOString());

    const url = `${this.baseUrl}/${channelId}/analytics${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    return this.handleResponse<ChannelAnalytics>(response);
  }

  // Bulk operations
  async bulkSyncPermissions(channelIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await fetch(`${this.baseUrl}/bulk/sync-permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_ids: channelIds })
    });

    return this.handleResponse<{ success: string[]; failed: string[] }>(response);
  }

  async bulkDisconnect(channelIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await fetch(`${this.baseUrl}/bulk/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_ids: channelIds })
    });

    return this.handleResponse<{ success: string[]; failed: string[] }>(response);
  }

  // Validation
  async validateChannelAccess(usernameOrLink: string): Promise<{
    valid: boolean;
    channelInfo?: {
      title: string;
      username: string;
      memberCount: number;
      description?: string;
    };
    userPermissions?: TelegramChannelPermissions;
    error?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: usernameOrLink })
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export const channelsApi = new ChannelsApi();
export { ChannelsApiError };
export type { ChannelsApi }; 