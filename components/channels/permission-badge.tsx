'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Edit, 
  Trash2, 
  UserCheck, 
  MessageSquare, 
  Settings, 
  Crown, 
  Shield 
} from 'lucide-react';

interface PermissionBadgeProps {
  permission: string;
  value: boolean;
}

export function PermissionBadge({ permission, value }: PermissionBadgeProps) {
  const getPermissionLabel = (perm: string) => {
    const labels: Record<string, string> = {
      post: 'Post',
      edit: 'Edit',
      delete: 'Delete',
      invite: 'Invite',
      pin: 'Pin',
      manage: 'Manage',
      creator: 'Creator',
      administrator: 'Admin'
    };
    return labels[perm] || perm;
  };

  const getPermissionIcon = (perm: string) => {
    const icons: Record<string, any> = {
      post: Send,
      edit: Edit,
      delete: Trash2,
      invite: UserCheck,
      pin: MessageSquare,
      manage: Settings,
      creator: Crown,
      administrator: Shield
    };
    const Icon = icons[perm] || Shield;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <Badge 
      variant={value ? 'default' : 'secondary'} 
      className={cn(
        'text-xs flex items-center gap-1',
        value ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
      )}
    >
      {getPermissionIcon(permission)}
      {getPermissionLabel(permission)}
    </Badge>
  );
} 