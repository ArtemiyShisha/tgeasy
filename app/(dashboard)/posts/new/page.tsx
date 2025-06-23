'use client';

import { useRouter } from 'next/navigation';
import { PostCreationInterface } from '@/components/posts/post-creation-interface';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function NewPostPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSave = (post: any) => {
    console.log('Post saved:', post);
    setIsNavigating(true);
    
    // Navigate to the posts list with a success message
    // Since we don't have edit page yet, go to posts list
    router.push('/posts?saved=true');
  };

  const handlePublish = (post: any) => {
    console.log('Post published/scheduled:', post);
    setIsNavigating(true);
    
    // Navigate to posts list with success message
    const queryParam = post.status === 'scheduled' ? 'scheduled=true' : 'published=true';
    router.push(`/posts?${queryParam}`);
  };

  const handleCancel = () => {
    if (window.confirm('Вы уверены, что хотите отменить создание размещения? Все несохраненные изменения будут потеряны.')) {
      setIsNavigating(true);
      router.push('/posts');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isNavigating}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isNavigating ? 'Возвращаемся...' : 'Назад'}
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  Создать размещение
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Создайте новое рекламное размещение для публикации в Telegram
                </p>
              </div>
            </div>
            
            {/* Optional: Add help button or status indicator */}
            <div className="text-xs text-zinc-400">
              Автосохранение включено
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <PostCreationInterface
          onSave={handleSave}
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 