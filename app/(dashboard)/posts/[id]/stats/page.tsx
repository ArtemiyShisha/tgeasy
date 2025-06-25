import { Card, CardContent } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

interface PostStatsPageProps {
  params: { id: string };
}

export default function PostStatsPage({ params }: PostStatsPageProps) {
  const { id } = params;

  // Пока детальная статистика ещё в разработке.
  // В будущем здесь будет запрос к API `/api/posts/{id}/stats` и графики.

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
        <BarChart2 className="w-8 h-8 text-blue-600" />
        Статистика размещения
      </h1>

      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <p className="text-zinc-700 dark:text-zinc-300">
            Здесь будет отображаться подробная статистика размещения с идентификатором
            <code className="mx-1 font-mono">{id}</code>.
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Функциональность находится в разработке.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 