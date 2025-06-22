// Contract UI types for TGeasy frontend
import { Contract, ContractStatus, ContractSearchParams, ContractSearchResult, ContractStats, ContractType } from './contract';

// UI-specific contract extensions
export interface ContractWithUI extends Contract {
  // UI computed properties
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  expiryStatus?: 'active' | 'expiring' | 'expired';
  statusColor?: 'green' | 'yellow' | 'red' | 'gray';
  formattedFileSize?: string;
  formattedCreatedAt?: string;
  formattedExpiresAt?: string;
}

// Contract filters for UI
export interface ContractFilters {
  status?: ContractStatus | 'all';
  advertiser_name?: string;
  advertiser_inn?: string;
  query?: string;
  created_after?: string;
  created_before?: string;
  expires_after?: string;
  expires_before?: string;
  has_file?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'expires_at' | 'title' | 'advertiser_name';
  sortOrder?: 'asc' | 'desc';
}

// Pagination for UI
export interface ContractPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// File upload types
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

export interface FileUploadState {
  uploading: boolean;
  progress: FileUploadProgress | null;
  error: string | null;
  abortController?: AbortController;
}

export interface ContractFilePreview {
  file: File;
  url: string;
  type: 'pdf' | 'doc' | 'docx' | 'image' | 'other';
  size: number;
  formattedSize: string;
  isValid: boolean;
  validationErrors: string[];
}

// Search types
export interface ContractSearchState {
  query: string;
  results: ContractWithUI[];
  loading: boolean;
  error: string | null;
  suggestions: string[];
  history: string[];
  hasMore: boolean;
}

export interface ContractSearchFilters extends ContractFilters {
  limit?: number;
  offset?: number;
}

// Hook options
export interface UseContractsOptions {
  filters?: ContractFilters;
  pagination?: {
    page?: number;
    limit?: number;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableOptimisticUpdates?: boolean;
}

export interface UseContractOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseContractUploadOptions {
  maxFileSize?: number; // bytes
  allowedTypes?: string[];
  chunkSize?: number; // bytes for chunked upload
  enableResume?: boolean;
  onProgress?: (progress: FileUploadProgress) => void;
  onError?: (error: string) => void;
  onSuccess?: (contract: Contract) => void;
}

export interface UseContractSearchOptions {
  debounceMs?: number;
  maxHistory?: number;
  enableSuggestions?: boolean;
  minQueryLength?: number;
}

// Hook return types
export interface UseContractsReturn {
  // Data
  contracts: ContractWithUI[];
  stats: ContractStats | null;
  
  // Pagination
  pagination: ContractPagination;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Filters
  filters: ContractFilters;
  setFilters: (filters: Partial<ContractFilters>) => void;
  clearFilters: () => void;
  
  // Actions
  refetch: () => Promise<void>;
  createContract: (data: CreateContractData) => Promise<Contract>;
  updateContract: (id: string, data: UpdateContractData) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;
  
  // Pagination
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  
  // UI helpers
  hasContracts: boolean;
  isEmpty: boolean;
  selectedContracts: string[];
  selectContract: (id: string) => void;
  deselectContract: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
}

export interface UseContractReturn {
  // Data
  contract: ContractWithUI | null;
  
  // Loading states
  loading: boolean;
  updating: boolean;
  deleting: boolean;
  downloading: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  update: (data: UpdateContractData) => Promise<Contract>;
  delete: () => Promise<void>;
  download: () => Promise<void>;
  
  // UI helpers
  hasData: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UseContractUploadReturn {
  // Upload state
  uploadState: FileUploadState;
  
  // File preview
  preview: ContractFilePreview | null;
  
  // Actions
  selectFile: (file: File) => void;
  clearFile: () => void;
  upload: (metadata: ContractUploadMetadata) => Promise<Contract>;
  cancelUpload: () => void;
  retryUpload: () => Promise<Contract>;
  
  // Validation
  validateFile: (file: File) => { isValid: boolean; errors: string[] };
  
  // UI helpers
  canUpload: boolean;
  isUploading: boolean;
  hasPreview: boolean;
  uploadProgress: number;
}

export interface UseContractSearchReturn {
  // Search state
  searchState: ContractSearchState;
  
  // Actions
  search: (query: string) => void;
  clearSearch: () => void;
  loadMore: () => Promise<void>;
  
  // History
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  
  // Suggestions
  getSuggestions: (query: string) => string[];
  
  // UI helpers
  hasResults: boolean;
  hasMore: boolean;
  isSearching: boolean;
}

// API client types
export interface CreateContractData {
  title: string;
  advertiser_name: string;
  advertiser_inn: string;
  contract_type: ContractType;
  advertiser_legal_address?: string;
  advertiser_contact_person?: string;
  advertiser_phone?: string;
  advertiser_email?: string;
  contract_number?: string;
  contract_date?: string;
  contract_amount?: number;
  contract_currency?: 'RUB' | 'USD' | 'EUR';
  expires_at?: string;
}

export interface UpdateContractData {
  title?: string;
  advertiser_name?: string;
  advertiser_inn?: string;
  status?: ContractStatus;
  expires_at?: string | null;
}

export interface ContractUploadMetadata {
  title: string;
  advertiser_name: string;
  advertiser_inn: string;
  expires_at?: string;
}

export interface ContractsApiResponse {
  success: boolean;
  data?: ContractSearchResult;
  error?: string;
}

export interface ContractApiResponse {
  success: boolean;
  data?: Contract;
  error?: string;
}

export interface ContractUploadResponse {
  success: boolean;
  data?: Contract;
  error?: string;
  validation_errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ContractStatsResponse {
  success: boolean;
  data?: ContractStats;
  error?: string;
}

// Error types
export interface ContractError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility types
export type ContractSortField = 'created_at' | 'updated_at' | 'expires_at' | 'title' | 'advertiser_name';
export type ContractSortOrder = 'asc' | 'desc';

// Selection types for bulk operations
export interface ContractSelection {
  selectedIds: string[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

// Export utility functions types
export interface ContractUIHelpers {
  formatFileSize: (bytes: number) => string;
  formatDate: (date: string) => string;
  getStatusColor: (status: ContractStatus) => 'green' | 'yellow' | 'red' | 'gray';
  getExpiryStatus: (expiresAt?: string) => 'active' | 'expiring' | 'expired';
  isExpired: (expiresAt?: string) => boolean;
  isExpiringSoon: (expiresAt?: string, days?: number) => boolean;
  validateContractFile: (file: File) => { isValid: boolean; errors: string[] };
  generateContractPreview: (file: File) => Promise<ContractFilePreview>;
} 