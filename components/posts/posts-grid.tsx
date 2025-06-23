'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Post } from '@/types/post';
import { PostCard } from './post-card';
import { 
  Plus,
  FileText,
  Loader2
} from 'lucide-react';

interface PostsGridProps {
  posts: Post[];
  isLoading: boolean;
  selectedIds?: Set<string>;
  onSelectPost?: (postId: string, checked: boolean) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  onSchedule?: (id: string) => void;
}

export function PostsGrid({ 
  posts, 
  isLoading,
  selectedIds = new Set(),
  onSelectPost,
  onDuplicate, 
  onDelete, 
  onPublish, 
  onSchedule 
}: PostsGridProps) {

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
            <Link href="/dashboard/posts/new">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          {onSelectPost && (
            <div className="absolute top-3 left-3 z-10">
              <Checkbox
                checked={selectedIds.has(post.id)}
                onCheckedChange={(checked) => onSelectPost(post.id, checked)}
                className="bg-white dark:bg-zinc-800 shadow-sm"
              />
            </div>
          )}
          <PostCard
            post={post}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onPublish={onPublish}
            onSchedule={onSchedule}
          />
        </div>
      ))}
    </div>
  );
} 