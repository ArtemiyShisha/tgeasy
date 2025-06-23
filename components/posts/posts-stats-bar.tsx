'use client';

import { Card, CardContent } from '@/components/ui/card';

interface PostsStatsBarProps {
  stats: {
    total: number;
    draft: number;
    scheduled: number;
    published: number;
    failed: number;
  } | null;
}

export function PostsStatsBar({ stats }: PostsStatsBarProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Всего</div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="text-2xl font-semibold text-zinc-600 dark:text-zinc-300">{stats.draft}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Черновики</div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.scheduled}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Запланированы</div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{stats.published}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Опубликованы</div>
        </CardContent>
      </Card>
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.failed}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Ошибки</div>
        </CardContent>
      </Card>
    </div>
  );
} 