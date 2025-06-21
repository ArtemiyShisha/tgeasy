// Contracts API client for TGeasy frontend
import { 
  Contract, 
  ContractSearchParams, 
  ContractSearchResult, 
  ContractStats 
} from '@/types/contract';
import { 
  ContractsApiResponse, 
  ContractApiResponse, 
  ContractUploadResponse, 
  ContractStatsResponse,
  CreateContractData,
  UpdateContractData,
  ContractUploadMetadata,
  ContractError
} from '@/types/contract-ui';
import { 
  ChunkInfo, 
  createFileChunks, 
  CHUNK_SIZE,
  isRetryableError,
  getRetryDelay,
  createUploadError
} from '@/utils/file-upload-helpers';
import { createClient } from '@/lib/supabase/client';

// API base configuration
const API_BASE = '/api/contracts';

// Helper function to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

// Error handling
export class ContractsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ContractsApiError';
  }
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: any = null;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
      errorDetails = errorData;
    } catch {
      // Response is not JSON, use status text
    }
    
    throw new ContractsApiError(
      errorMessage,
      response.status,
      response.status.toString(),
      errorDetails
    );
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new ContractsApiError(
      data.error || 'API request failed',
      response.status,
      data.code,
      data
    );
  }
  
  return data.data;
}

// Build query string from parameters
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
}

// Retry logic for API calls
async function retryApiCall<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }
      
      // Wait before retry
      const delay = getRetryDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Main API client class
export class ContractsApi {
  
  /**
   * Get contracts with filtering and pagination
   */
  async getContracts(params: ContractSearchParams = {}): Promise<ContractSearchResult> {
    const queryString = buildQueryString(params);
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    return retryApiCall(async () => {
      const headers = await getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      return handleApiResponse<ContractSearchResult>(response);
    });
  }
  
  /**
   * Get a single contract by ID
   */
  async getContract(id: string): Promise<Contract> {
    return retryApiCall(async () => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return handleApiResponse<Contract>(response);
    });
  }
  
  /**
   * Create a new contract without file
   */
  async createContract(data: CreateContractData): Promise<Contract> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleApiResponse<Contract>(response);
  }
  
  /**
   * Update an existing contract
   */
  async updateContract(id: string, data: UpdateContractData): Promise<Contract> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return handleApiResponse<Contract>(response);
  }
  
  /**
   * Delete a contract
   */
  async deleteContract(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new ContractsApiError(
        `Failed to delete contract: ${response.statusText}`,
        response.status
      );
    }
  }
  
  /**
   * Upload a contract file with metadata (simple upload)
   */
  async uploadContract(
    file: File, 
    metadata: ContractUploadMetadata,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<Contract> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage
            });
          }
        });
      }
      
      // Handle completion
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              resolve(data.data);
            } else {
              reject(new ContractsApiError(
                data.error || 'Upload failed',
                xhr.status,
                data.code,
                data
              ));
            }
          } catch (error) {
            reject(new ContractsApiError(
              'Invalid response format',
              xhr.status
            ));
          }
        } else {
          reject(new ContractsApiError(
            `Upload failed: ${xhr.statusText}`,
            xhr.status
          ));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new ContractsApiError('Network error during upload'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new ContractsApiError('Upload was aborted'));
      });
      
      // Start upload
      xhr.open('POST', `${API_BASE}/upload`);
      xhr.send(formData);
    });
  }
  
  /**
   * Upload a large contract file with chunked upload
   */
  async uploadContractChunked(
    file: File,
    metadata: ContractUploadMetadata,
    options: {
      chunkSize?: number;
      onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
      onChunkProgress?: (chunkIndex: number, totalChunks: number) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<Contract> {
    const { chunkSize = CHUNK_SIZE, onProgress, onChunkProgress, signal } = options;
    
    // Create chunks
    const chunks = createFileChunks(file, chunkSize);
    const uploadId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    let uploadedBytes = 0;
    
    // Upload each chunk
    for (let i = 0; i < chunks.length; i++) {
      if (signal?.aborted) {
        throw new ContractsApiError('Upload was aborted');
      }
      
      const chunk = chunks[i];
      
      // Create form data for chunk
      const formData = new FormData();
      formData.append('chunk', chunk.chunk);
      formData.append('chunkIndex', chunk.index.toString());
      formData.append('totalChunks', chunks.length.toString());
      formData.append('uploadId', uploadId);
      formData.append('fileName', file.name);
      
      // Add metadata on first chunk
      if (i === 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      // Upload chunk with retry
      await retryApiCall(async () => {
        const response = await fetch(`${API_BASE}/upload/chunk`, {
          method: 'POST',
          body: formData,
          signal
        });
        
        if (!response.ok) {
          throw new ContractsApiError(
            `Chunk upload failed: ${response.statusText}`,
            response.status
          );
        }
        
        return response.json();
      });
      
      // Update progress
      uploadedBytes += chunk.size;
      
      if (onProgress) {
        onProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100)
        });
      }
      
      if (onChunkProgress) {
        onChunkProgress(i + 1, chunks.length);
      }
    }
    
    // Finalize upload
    const finalizeResponse = await fetch(`${API_BASE}/upload/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        totalChunks: chunks.length
      }),
      signal
    });
    
    return handleApiResponse<Contract>(finalizeResponse);
  }
  
  /**
   * Download a contract file
   */
  async downloadContract(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/${id}/download`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new ContractsApiError(
        `Download failed: ${response.statusText}`,
        response.status
      );
    }
    
    return response.blob();
  }
  
  /**
   * Search contracts with debounced queries
   */
  async searchContracts(params: ContractSearchParams): Promise<ContractSearchResult> {
    return this.getContracts(params);
  }
  
  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ContractStats> {
    return retryApiCall(async () => {
      const response = await fetch(`${API_BASE}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return handleApiResponse<ContractStats>(response);
    });
  }
  
  /**
   * Get contracts that are expiring soon
   */
  async getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
    return retryApiCall(async () => {
      const response = await fetch(`${API_BASE}/expiring?days=${daysAhead}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return handleApiResponse<Contract[]>(response);
    });
  }
  
  /**
   * Bulk delete contracts
   */
  async deleteContracts(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    
    if (!response.ok) {
      throw new ContractsApiError(
        `Bulk delete failed: ${response.statusText}`,
        response.status
      );
    }
  }
  
  /**
   * Update contract status
   */
  async updateContractStatus(id: string, status: 'draft' | 'active' | 'expired'): Promise<Contract> {
    return this.updateContract(id, { status });
  }
}

// Create singleton instance
export const contractsApi = new ContractsApi();

// Export individual functions for convenience
export const {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  uploadContract,
  uploadContractChunked,
  downloadContract,
  searchContracts,
  getContractStats,
  getExpiringContracts,
  deleteContracts,
  updateContractStatus
} = contractsApi; 