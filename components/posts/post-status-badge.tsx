'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PostStatus } from '@/types/post';
import { 
  CheckCircle,
  Clock,
  FileText,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Status configuration for Apple-style badges
const getStatusConfig = (status: PostStatus) => {
  switch (status) {
    case 'published':
      return {
        icon: CheckCircle,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Опубликован'
      };
    case 'scheduled':
      return {
        icon: Clock,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'Запланирован'
      };
    case 'draft':
      return {
        icon: FileText,
        color: 'text-zinc-600 dark:text-zinc-400',
        bgColor: 'bg-zinc-50 dark:bg-zinc-900/20',
        borderColor: 'border-zinc-200 dark:border-zinc-800',
        label: 'Черновик'
      };
    case 'failed':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Ошибка'
      };
    default:
      return {
        icon: AlertCircle,
        color: 'text-zinc-600 dark:text-zinc-400',
        bgColor: 'bg-zinc-50 dark:bg-zinc-900/20',
        borderColor: 'border-zinc-200 dark:border-zinc-800',
        label: status
      };
  }
};

interface PostStatusBadgeProps {
  status: PostStatus;
  className?: string;
}

export function PostStatusBadge({ status, className }: PostStatusBadgeProps) {
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border transition-all duration-200",
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      <StatusIcon className="w-3 h-3 mr-1.5" />
      {config.label}
    </Badge>
  );
} 