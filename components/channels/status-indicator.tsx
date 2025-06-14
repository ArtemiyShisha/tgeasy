'use client';

import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { ChannelWithPermissions } from '@/types/channel-ui';

interface StatusIndicatorProps {
  channel: ChannelWithPermissions;
  showDetails?: boolean;
}

export function StatusIndicator({ channel, showDetails = false }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    if (!channel.is_active) {
      return { 
        icon: WifiOff, 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        label: 'Disconnected' 
      };
    }
    
    // Default to active if channel is active
    return { 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      label: 'Active' 
    };
  };

  const { icon: Icon, color, bg, label } = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium', bg, color)}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
} 