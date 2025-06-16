'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hash, 
  Users, 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus, 
  MoreHorizontal,
  Edit,
  Eye,
  Activity,
  Shield,
  Crown,
  Send
} from 'lucide-react';

// Import existing hooks and types
import { useChannels } from '@/hooks/use-channels';
import { ChannelWithPermissions } from '@/types/channel-ui';

// Simple Status Indicator Component
const StatusIndicator = ({ channel }: { channel: ChannelWithPermissions }) => {
  if (!channel.is_active) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <WifiOff className="w-3 h-3" />
        Disconnected
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
      <CheckCircle className="w-3 h-3" />
      Active
    </div>
  );
};

// Simple Channel Card Component
const ChannelCard = ({ 
  channel, 
  onConnect, 
  onDisconnect 
}: { 
  channel: ChannelWithPermissions; 
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}) => {
  const formatLastActivity = (date: Date | string | null) => {
    if (!date) return 'No activity';
    
    const activityDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - activityDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {channel.channel_title.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{channel.channel_title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {channel.channel_username && (
                  <>
                    <Hash className="w-3 h-3" />
                    {channel.channel_username}
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </DropdownMenuItem>
              {channel.is_active ? (
                <DropdownMenuItem onClick={() => onDisconnect(channel.id)}>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onConnect(channel.id)}>
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            {formatLastActivity(channel.updated_at)}
          </div>
        </div>

        <StatusIndicator channel={channel} />

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Permissions</div>
          <div className="flex flex-wrap gap-1">
            {channel.isCreator && (
              <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                <Crown className="w-3 h-3 mr-1" />
                Creator
              </Badge>
            )}
            {channel.isAdministrator && (
              <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {channel.canPost && (
              <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                <Send className="w-3 h-3 mr-1" />
                Post
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Connection Wizard
const ConnectionWizard = ({ onConnect }: { onConnect: (input: string) => Promise<any> }) => {
  const [channelInput, setChannelInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    if (!channelInput.trim()) {
      setError('Please enter a channel username or invite link');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await onConnect(channelInput);
      setOpen(false);
      setChannelInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect channel');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Channel</DialogTitle>
          <DialogDescription>
            Enter your Telegram channel username or invite link
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Input
              placeholder="@channel_username or https://t.me/channel_username"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting || !channelInput.trim()}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function ChannelManagementInterface() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'disconnected'>('all');

  // Use existing hooks
  const { 
    channels, 
    filteredChannels,
    loading, 
    error, 
    refetch, 
    connectChannel, 
    disconnectChannel,
    hasChannels
  } = useChannels({
    filters: {
      status: filterStatus === 'all' ? undefined : (filterStatus === 'connected' ? 'connected' : 'disconnected'),
      search: searchTerm,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }
  });

  // Calculate stats
  const stats = React.useMemo(() => ({
    total: channels.length,
    connected: channels.filter(c => c.is_active).length,
    active: channels.filter(c => c.is_active).length,
    totalMembers: 0 // TODO: Add member count from channel statistics
  }), [channels]);

  const handleConnect = async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId);
      if (channel && channel.channel_username) {
        await connectChannel(channel.channel_username);
      }
    } catch (error) {
      console.error('Failed to connect channel:', error);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    try {
      await disconnectChannel(channelId);
      // TODO: Добавить toast уведомление об успехе
      console.log('Channel disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
      // TODO: Добавить toast уведомление об ошибке 
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Management</h1>
          <p className="text-muted-foreground">
            Manage your Telegram channels and monitor their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <Activity className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <ConnectionWizard onConnect={connectChannel} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Channels</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="disconnected">Disconnected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Channel Grid/Table */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading channels...</p>
              </div>
            ) : filteredChannels && filteredChannels.length > 0 ? (
              filteredChannels.map(channel => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No channels found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No channels match your search.' : 'Connect your first Telegram channel to get started.'}
                </p>
                <ConnectionWizard onConnect={connectChannel} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Loading channels...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredChannels && filteredChannels.length > 0 ? (
                  filteredChannels.map(channel => (
                    <TableRow key={channel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {channel.channel_title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{channel.channel_title}</div>
                            {channel.channel_username && (
                              <div className="text-sm text-muted-foreground">@{channel.channel_username}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusIndicator channel={channel} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                        {channel.isCreator && <Crown className="w-4 h-4 text-yellow-500" />}
                        {channel.isAdministrator && <Shield className="w-4 h-4 text-blue-500" />}
                        {channel.canPost && <Send className="w-4 h-4 text-green-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          {channel.is_active ? (
                            <DropdownMenuItem onClick={() => handleDisconnect(channel.id)}>
                              <WifiOff className="w-4 h-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleConnect(channel.id)}>
                              <Wifi className="w-4 h-4 mr-2" />
                              Connect
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No channels found</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm ? 'No channels match your search.' : 'Connect your first Telegram channel to get started.'}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {!hasChannels && !loading && (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No channels found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by connecting your first channel'}
          </p>
          <ConnectionWizard onConnect={connectChannel} />
        </div>
      )}
    </div>
  );
} 