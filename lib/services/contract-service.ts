import { contractRepository } from '@/lib/repositories/contract-repository';
import { fileUploadService } from '@/lib/services/file-upload-service';
import { 
  Contract, 
  CreateContractDTO, 
  UpdateContractDTO, 
  ContractSearchParams, 
  ContractSearchResult,
  ContractStats,
  ContractUploadDTO,
  FileUploadResult,
  ContractValidationError
} from '@/types/contract';
import { 
  validateCreateContract, 
  validateUpdateContract, 
  validateSearchParams,
  sanitizeContractData,
  isContractExpired,
  getContractExpiryStatus
} from '@/utils/contract-validation';

/**
 * Contract Service - Business logic for contract management
 * Orchestrates repository operations, file uploads, and validation
 */
export class ContractService {
  
  /**
   * Creates a new contract without file
   */
  async createContract(userId: string, data: CreateContractDTO): Promise<{
    contract: Contract;
    validation_errors: ContractValidationError[];
  }> {
    console.log('[ContractService] Creating contract for user:', userId);
    
    // Sanitize input data
    const sanitizedData = sanitizeContractData(data);
    
    // Validate data
    const validationErrors = validateCreateContract(sanitizedData);
    if (validationErrors.length > 0) {
      console.warn('[ContractService] Validation failed:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    try {
      // Create contract in database
      const contract = await contractRepository.create({
        ...sanitizedData,
        user_id: userId
      });

      console.log('[ContractService] Contract created successfully:', contract.id);
      return {
        contract,
        validation_errors: []
      };
    } catch (error) {
      console.error('[ContractService] Contract creation failed:', error);
      throw new Error('Failed to create contract');
    }
  }

  /**
   * Creates a contract with file upload
   */
  async createContractWithFile(userId: string, data: ContractUploadDTO): Promise<{
    contract: Contract;
    upload_result: FileUploadResult;
    validation_errors: ContractValidationError[];
  }> {
    console.log('[ContractService] Creating contract with file for user:', userId);
    
    // Sanitize input data
    const sanitizedData = sanitizeContractData(data);
    
    // Validate contract data
    const validationErrors = validateCreateContract(sanitizedData);
    if (validationErrors.length > 0) {
      console.warn('[ContractService] Contract validation failed:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    try {
      // First create the contract
      const contract = await contractRepository.create({
        title: sanitizedData.title,
        advertiser_name: sanitizedData.advertiser_name,
        advertiser_inn: sanitizedData.advertiser_inn,
        contract_type: sanitizedData.contract_type || 'direct',
        okved_category: sanitizedData.okved_category,
        advertiser_legal_address: sanitizedData.advertiser_legal_address,
        advertiser_contact_person: sanitizedData.advertiser_contact_person,
        advertiser_phone: sanitizedData.advertiser_phone,
        advertiser_email: sanitizedData.advertiser_email,
        contract_number: sanitizedData.contract_number,
        contract_date: sanitizedData.contract_date,
        expires_at: sanitizedData.expires_at,
        user_id: userId
      });

      console.log('[ContractService] Contract created, uploading file...');

      // Upload file
      const uploadResult = await fileUploadService.uploadContractFile(data.file, userId);

      // Update contract with file metadata
      const updatedContract = await contractRepository.updateFileMetadata(
        contract.id,
        userId,
        {
          file_url: uploadResult.file_url,
          ...uploadResult.metadata
        }
      );

      console.log('[ContractService] Contract with file created successfully');
      return {
        contract: updatedContract,
        upload_result: uploadResult,
        validation_errors: []
      };
    } catch (error) {
      console.error('[ContractService] Contract with file creation failed:', error);
      throw error;
    }
  }

  /**
   * Gets a contract by ID
   */
  async getContract(userId: string, contractId: string): Promise<Contract | null> {
    console.log('[ContractService] Getting contract:', contractId);
    
    try {
      const contract = await contractRepository.findById(contractId, userId);
      
      if (!contract) {
        console.log('[ContractService] Contract not found:', contractId);
        return null;
      }

      // Add expiry status information
      const expiryStatus = getContractExpiryStatus(contract);
      console.log('[ContractService] Contract expiry status:', expiryStatus.status);

      return contract;
    } catch (error) {
      console.error('[ContractService] Failed to get contract:', error);
      throw new Error('Failed to retrieve contract');
    }
  }

  /**
   * Updates a contract
   */
  async updateContract(userId: string, contractId: string, data: UpdateContractDTO): Promise<Contract> {
    console.log('[ContractService] Updating contract:', contractId);
    
    // Sanitize input data
    const sanitizedData = sanitizeContractData(data);
    
    // Validate data
    const validationErrors = validateUpdateContract(sanitizedData);
    if (validationErrors.length > 0) {
      console.warn('[ContractService] Update validation failed:', validationErrors);
      throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    try {
      // Check if contract exists
      const existingContract = await contractRepository.findById(contractId, userId);
      if (!existingContract) {
        throw new Error('Contract not found');
      }

      // Update contract
      const updatedContract = await contractRepository.update(contractId, userId, sanitizedData);

      console.log('[ContractService] Contract updated successfully');
      return updatedContract;
    } catch (error) {
      console.error('[ContractService] Contract update failed:', error);
      throw error;
    }
  }

  /**
   * Deletes a contract
   */
  async deleteContract(userId: string, contractId: string): Promise<void> {
    console.log('[ContractService] Deleting contract:', contractId);
    
    try {
      // Check if contract exists and get file info
      const existingContract = await contractRepository.findById(contractId, userId);
      if (!existingContract) {
        throw new Error('Contract not found');
      }

      // Delete file from storage if exists
      if (existingContract.file_url) {
        try {
          // Extract file path from URL
          const filePath = this.extractFilePathFromUrl(existingContract.file_url);
          await fileUploadService.deleteContractFile(filePath);
          console.log('[ContractService] Contract file deleted from storage');
        } catch (fileError) {
          console.warn('[ContractService] Failed to delete file from storage:', fileError);
          // Continue with contract deletion even if file deletion fails
        }
      }

      // Delete contract from database
      await contractRepository.delete(contractId, userId);

      console.log('[ContractService] Contract deleted successfully');
    } catch (error) {
      console.error('[ContractService] Contract deletion failed:', error);
      throw error;
    }
  }

  /**
   * Searches contracts with pagination and filtering
   */
  async searchContracts(userId: string, params: ContractSearchParams): Promise<ContractSearchResult> {
    console.log('[ContractService] Searching contracts for user:', userId);
    
    // Validate search parameters
    const validationErrors = validateSearchParams(params);
    if (validationErrors.length > 0) {
      console.warn('[ContractService] Search validation failed:', validationErrors);
      throw new Error(`Search validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    try {
      const result = await contractRepository.search(userId, params);
      
      // Add expiry status to each contract
      const contractsWithStatus = result.contracts.map(contract => ({
        ...contract,
        expiry_status: getContractExpiryStatus(contract)
      }));

      console.log(`[ContractService] Search completed: ${result.contracts.length} contracts found`);
      return {
        ...result,
        contracts: contractsWithStatus
      };
    } catch (error) {
      console.error('[ContractService] Contract search failed:', error);
      throw new Error('Failed to search contracts');
    }
  }

  /**
   * Gets contract statistics
   */
  async getContractStats(userId: string): Promise<ContractStats> {
    console.log('[ContractService] Getting contract stats for user:', userId);
    
    try {
      const stats = await contractRepository.getStats(userId);
      
      // Add additional computed stats
      const enhancedStats = {
        ...stats,
        average_file_size: stats.total > 0 ? Math.round(stats.total_file_size / stats.total) : 0,
        storage_used_mb: Math.round(stats.total_file_size / 1024 / 1024 * 100) / 100
      };

      console.log('[ContractService] Stats retrieved successfully');
      return enhancedStats;
    } catch (error) {
      console.error('[ContractService] Failed to get contract stats:', error);
      throw new Error('Failed to retrieve contract statistics');
    }
  }

  /**
   * Finds contracts by advertiser INN
   */
  async getContractsByAdvertiser(userId: string, advertiser_inn: string): Promise<Contract[]> {
    console.log('[ContractService] Getting contracts for advertiser INN:', advertiser_inn);
    
    try {
      const contracts = await contractRepository.findByAdvertiserINN(userId, advertiser_inn);
      
      console.log(`[ContractService] Found ${contracts.length} contracts for advertiser`);
      return contracts;
    } catch (error) {
      console.error('[ContractService] Failed to get contracts by advertiser:', error);
      throw new Error('Failed to retrieve contracts for advertiser');
    }
  }

  /**
   * Gets expiring contracts
   */
  async getExpiringContracts(userId: string, daysAhead: number = 30): Promise<Contract[]> {
    console.log('[ContractService] Getting contracts expiring within', daysAhead, 'days');
    
    try {
      const contracts = await contractRepository.findExpiring(userId, daysAhead);
      
      // Add expiry status to each contract
      const contractsWithStatus = contracts.map(contract => ({
        ...contract,
        expiry_status: getContractExpiryStatus(contract)
      }));

      console.log(`[ContractService] Found ${contracts.length} expiring contracts`);
      return contractsWithStatus;
    } catch (error) {
      console.error('[ContractService] Failed to get expiring contracts:', error);
      throw new Error('Failed to retrieve expiring contracts');
    }
  }

  /**
   * Marks expired contracts
   */
  async processExpiredContracts(userId: string): Promise<number> {
    console.log('[ContractService] Processing expired contracts for user:', userId);
    
    try {
      const updatedCount = await contractRepository.markExpiredContracts(userId);
      
      console.log(`[ContractService] Marked ${updatedCount} contracts as expired`);
      return updatedCount;
    } catch (error) {
      console.error('[ContractService] Failed to process expired contracts:', error);
      throw new Error('Failed to process expired contracts');
    }
  }

  /**
   * Uploads a file to existing contract
   */
  async uploadFileToContract(userId: string, contractId: string, file: File): Promise<{
    contract: Contract;
    upload_result: FileUploadResult;
  }> {
    console.log('[ContractService] Uploading file to contract:', contractId);
    
    try {
      // Check if contract exists
      const existingContract = await contractRepository.findById(contractId, userId);
      if (!existingContract) {
        throw new Error('Contract not found');
      }

      // Delete old file if exists
      if (existingContract.file_url) {
        try {
          const filePath = this.extractFilePathFromUrl(existingContract.file_url);
          await fileUploadService.deleteContractFile(filePath);
          console.log('[ContractService] Old file deleted');
        } catch (fileError) {
          console.warn('[ContractService] Failed to delete old file:', fileError);
        }
      }

      // Upload new file
      const uploadResult = await fileUploadService.uploadContractFile(file, userId);

      // Update contract with file metadata
      const updatedContract = await contractRepository.updateFileMetadata(
        contractId,
        userId,
        {
          file_url: uploadResult.file_url,
          ...uploadResult.metadata
        }
      );

      console.log('[ContractService] File uploaded to contract successfully');
      return {
        contract: updatedContract,
        upload_result: uploadResult
      };
    } catch (error) {
      console.error('[ContractService] File upload to contract failed:', error);
      throw error;
    }
  }

  /**
   * Gets a secure file URL for contract
   */
  async getSecureFileUrl(userId: string, contractId: string): Promise<string> {
    console.log('[ContractService] Getting secure file URL for contract:', contractId);
    
    try {
      // Check if contract exists and user has access
      const contract = await contractRepository.findById(contractId, userId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.file_url) {
        throw new Error('Contract has no file attached');
      }

      // Generate signed URL
      const filePath = this.extractFilePathFromUrl(contract.file_url);
      const signedUrl = await fileUploadService.getSignedUrl(filePath, 3600); // 1 hour expiry

      console.log('[ContractService] Secure file URL generated');
      return signedUrl;
    } catch (error) {
      console.error('[ContractService] Failed to get secure file URL:', error);
      throw error;
    }
  }

  /**
   * Performs full-text search in contract content
   */
  async searchInContent(userId: string, query: string): Promise<Contract[]> {
    console.log('[ContractService] Performing full-text search:', query);
    
    try {
      const searchParams: ContractSearchParams = {
        query,
        limit: 50 // Return more results for content search
      };

      const result = await contractRepository.search(userId, searchParams);
      
      console.log(`[ContractService] Content search found ${result.contracts.length} contracts`);
      return result.contracts;
    } catch (error) {
      console.error('[ContractService] Content search failed:', error);
      throw new Error('Failed to search in contract content');
    }
  }

  /**
   * Extracts file path from Supabase Storage URL
   */
  private extractFilePathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      // Remove '/storage/v1/object/public/contracts/' prefix
      const filePathIndex = pathSegments.findIndex(segment => segment === 'contracts') + 1;
      return pathSegments.slice(filePathIndex).join('/');
    } catch (error) {
      console.error('[ContractService] Failed to extract file path from URL:', error);
      throw new Error('Invalid file URL');
    }
  }

  /**
   * Validates contract access for user
   */
  async validateAccess(userId: string, contractId: string): Promise<boolean> {
    try {
      const contract = await contractRepository.findById(contractId, userId);
      return contract !== null;
    } catch (error) {
      console.error('[ContractService] Access validation failed:', error);
      return false;
    }
  }

  /**
   * Gets user storage information
   */
  async getUserStorageInfo(userId: string): Promise<{
    total_files: number;
    total_size: number;
    storage_limit: number;
    storage_used_percentage: number;
    contracts_count: number;
  }> {
    console.log('[ContractService] Getting storage info for user:', userId);
    
    try {
      const [storageStats, contractStats] = await Promise.all([
        fileUploadService.getUserStorageStats(userId),
        contractRepository.getStats(userId)
      ]);

      return {
        ...storageStats,
        contracts_count: contractStats.total
      };
    } catch (error) {
      console.error('[ContractService] Failed to get storage info:', error);
      throw new Error('Failed to retrieve storage information');
    }
  }
}

// Export singleton instance
export const contractService = new ContractService(); 