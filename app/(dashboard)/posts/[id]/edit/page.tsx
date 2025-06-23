'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Edit
} from 'lucide-react';

// Import hooks
import { usePost } from '@/hooks/use-post';

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  
  const {
    post,
    isLoading,
    error
  } = usePost({
    postId: params.id,
    include: {
      relations: true,
      media: true
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              <span className="ml-2 text-zinc-500">Загрузка размещения...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Размещение не найдено
                </h3>
                <p className="text-red-600 dark:text-red-400 mt-1">
                  {error?.message || 'Размещение с указанным ID не существует'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/posts')}
                  className="mt-4 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                >
                  Вернуться к списку
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/posts')}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
            Редактирование размещения
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {post.title}
          </p>
        </div>
      </div>

      {/* Placeholder for Edit Interface */}
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-8">
          <div className="text-center">
            <Edit className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Редактирование размещения
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Интерфейс редактирования будет реализован в следующих задачах
            </p>
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Информация о размещении:</h4>
              <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <p><strong>ID:</strong> {post.id}</p>
                <p><strong>Название:</strong> {post.title}</p>
                <p><strong>Статус:</strong> {post.status}</p>
                <p><strong>Канал:</strong> {post.channel_id}</p>
                <p><strong>Создано:</strong> {new Date(post.created_at).toLocaleString('ru-RU')}</p>
                <p><strong>Обновлено:</strong> {new Date(post.updated_at).toLocaleString('ru-RU')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 