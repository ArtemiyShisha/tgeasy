/**
 * Пример использования каналов hooks с Telegram-native правами доступа
 */

'use client';

import { useState } from 'react';
import { 
  useChannels, 
  useChannelStatus, 
  useChannelPermissions,
  type ChannelFilters 
} from '@/hooks';

export default function ChannelsExample() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Основной хук для работы с каналами
  const {
    channels,
    filteredChannels,
    loading,
    connecting,
    error,
    filters,
    updateFilter,
    connectChannel,
    disconnectChannel,
    getCreatorChannels,
    getPostableChannels,
    filterByPermissions
  } = useChannels({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Мониторинг статуса конкретного канала
  const {
    status,
    isOnline,
    memberCount,
    statusMessage,
    refresh: refreshStatus
  } = useChannelStatus(selectedChannelId || '', {
    enabled: !!selectedChannelId,
    pollingInterval: 60000
  });

  // Управление правами канала
  const {
    permissions,
    isCreator,
    isAdministrator,
    canPost,
    canEdit,
    syncStatus,
    syncPermissions
  } = useChannelPermissions(selectedChannelId || '', {
    autoSync: true
  });

  // Пример подключения канала
  const handleConnectChannel = async (input: string) => {
    try {
      const result = await connectChannel(input);
      console.log('Channel connected:', result);
    } catch (error) {
      console.error('Failed to connect channel:', error);
    }
  };

  // Пример фильтрации каналов
  const handleFilterChange = (key: keyof ChannelFilters, value: any) => {
    updateFilter(key, value);
  };

  // Получение каналов с определенными правами
  const creatorChannels = getCreatorChannels();
  const postableChannels = getPostableChannels();
  const editableChannels = filterByPermissions('can_edit');

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Channels Management Example</h1>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold">Total Channels</h3>
          <p className="text-2xl">{channels.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold">Creator Channels</h3>
          <p className="text-2xl">{creatorChannels.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold">Postable Channels</h3>
          <p className="text-2xl">{postableChannels.length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold">Editable Channels</h3>
          <p className="text-2xl">{editableChannels.length}</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="space-y-2">
        <h3 className="font-semibold">Filters</h3>
        <div className="flex gap-4">
          <select 
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
            <option value="error">Error</option>
          </select>

          <select 
            value={filters.permission || ''}
            onChange={(e) => handleFilterChange('permission', e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Permissions</option>
            <option value="creator">Creator Only</option>
            <option value="administrator">Administrator</option>
            <option value="can_post">Can Post</option>
            <option value="can_edit">Can Edit</option>
          </select>

          <input
            type="text"
            placeholder="Search channels..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
        </div>
      </div>

      {/* Список каналов */}
      <div className="space-y-4">
        <h3 className="font-semibold">Channels ({filteredChannels.length})</h3>
        
        {loading && <p>Loading channels...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        <div className="grid gap-4">
          {filteredChannels.map((channel) => (
            <div 
              key={channel.id}
              className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                selectedChannelId === channel.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedChannelId(channel.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{channel.channel_title}</h4>
                  <p className="text-sm text-gray-500">@{channel.channel_username}</p>
                </div>
                
                <div className="flex gap-2">
                  {/* Telegram Status Badge */}
                  {channel.isCreator && (
                    <span className="px-2 py-1 bg-gold-100 text-gold-800 text-xs rounded">
                      Creator
                    </span>
                  )}
                  {channel.isAdministrator && !channel.isCreator && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Admin
                    </span>
                  )}
                  
                  {/* Connection Status */}
                  <span className={`px-2 py-1 text-xs rounded ${
                    channel.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {channel.is_active ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Permissions Indicators */}
              <div className="mt-2 flex gap-2 text-sm">
                {channel.canPost && <span className="text-green-600">📝 Post</span>}
                {channel.canEdit && <span className="text-blue-600">✏️ Edit</span>}
                {channel.canDelete && <span className="text-red-600">🗑️ Delete</span>}
                {channel.canInviteUsers && <span className="text-purple-600">👥 Invite</span>}
              </div>

              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Added: {new Date(channel.created_at || '').toLocaleDateString()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectChannel(channel.id);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Детали выбранного канала */}
      {selectedChannelId && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Channel Details</h3>
          
          {/* Status */}
          {status && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Status</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Online: {isOnline ? '✅ Yes' : '❌ No'}</div>
                <div>Members: {memberCount}</div>
                <div className="col-span-2">Message: {statusMessage}</div>
              </div>
              <button 
                onClick={refreshStatus}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Refresh Status
              </button>
            </div>
          )}

          {/* Permissions */}
          {permissions && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Permissions</h4>
                <button 
                  onClick={syncPermissions}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  disabled={syncStatus.status === 'synced'}
                >
                  Sync Permissions
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Status: {permissions.telegram_status}</div>
                <div>Creator: {isCreator ? '✅' : '❌'}</div>
                <div>Administrator: {isAdministrator ? '✅' : '❌'}</div>
                <div>Can Post: {canPost ? '✅' : '❌'}</div>
                <div>Can Edit: {canEdit ? '✅' : '❌'}</div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Sync Status: {syncStatus.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Подключение нового канала */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-2">Connect New Channel</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter @username or invite link"
            className="border rounded px-3 py-2 flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConnectChannel((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder*="username"]') as HTMLInputElement;
              if (input?.value) {
                handleConnectChannel(input.value);
                input.value = '';
              }
            }}
            disabled={connecting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
} 