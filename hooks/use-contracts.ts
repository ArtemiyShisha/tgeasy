'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { contractsApi, ContractsApiError } from '@/lib/api/contracts-api';
import { 
  ContractWithUI,
  ContractFilters,
  ContractPagination,
  UseContractsOptions,
  UseContractsReturn,
  UseContractOptions,
  UseContractReturn,
  UseContractUploadOptions,
  UseContractUploadReturn,
  UseContractSearchOptions,
  UseContractSearchReturn,
  CreateContractData,
  UpdateContractData,
  ContractUploadMetadata,
  FileUploadState,
  ContractFilePreview,
  ContractSearchState
} from '@/types/contract-ui';
import { Contract, ContractStats } from '@/types/contract';
import { 
  generateContractPreview,
  validateContractFile,
  formatFileSize,
  calculateEnhancedProgress,
  cleanupFilePreview,
  RESUMABLE_UPLOAD_THRESHOLD
} from '@/utils/file-upload-helpers';

// Default filters
const DEFAULT_FILTERS: ContractFilters = {
  status: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc'
};

// Default pagination
const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20
};

// Utility function to enhance contracts with UI properties
function enhanceContractWithUI(contract: Contract): ContractWithUI {
  const now = new Date();
  const expiresAt = contract.expires_at ? new Date(contract.expires_at) : null;
  
  const isExpired = expiresAt ? expiresAt <= now : false;
  const isExpiringSoon = expiresAt ? 
    expiresAt > now && expiresAt <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : 
    false;
  
  let expiryStatus: 'active' | 'expiring' | 'expired' = 'active';
  let statusColor: 'green' | 'yellow' | 'red' | 'gray' = 'gray';
  
  if (isExpired) {
    expiryStatus = 'expired';
    statusColor = 'red';
  } else if (isExpiringSoon) {
    expiryStatus = 'expiring';
    statusColor = 'yellow';
  } else if (contract.status === 'active') {
    statusColor = 'green';
  }
  
  return {
    ...contract,
    isExpired,
    isExpiringSoon,
    expiryStatus,
    statusColor,
    formattedFileSize: contract.file_size ? formatFileSize(contract.file_size) : undefined,
    formattedCreatedAt: new Date(contract.created_at).toLocaleDateString('ru-RU'),
    formattedExpiresAt: expiresAt ? expiresAt.toLocaleDateString('ru-RU') : undefined
  };
}

// Main contracts hook
export function useContracts(options: UseContractsOptions = {}): UseContractsReturn {
  const {
    filters: initialFilters = DEFAULT_FILTERS,
    pagination: initialPagination = DEFAULT_PAGINATION,
    autoRefresh = false,
    refreshInterval = 30000,
    enableOptimisticUpdates = true
  } = options;

  // State
  const [contracts, setContracts] = useState<ContractWithUI[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [filters, setFilters] = useState<ContractFilters>(initialFilters);
  const [pagination, setPagination] = useState<ContractPagination>({
    ...DEFAULT_PAGINATION,
    ...initialPagination,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  
  // Optimistic updates
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<ContractWithUI>>>(new Map());

  // Clear error when data changes
  useEffect(() => {
    if (contracts.length > 0 && error) {
      setError(null);
    }
  }, [contracts.length, error]);

  // Fetch contracts
  const fetchContracts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const searchParams: any = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      // Remove 'all' status from search params as API expects only specific statuses
      if (searchParams.status === 'all') {
        delete searchParams.status;
      }

      const [contractsResult, statsResult] = await Promise.all([
        contractsApi.getContracts(searchParams),
        contractsApi.getContractStats().catch(() => null)
      ]);

      const enhancedContracts = contractsResult.contracts.map(enhanceContractWithUI);
      console.log('useContracts: fetched contracts', enhancedContracts.length, enhancedContracts);
      setContracts(enhancedContracts);
      
      if (statsResult) {
        setStats(statsResult);
      }

      setPagination(prev => ({
        ...prev,
        total: contractsResult.total,
        totalPages: contractsResult.total_pages,
        hasNextPage: contractsResult.page < contractsResult.total_pages,
        hasPreviousPage: contractsResult.page > 1
      }));

    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось загрузить договоры';
      setError(errorMessage);
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchContracts(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchContracts]);

  // Apply optimistic updates
  const contractsWithOptimisticUpdates = useMemo(() => {
    return contracts.map(contract => {
      const optimisticUpdate = optimisticUpdates.get(contract.id);
      return optimisticUpdate ? { ...contract, ...optimisticUpdate } : contract;
    });
  }, [contracts, optimisticUpdates]);

  // Actions
  const refetch = useCallback(() => {
    console.log('useContracts: refetch called')
    return fetchContracts(true)
  }, [fetchContracts]);

  const createContract = useCallback(async (data: CreateContractData): Promise<Contract> => {
    setCreating(true);
    setError(null);

    try {
      const newContract = await contractsApi.createContract(data);
      
      if (enableOptimisticUpdates) {
        const enhanced = enhanceContractWithUI(newContract);
        setContracts(prev => [enhanced, ...prev]);
      } else {
        await refetch();
      }

      return newContract;
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось создать договор';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [enableOptimisticUpdates, refetch]);

  const updateContract = useCallback(async (id: string, data: UpdateContractData): Promise<Contract> => {
    setUpdating(true);
    setError(null);

    if (enableOptimisticUpdates) {
      setOptimisticUpdates(prev => new Map(prev).set(id, data as Partial<ContractWithUI>));
    }

    try {
      const updatedContract = await contractsApi.updateContract(id, data);
      
      setContracts(prev => prev.map(contract => 
        contract.id === id ? enhanceContractWithUI(updatedContract) : contract
      ));

      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      return updatedContract;
    } catch (err) {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось обновить договор';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [enableOptimisticUpdates]);

  const deleteContract = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    setError(null);

    if (enableOptimisticUpdates) {
      setContracts(prev => prev.filter(contract => contract.id !== id));
    }

    try {
      await contractsApi.deleteContract(id);
      
      if (!enableOptimisticUpdates) {
        setContracts(prev => prev.filter(contract => contract.id !== id));
      }

      setSelectedContracts(prev => prev.filter(selectedId => selectedId !== id));

    } catch (err) {
      if (enableOptimisticUpdates) {
        await refetch();
      }

      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось удалить договор';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [enableOptimisticUpdates, refetch]);

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<ContractFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Pagination
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(pagination.page + 1);
    }
  }, [pagination.hasNextPage, pagination.page, goToPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(pagination.page - 1);
    }
  }, [pagination.hasPreviousPage, pagination.page, goToPage]);

  const setPageSize = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Selection management
  const selectContract = useCallback((id: string) => {
    setSelectedContracts(prev => 
      prev.includes(id) ? prev : [...prev, id]
    );
  }, []);

  const deselectContract = useCallback((id: string) => {
    setSelectedContracts(prev => prev.filter(selectedId => selectedId !== id));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedContracts(contractsWithOptimisticUpdates.map(contract => contract.id));
  }, [contractsWithOptimisticUpdates]);

  const deselectAll = useCallback(() => {
    setSelectedContracts([]);
  }, []);

  const hasContracts = contractsWithOptimisticUpdates.length > 0;
  const isEmpty = !hasContracts && !loading;

  return {
    contracts: contractsWithOptimisticUpdates,
    stats,
    pagination,
    loading,
    refreshing,
    creating,
    updating,
    deleting,
    error,
    filters,
    setFilters: updateFilters,
    clearFilters,
    refetch,
    createContract,
    updateContract,
    deleteContract,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    hasContracts,
    isEmpty,
    selectedContracts,
    selectContract,
    deselectContract,
    selectAll,
    deselectAll
  };
}

// Single contract hook
export function useContract(id: string, options: UseContractOptions = {}): UseContractReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [contract, setContract] = useState<ContractWithUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contractData = await contractsApi.getContract(id);
      setContract(enhanceContractWithUI(contractData));
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось загрузить договор';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchContract, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchContract]);

  const refetch = useCallback(() => fetchContract(), [fetchContract]);

  const update = useCallback(async (data: UpdateContractData): Promise<Contract> => {
    setUpdating(true);
    setError(null);

    try {
      const updatedContract = await contractsApi.updateContract(id, data);
      setContract(enhanceContractWithUI(updatedContract));
      return updatedContract;
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось обновить договор';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [id]);

  const deleteContractById = useCallback(async (): Promise<void> => {
    setDeleting(true);
    setError(null);

    try {
      await contractsApi.deleteContract(id);
      setContract(null);
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось удалить договор';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [id]);

  const download = useCallback(async (): Promise<void> => {
    if (!contract?.file_url) {
      throw new Error('У договора нет прикрепленного файла');
    }

    setDownloading(true);
    setError(null);

    try {
      const blob = await contractsApi.downloadContract(id);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.file_name || `contract-${contract.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось скачать файл';
      setError(errorMessage);
      throw err;
    } finally {
      setDownloading(false);
    }
  }, [id, contract]);

  return {
    contract,
    loading,
    updating,
    deleting,
    downloading,
    error,
    refetch,
    update,
    delete: deleteContractById,
    download,
    hasData: contract !== null,
    canEdit: contract !== null && !deleting,
    canDelete: contract !== null && !updating && !deleting
  };
}

// Contract upload hook
export function useContractUpload(options: UseContractUploadOptions = {}): UseContractUploadReturn {
  const {
    onProgress,
    onError,
    onSuccess
  } = options;

  const [uploadState, setUploadState] = useState<FileUploadState>({
    uploading: false,
    progress: null,
    error: null
  });
  
  const [preview, setPreview] = useState<ContractFilePreview | null>(null);
  const [lastMetadata, setLastMetadata] = useState<ContractUploadMetadata | null>(null);

  const selectFile = useCallback(async (file: File) => {
    try {
      setUploadState(prev => ({ ...prev, error: null }));
      
      const filePreview = await generateContractPreview(file);
      setPreview(filePreview);
      
      if (!filePreview.isValid && filePreview.validationErrors.length > 0) {
        const error = filePreview.validationErrors.join(', ');
        setUploadState(prev => ({ ...prev, error }));
        if (onError) onError(error);
      }
    } catch (err) {
      const error = 'Не удалось обработать файл';
      setUploadState(prev => ({ ...prev, error }));
      if (onError) onError(error);
    }
  }, [onError]);

  const clearFile = useCallback(() => {
    cleanupFilePreview(preview);
    setPreview(null);
    setUploadState({
      uploading: false,
      progress: null,
      error: null
    });
  }, [preview]);

  const validateFile = useCallback((file: File) => {
    return validateContractFile(file);
  }, []);

  const upload = useCallback(async (metadata: ContractUploadMetadata): Promise<Contract> => {
    if (!preview || !preview.isValid) {
      throw new Error('Нет выбранного файла или файл невалидный');
    }

    setLastMetadata(metadata);
    setUploadState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null,
      abortController: new AbortController()
    }));

    const startTime = Date.now();

    try {
      const progressCallback = (progress: { loaded: number; total: number; percentage: number }) => {
        const enhancedProgress = calculateEnhancedProgress(progress.loaded, progress.total, startTime);
        setUploadState(prev => ({ ...prev, progress: enhancedProgress }));
        if (onProgress) onProgress(enhancedProgress);
      };

      let contract: Contract;

      if (preview.file.size > RESUMABLE_UPLOAD_THRESHOLD) {
        contract = await contractsApi.uploadContractChunked(preview.file, metadata, {
          onProgress: progressCallback,
          signal: uploadState.abortController?.signal
        });
      } else {
        contract = await contractsApi.uploadContract(preview.file, metadata, progressCallback);
      }

      if (onSuccess) onSuccess(contract);
      clearFile();
      return contract;

    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Не удалось загрузить файл';
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      if (onError) onError(errorMessage);
      throw err;
    } finally {
      setUploadState(prev => ({ ...prev, uploading: false, abortController: undefined }));
    }
  }, [preview, onProgress, onError, onSuccess, clearFile, uploadState.abortController]);

  const cancelUpload = useCallback(() => {
    if (uploadState.abortController) {
      uploadState.abortController.abort();
    }
    setUploadState(prev => ({ ...prev, uploading: false, abortController: undefined }));
  }, [uploadState.abortController]);

  const retryUpload = useCallback(async (): Promise<Contract> => {
    if (!lastMetadata) {
      throw new Error('Нет сохраненных метаданных для повтора загрузки');
    }
    return upload(lastMetadata);
  }, [lastMetadata, upload]);

  return {
    uploadState,
    preview,
    selectFile,
    clearFile,
    upload,
    cancelUpload,
    retryUpload,
    validateFile,
    canUpload: preview?.isValid === true && !uploadState.uploading,
    isUploading: uploadState.uploading,
    hasPreview: preview !== null,
    uploadProgress: uploadState.progress?.percentage || 0
  };
}

// Contract search hook
export function useContractSearch(options: UseContractSearchOptions = {}): UseContractSearchReturn {
  const {
    debounceMs = 300,
    maxHistory = 10,
    enableSuggestions = true,
    minQueryLength = 2
  } = options;

  const [searchState, setSearchState] = useState<ContractSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
    suggestions: [],
    history: [],
    hasMore: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('contract-search-history');
      if (saved) {
        const history = JSON.parse(saved);
        setSearchState(prev => ({ ...prev, history }));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  useEffect(() => {
    if (searchState.query.length < minQueryLength) {
      setSearchState(prev => ({ ...prev, results: [], loading: false, error: null }));
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const searchResult = await contractsApi.searchContracts({
          query: searchState.query,
          limit: 20
        });

        const enhancedResults = searchResult.contracts.map(enhanceContractWithUI);

        setSearchState(prev => ({
          ...prev,
          results: enhancedResults,
          loading: false,
          hasMore: searchResult.total > searchResult.contracts.length
        }));
      } catch (err) {
        const errorMessage = err instanceof ContractsApiError ? err.message : 'Ошибка поиска';
        setSearchState(prev => ({ ...prev, error: errorMessage, loading: false }));
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchState.query, minQueryLength, debounceMs]);

  const search = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      error: null,
      loading: false
    }));
  }, []);

  const loadMore = useCallback(async (): Promise<void> => {
    if (!searchState.hasMore || searchState.loading) return;

    setSearchState(prev => ({ ...prev, loading: true }));

    try {
      const searchResult = await contractsApi.searchContracts({
        query: searchState.query,
        limit: 20,
        page: Math.floor(searchState.results.length / 20) + 1
      });

      const enhancedResults = searchResult.contracts.map(enhanceContractWithUI);

      setSearchState(prev => ({
        ...prev,
        results: [...prev.results, ...enhancedResults],
        loading: false,
        hasMore: searchResult.total > prev.results.length + searchResult.contracts.length
      }));
    } catch (err) {
      const errorMessage = err instanceof ContractsApiError ? err.message : 'Ошибка загрузки';
      setSearchState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [searchState.hasMore, searchState.loading, searchState.query, searchState.results.length]);

  const addToHistory = useCallback((query: string) => {
    if (!query.trim() || query.length < minQueryLength) return;

    setSearchState(prev => {
      const newHistory = [query, ...prev.history.filter(h => h !== query)].slice(0, maxHistory);
      
      try {
        localStorage.setItem('contract-search-history', JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }

      return { ...prev, history: newHistory };
    });
  }, [minQueryLength, maxHistory]);

  const clearHistory = useCallback(() => {
    setSearchState(prev => ({ ...prev, history: [] }));
    try {
      localStorage.removeItem('contract-search-history');
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  const getSuggestions = useCallback((query: string): string[] => {
    if (!enableSuggestions || query.length < minQueryLength) return [];
    
    return searchState.history
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }, [enableSuggestions, minQueryLength, searchState.history]);

  return {
    searchState,
    search,
    clearSearch,
    loadMore,
    addToHistory,
    clearHistory,
    getSuggestions,
    hasResults: searchState.results.length > 0,
    hasMore: searchState.hasMore,
    isSearching: searchState.loading
  };
} 