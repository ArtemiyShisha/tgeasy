'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Post } from '@/types/post';
import { PostStatusBadge } from './post-status-badge';
import { 
  MoreHorizontal,
  Edit,
  Send,
  Trash2,
  BarChart2
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

export function PostCard({ 
  post, 
  onDelete, 
  onPublish 
}: PostCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <Card className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
              {post.title}
            </CardTitle>
            <div className="mt-1">
              <PostStatusBadge status={post.status} />
            </div>
          </div>
          
          {/* Actions dropdown */}
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
              {/* Draft: only Edit & Delete */}
              {post.status === 'draft' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/posts/${post.id}/edit`} className="flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(post.id)}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* Scheduled: Publish, Edit, Duplicate, Delete */}
              {post.status === 'scheduled' && (
                <>
                  {onPublish && (
                    <DropdownMenuItem onClick={() => onPublish(post.id)}>
                      <Send className="w-4 h-4 mr-2" />
                      Опубликовать
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/posts/${post.id}/edit`} className="flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Link>
                  </DropdownMenuItem>
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(post.id)}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* Published: Stats */}
              {post.status === 'published' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/posts/${post.id}/stats`} className="flex items-center">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Статистика
                    </Link>
                  </DropdownMenuItem>
                  {/* Delete disabled for published */}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Content preview */}
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
          {post.creative_text}
        </p>
        
        {/* Media indicator */}
        {post.creative_images && post.creative_images.length > 0 && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            📷 {post.creative_images.length} изображений
          </div>
        )}
        
        {/* Metadata */}
        <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex justify-between">
            <span>Канал:</span>
            <span className="truncate ml-2 max-w-[120px]">{post.channel_id}</span>
          </div>
          
          {post.scheduled_at && (
            <div className="flex justify-between">
              <span>Запланировано:</span>
              <span>{formatShortDate(post.scheduled_at)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Обновлено:</span>
            <span>{formatShortDate(post.updated_at)}</span>
          </div>
        </div>
        
        {/* Quick action button */}
        <div className="pt-2">
          <Link href={`/posts/${post.id}/edit`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <Edit className="w-3 h-3 mr-2" />
              Редактировать
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 