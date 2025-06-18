'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
  Send,
  Filter,
  Grid3X3,
  List,
  Zap,
  Bot,
  RefreshCw
} from 'lucide-react';

// Import existing hooks and types
import { useChannels } from '@/hooks/use-channels';
import { ChannelWithPermissions } from '@/types/channel-ui';
import { 
  ChannelStatusBadge, 
  getChannelStatusDescription, 
  isChannelOperational,
  isChannelNeedsSetup 
} from '@/components/channels/bot-status-badge';

// Enhanced Channel Card Component with HorizonUI styling
const EnhancedChannelCard = ({ 
  channel, 
  onConnect, 
  onDisconnect,
  onCheckBotStatus 
}: { 
  channel: ChannelWithPermissions; 
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onCheckBotStatus: (id: string) => void;
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

  const getStatusConfig = () => {
    if (channel.is_active && isChannelOperational(channel.bot_status)) {
      return {
        icon: CheckCircle,
        color: 'text-emerald-500 dark:text-emerald-400',
        bgColor: 'bg-emerald-50/80 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200/50 dark:border-emerald-800/50',
        text: 'Активен',
        dotColor: 'bg-emerald-500'
      };
    } else if (isChannelNeedsSetup(channel.bot_status)) {
      return {
        icon: AlertCircle,
        color: 'text-amber-500 dark:text-amber-400',
        bgColor: 'bg-amber-50/80 dark:bg-amber-900/20',
        borderColor: 'border-amber-200/50 dark:border-amber-800/50',
        text: 'Требует настройки',
        dotColor: 'bg-amber-500'
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-slate-500 dark:text-slate-400',
        bgColor: 'bg-slate-50/80 dark:bg-slate-900/20',
        borderColor: 'border-slate-200/50 dark:border-slate-800/50',
        text: 'Отключен',
        dotColor: 'bg-slate-500'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Apple-style Avatar with minimal status indicator */}
            <div className="relative">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-semibold text-xl">
                {channel.channel_title.charAt(0).toUpperCase()}
              </div>
              {/* Minimal status indicator dot */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900",
                statusConfig.dotColor
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
                {channel.channel_title}
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                {channel.channel_username && (
                  <span className="truncate">@{channel.channel_username}</span>
                )}
              </CardDescription>
            </div>
          </div>
          
          {/* Apple-style Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
            >
              <DropdownMenuItem onClick={() => onCheckBotStatus(channel.id)}>
                <Bot className="w-4 h-4 mr-2" />
                Проверить статус бота
              </DropdownMenuItem>
              {channel.is_active ? (
                <DropdownMenuItem onClick={() => onDisconnect(channel.id)} className="text-red-600 dark:text-red-400">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Отключить
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onConnect(channel.id)} className="text-emerald-600 dark:text-emerald-400">
                  <Wifi className="w-4 h-4 mr-2" />
                  Подключить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Apple-style Status badge */}
        <div className="flex items-center justify-start">
          <Badge 
            variant="outline" 
            className={cn(
              "font-medium border transition-all duration-200",
              statusConfig.bgColor,
              statusConfig.color,
              statusConfig.borderColor
            )}
          >
            <StatusIcon className="w-3 h-3 mr-1.5" />
            {statusConfig.text}
          </Badge>
        </div>

        {/* Apple-style Permissions */}
        {isChannelOperational(channel.bot_status) && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ваши права</div>
            <div className="flex flex-wrap gap-1.5">
              {channel.isCreator && (
                <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Владелец
                </Badge>
              )}
              {channel.isAdministrator && (
                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Админ
                </Badge>
              )}
              {channel.canPost && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  <Send className="w-3 h-3 mr-1" />
                  Публикация
                </Badge>
              )}
              {!channel.isCreator && !channel.isAdministrator && !channel.canPost && (
                <Badge variant="outline" className="text-xs">
                  Ограниченный доступ
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Apple-style Setup instructions */}
        {isChannelNeedsSetup(channel.bot_status) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <div className="text-sm font-medium">Требуется настройка</div>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">
              {getChannelStatusDescription(channel.bot_status)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Connection Wizard with HorizonUI styling
const EnhancedConnectionWizard = ({ onConnect }: { onConnect: (input: string) => Promise<any> }) => {
  const [channelInput, setChannelInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    if (!channelInput.trim()) {
      setError('Пожалуйста, введите имя канала или ссылку-приглашение');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await onConnect(channelInput.trim());
      setChannelInput('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось подключить канал');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Добавить канал
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white">
            Подключить Telegram канал
          </DialogTitle>
          <DialogDescription>
            Введите имя канала (например, @mychannel) или ссылку-приглашение для подключения к TGeasy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="@имя_канала или https://t.me/имя_канала"
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                {error}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isConnecting}>
              Отмена
            </Button>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting || !channelInput.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Подключить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Enhanced Channel Management Interface
export function ChannelManagementInterface() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'setup'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Use existing hooks with custom filtering
  const { 
    channels, 
    loading, 
    error, 
    refetch, 
    connectChannel, 
    disconnectChannel,
    checkBotStatus,
    hasChannels
  } = useChannels({
    filters: {
      sortBy: 'created_at',
      sortOrder: 'desc'
    }
  });

  // Custom filtering logic for our specific needs
  const filteredChannels = useMemo(() => {
    let filtered = [...channels];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(channel => {
        switch (filterStatus) {
          case 'active':
            return channel.is_active && isChannelOperational(channel.bot_status);
          case 'setup':
            return isChannelNeedsSetup(channel.bot_status) || !channel.is_active;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [channels, filterStatus]);

  // Enhanced stats calculation
  const stats = useMemo(() => ({
    total: channels.length,
    connected: channels.filter(c => c.is_active && isChannelOperational(c.bot_status)).length,
    needsSetup: channels.filter(c => isChannelNeedsSetup(c.bot_status) || !c.is_active).length,
    disconnected: channels.filter(c => !c.is_active).length,
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
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
    }
  };

  const handleCheckBotStatus = async (channelId: string) => {
    try {
      await checkBotStatus(channelId);
    } catch (error) {
      console.error('Failed to check bot status:', error);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            Управление каналами
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Управляйте вашими Telegram каналами с расширенным мониторингом и контролем
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={refetch} 
            disabled={loading}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Обновить
          </Button>
          <EnhancedConnectionWizard onConnect={connectChannel} />
        </div>
      </div>

      {/* Apple-style Stats Cards - Minimalistic and Neutral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Hash className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.total}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Всего каналов</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.connected}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Активных</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stats.needsSetup}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Требуют настройки</div>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Apple-style Filters - Clean and Simple */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                    <TabsTrigger value="all">Все</TabsTrigger>
                    <TabsTrigger value="active">Активные</TabsTrigger>
                    <TabsTrigger value="setup">Настройка</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apple-style Channel Display */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-zinc-600 dark:text-zinc-400 animate-spin" />
            </div>
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Загрузка каналов...</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Пожалуйста, подождите, пока мы получаем ваши данные</p>
          </div>
        ) : filteredChannels && filteredChannels.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredChannels.map(channel => (
                  <EnhancedChannelCard
                    key={channel.id}
                    channel={channel}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onCheckBotStatus={handleCheckBotStatus}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200 dark:border-zinc-800">
                      <TableHead className="text-zinc-700 dark:text-zinc-300">Канал</TableHead>
                      <TableHead className="text-zinc-700 dark:text-zinc-300">Статус</TableHead>
                      <TableHead className="text-zinc-700 dark:text-zinc-300">Права</TableHead>
                      <TableHead className="text-zinc-700 dark:text-zinc-300">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChannels.map(channel => (
                      <TableRow key={channel.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-sm font-semibold">
                              {channel.channel_title.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-white">{channel.channel_title}</div>
                              {channel.channel_username && (
                                <div className="text-sm text-zinc-500 dark:text-zinc-400">@{channel.channel_username}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChannelStatusBadge 
                            botStatus={channel.bot_status} 
                            lastCheckedAt={channel.bot_last_checked_at}
                          />
                        </TableCell>
                        <TableCell>
                          {isChannelOperational(channel.bot_status) ? (
                            <div className="flex gap-1">
                              {channel.isCreator && <Crown className="w-4 h-4 text-yellow-500" />}
                              {channel.isAdministrator && <Shield className="w-4 h-4 text-blue-500" />}
                              {channel.canPost && <Send className="w-4 h-4 text-emerald-500" />}
                              {!channel.isCreator && !channel.isAdministrator && !channel.canPost && (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">Ограничено</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                              <DropdownMenuItem onClick={() => handleCheckBotStatus(channel.id)}>
                                <Bot className="w-4 h-4 mr-2" />
                                Проверить статус бота
                              </DropdownMenuItem>
                              {channel.is_active ? (
                                <DropdownMenuItem onClick={() => handleDisconnect(channel.id)} className="text-red-600 dark:text-red-400">
                                  <WifiOff className="w-4 h-4 mr-2" />
                                  Отключить
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleConnect(channel.id)} className="text-emerald-600 dark:text-emerald-400">
                                  <Wifi className="w-4 h-4 mr-2" />
                                  Подключить
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <Hash className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                {filterStatus !== 'all' ? 'Каналы не найдены' : 'Пока нет каналов'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
                {filterStatus !== 'all'
                  ? 'Попробуйте изменить фильтр для поиска нужных каналов.' 
                  : 'Подключите ваш первый Telegram канал, чтобы начать управление рекламными кампаниями.'
                }
              </p>
              {filterStatus === 'all' && <EnhancedConnectionWizard onConnect={connectChannel} />}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 