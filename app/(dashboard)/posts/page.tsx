'use client';

import { PostsManagementInterface } from '@/components/posts/posts-management-interface';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Calendar, Save } from 'lucide-react';

function PostsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMessage = (() => {
    if (searchParams.get('published') === 'true') return 'Размещение успешно опубликовано!';
    if (searchParams.get('scheduled') === 'true') return 'Размещение успешно запланировано!';
    if (searchParams.get('saved') === 'true') return 'Черновик размещения сохранен!';
    return null;
  })();

  const [successMessage, setSuccessMessage] = useState<string | null>(initialMessage);

  // Автозакрытие
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const getSuccessIcon = () => {
    if (successMessage?.includes('опубликовано')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (successMessage?.includes('запланировано')) {
      return <Calendar className="w-5 h-5 text-blue-600" />;
    } else if (successMessage?.includes('сохранен')) {
      return <Save className="w-5 h-5 text-emerald-600" />;
    }
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-3">
            {getSuccessIcon()}
            <div className="text-sm text-green-700 dark:text-green-300 font-medium">
              {successMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null);
                router.replace('/posts');
              }}
              className="ml-auto text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              <span className="sr-only">Закрыть</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <PostsManagementInterface />
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-6 py-8 max-w-7xl">Загрузка...</div>}>
      <PostsPageContent />
    </Suspense>
  );
} 