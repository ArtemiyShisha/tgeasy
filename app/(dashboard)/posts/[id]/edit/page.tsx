'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Import hooks
import { usePost } from '@/hooks/use-post';

// Import components
import { PostCreationInterface } from '@/components/posts/post-creation-interface';

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

  // Convert post data to form data format
  const initialData = React.useMemo(() => {
    if (!post) return undefined;
    
    return {
      channel_id: post.channel_id || '',
      contract_id: post.contract_id,
      title: post.title || '',
      creative_text: post.creative_text || '',
      creative_images: post.creative_images || [],
      target_url: post.target_url,
      placement_cost: post.placement_cost,
      placement_currency: post.placement_currency || 'RUB',
      kktu: '',
      erid: post.erid || '',
      product_description: post.product_description || '',
      requires_marking: !!(post.advertiser_inn && post.advertiser_name),
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at) : null
    };
  }, [post]);

  const handleSave = (updatedPost: any) => {
    toast.success('Размещение успешно сохранено');
    router.push('/posts');
  };

  const handlePublish = (updatedPost: any) => {
    toast.success('Размещение успешно опубликовано');
    router.push('/posts');
  };

  const handleCancel = () => {
    router.push('/posts');
  };

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
                  onClick={() => router.push('/posts')}
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/posts')}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Редактирование размещения
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                {post.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <PostCreationInterface
          mode="edit"
          postId={params.id}
          initialData={initialData}
          onSave={handleSave}
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
} 