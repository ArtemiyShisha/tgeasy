'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Post } from '@/types/post';
import { PostStatusBadge } from './post-status-badge';
import { 
  Plus,
  Edit,
  FileText,
  Loader2,
  MoreHorizontal,
  Send,
  BarChart2,
  Trash2
} from 'lucide-react';

interface PostsTableProps {
  posts: Post[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectPost?: (postId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
}

export function PostsTable({ 
  posts, 
  isLoading,
  selectedIds = new Set(),
  onSelectPost,
  onSelectAll,
  onDelete, 
  onPublish 
}: PostsTableProps) {
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

  const isAllSelected = posts.length > 0 && selectedIds.size === posts.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < posts.length;

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <span className="ml-2 text-zinc-500">Загрузка размещений...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-8">
          <div className="text-center">
            <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Нет размещений
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Создайте первое рекламное размещение для начала работы
            </p>
            <Link href="/posts/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Создать размещение
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-200 dark:border-zinc-800">
            {onSelectAll && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  ref={(ref) => {
                    if (ref) {
                      (ref as any).indeterminate = isIndeterminate;
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead className="text-zinc-700 dark:text-zinc-300">Название</TableHead>
            <TableHead className="text-zinc-700 dark:text-zinc-300">Канал</TableHead>
            <TableHead className="text-zinc-700 dark:text-zinc-300">Статус</TableHead>
            <TableHead className="text-zinc-700 dark:text-zinc-300">Запланировано</TableHead>
            <TableHead className="text-zinc-700 dark:text-zinc-300">Обновлено</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              {onSelectPost && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(post.id)}
                    onCheckedChange={(checked) => onSelectPost(post.id, checked)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">
                  {post.title}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                  {post.creative_text.substring(0, 50)}...
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">
                  {post.channel_id}
                </div>
              </TableCell>
              <TableCell>
                <PostStatusBadge status={post.status} />
              </TableCell>
              <TableCell className="text-sm text-zinc-700 dark:text-zinc-300">
                {formatDate(post.scheduled_at)}
              </TableCell>
              <TableCell className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(post.updated_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {post.status !== 'published' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${post.id}/edit`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {post.status === 'scheduled' && onPublish && (
                      <DropdownMenuItem onClick={() => onPublish(post.id)}>
                        <Send className="w-4 h-4 mr-2" />
                        Опубликовать
                      </DropdownMenuItem>
                    )}
                    
                    {post.status === 'published' && (
                      <DropdownMenuItem asChild>
                        <Link href={`/posts/${post.id}/stats`} className="flex items-center">
                          <BarChart2 className="w-4 h-4 mr-2" />
                          Статистика
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {onDelete && post.status !== 'published' && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(post.id)}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
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
  );
} 