import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  XCircle,
  Grid3X3,
  List,
  Trash2,
  Send,
  Calendar,
  Download,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

// Import hooks and types
import { usePosts } from '@/hooks/use-posts';
import { useChannels } from '@/hooks/use-channels';
import { Post, PostStatus } from '@/types/post';
import { PostFilters, PostStatusGroup, PostViewMode } from '@/types/post-ui';

// Import components
import { PostStatusBadge, PostsTable, PostsGrid, PostFiltersPanel } from '@/components/posts';

interface PostsManagementInterfaceProps {
  className?: string;
}

export function PostsManagementInterface({ className }: PostsManagementInterfaceProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PostStatusGroup>('all');
  const [viewMode, setViewMode] = useState<PostViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Convert status filter to actual status array
  const statusArray = useMemo(() => {
    if (statusFilter === 'all') return undefined;
    return [statusFilter as PostStatus];
  }, [statusFilter]);

  // Initialize posts hook with filters
  const {
    posts,
    total,
    hasMore,
    isLoading,
    error,
    setFilters,
    loadMore,
    refresh,
    create,
    update,
    delete: deletePost,
  } = usePosts({
    filters: {
      search: searchQuery,
      status: statusArray,
      sort_by: 'updated_at',
      sort_order: 'desc'
    },
    autoRefresh: false
  });

  // Get channels for filtering
  const { channels } = useChannels();

  // Update filters when search or status changes
  React.useEffect(() => {
    setFilters({
      search: searchQuery,
      status: statusArray,
      sort_by: 'updated_at',
      sort_order: 'desc'
    });
  }, [searchQuery, statusArray, setFilters]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(posts.map(post => post.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [posts]);

  const handleSelectPost = useCallback((postId: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });
  }, []);

  // Search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Status filter handler
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value as PostStatusGroup);
    setSelectedIds(new Set()); // Clear selection when filter changes
  }, []);

  // View mode handler
  const handleViewModeChange = useCallback((mode: PostViewMode) => {
    setViewMode(mode);
  }, []);

  // Individual post actions
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это размещение?')) {
      try {
        await deletePost(id);
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  }, [deletePost]);

  const handlePublish = useCallback(async (id: string) => {
    if (window.confirm('Опубликовать размещение сейчас?')) {
      try {
        // TODO: Implement publish functionality
        console.log('Publishing post:', id);
        await update(id, { status: 'published', published_at: new Date().toISOString() });
      } catch (error) {
        console.error('Failed to publish post:', error);
      }
    }
  }, [update]);

  const handleSchedule = useCallback(async (id: string) => {
    // TODO: Open schedule modal
    console.log('Schedule post:', id);
  }, []);

  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить ${selectedIds.size} размещений?`)) {
      setBulkActionLoading(true);
      try {
        await Promise.all(Array.from(selectedIds).map(id => deletePost(id)));
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Failed to delete posts:', error);
      } finally {
        setBulkActionLoading(false);
      }
    }
  }, [selectedIds, deletePost]);

  const handleBulkPublish = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Опубликовать ${selectedIds.size} размещений?`)) {
      setBulkActionLoading(true);
      try {
        await Promise.all(
          Array.from(selectedIds).map(id => 
            update(id, { status: 'published', published_at: new Date().toISOString() })
          )
        );
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Failed to publish posts:', error);
      } finally {
        setBulkActionLoading(false);
      }
    }
  }, [selectedIds, update]);

  const handleBulkSchedule = useCallback(() => {
    if (selectedIds.size === 0) return;
    // TODO: Open bulk schedule modal
    console.log('Bulk schedule posts:', Array.from(selectedIds));
  }, [selectedIds]);

  // Computed values
  const isAllSelected = posts.length > 0 && selectedIds.size === posts.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < posts.length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
            Размещения
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Управление рекламными размещениями {total > 0 && `(${total})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Link href="/posts/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Создать размещение
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <PostFiltersPanel 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(ref: HTMLInputElement | null) => {
                    if (ref) {
                      ref.indeterminate = isIndeterminate;
                    }
                  }}
                />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Выбрано: {selectedIds.size} из {posts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkPublish}
                  disabled={bulkActionLoading}
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Опубликовать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkSchedule}
                  disabled={bulkActionLoading}
                  className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Запланировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-zinc-500 dark:text-zinc-400"
                >
                  Отменить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-700 dark:text-red-300">{error.message}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refresh}
                className="ml-auto border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
              >
                Повторить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Content */}
      {viewMode === 'table' ? (
        <PostsTable 
          posts={posts} 
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectPost={handleSelectPost}
          onSelectAll={handleSelectAll}
          onDelete={handleDelete}
          onPublish={handlePublish}
        />
      ) : (
        <PostsGrid 
          posts={posts} 
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectPost={handleSelectPost}
          onDelete={handleDelete}
          onPublish={handlePublish}
        />
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            className="border-zinc-200 dark:border-zinc-800"
          >
            Загрузить ещё
          </Button>
        </div>
      )}
    </div>
  );
} 