'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Hash, 
  Users, 
  Settings, 
  Wifi, 
  WifiOff, 
  MoreHorizontal,
  Eye,
  Activity,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { ChannelWithPermissions } from '@/types/channel-ui';
import { StatusIndicator } from './status-indicator';
import { PermissionBadge } from './permission-badge';

interface ChannelCardProps {
  channel: ChannelWithPermissions;
  onConnect: (channelId: string) => void;
  onDisconnect: (channelId: string) => void;
}

export function ChannelCard({ channel, onConnect, onDisconnect }: ChannelCardProps) {
  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatLastActivity = (date: Date | string | null) => {
    if (!date) return 'No activity';
    
    const activityDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - activityDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Get status configuration
  const getStatusConfig = () => {
    if (channel.is_active) {
      return {
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        text: 'Active'
      };
    } else if (channel.bot_status === 'pending_bot') {
      return {
        icon: AlertCircle,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        text: 'Setup Required'
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        text: 'Disconnected'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-xl border-white/20 dark:bg-zinc-900/70 dark:border-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-900/80">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Channel Avatar with gradient */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {channel.channel_title.charAt(0).toUpperCase()}
              </div>
              {/* Status indicator dot */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusConfig.bgColor} ${statusConfig.borderColor} border-2 flex items-center justify-center`}>
                <StatusIcon className={`w-2.5 h-2.5 ${statusConfig.color}`} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
                {channel.channel_title}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                {channel.channel_username && (
                  <>
                    <Hash className="w-3 h-3" />
                    <span className="truncate">@{channel.channel_username}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 dark:hover:bg-zinc-800/50"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50"
            >
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </DropdownMenuItem>
              {channel.is_active ? (
                <DropdownMenuItem onClick={() => onDisconnect(channel.id)} className="text-red-600 dark:text-red-400">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onConnect(channel.id)} className="text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border font-medium`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.text}
          </Badge>
          
          {/* Member count */}
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <Users className="w-3 h-3" />
            <span>0</span> {/* TODO: Add member count */}
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/40 dark:bg-zinc-800/40 rounded-lg p-3">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Last Activity</div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              {formatLastActivity(channel.updated_at)}
            </div>
          </div>
          
          <div className="bg-white/40 dark:bg-zinc-800/40 rounded-lg p-3">
            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Posts Today</div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              0 {/* TODO: Add posts count */}
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Permissions</div>
          <div className="flex flex-wrap gap-1">
            {channel.isCreator && (
              <PermissionBadge permission="creator" value={true} />
            )}
            {channel.isAdministrator && (
              <PermissionBadge permission="administrator" value={true} />
            )}
            {channel.canPost && (
              <PermissionBadge permission="post" value={true} />
            )}
            {channel.canEdit && (
              <PermissionBadge permission="edit" value={true} />
            )}
          </div>
        </div>

        {/* Quick action button */}
        <Button 
          variant="ghost" 
          className="w-full justify-between h-9 text-zinc-700 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-zinc-800/50 group/btn"
        >
          <span className="text-sm">Manage Channel</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
} 