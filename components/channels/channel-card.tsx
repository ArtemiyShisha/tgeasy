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
  Activity
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
            <Users className="w-4 h-4" />
            0 members {/* TODO: Add member count from analytics */}
          </div>
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
      </CardContent>
    </Card>
  );
} 