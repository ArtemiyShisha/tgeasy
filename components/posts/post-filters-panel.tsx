'use client';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { PostStatusGroup } from '@/types/post-ui';

interface PostFiltersPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: PostStatusGroup;
  onStatusFilterChange: (value: string) => void;
}

export function PostFiltersPanel({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: PostFiltersPanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Поиск размещений..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={onStatusFilterChange} className="w-auto">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800">
          <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
            Все
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
            Черновики
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
            Запланированы
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
            Опубликованы
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
} 