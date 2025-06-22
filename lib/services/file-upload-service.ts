import { createClient as createSupabaseBackendClient } from '@supabase/supabase-js';
import { 
  FileUploadResult, 
  ContractFileMetadata, 
  TextExtractionResult, 
  ThumbnailGenerationResult,
  FileProcessingOptions,
  SUPPORTED_FILE_TYPES,
  CONTRACT_CONSTANTS 
} from '@/types/contract';
import { validateFile } from '@/utils/contract-validation';

/**
 * File Upload Service for Contract Management
 * Handles file uploads to Supabase Storage with text extraction and thumbnail generation
 */
export class FileUploadService {
  private bucketName = 'contracts';
  
  private getSupabaseClient() {
    // Use service-role key to bypass RLS for storage operations (server-side only)
    return createSupabaseBackendClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  /**
   * Uploads a contract file with full processing
   */
  async uploadContractFile(
    file: File, 
    userId: string, 
    options: Partial<FileProcessingOptions> = {}
  ): Promise<FileUploadResult> {
    // Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      throw new Error(`File validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    const processingOptions: FileProcessingOptions = {
      extract_text: true,
      generate_thumbnail: true,
      virus_scan: false, // TODO: Implement virus scanning
      max_file_size: CONTRACT_CONSTANTS.MAX_FILE_SIZE,
      allowed_mime_types: Object.keys(SUPPORTED_FILE_TYPES),
      ...options
    };

    try {
      // Generate unique file path
      const fileExtension = this.getFileExtension(file.name);
      const fileName = this.generateFileName(file.name, userId);
      const filePath = `${userId}/${fileName}`;

      console.log(`[FileUpload] Starting upload for file: ${file.name} (${file.size} bytes)`);

      // Upload file to Supabase Storage
      const supabase = this.getSupabaseClient();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[FileUpload] Upload error:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      console.log('[FileUpload] File uploaded successfully:', uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uploadData.path);

      // Process file metadata
      const metadata: ContractFileMetadata = {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      };

      // Extract text if requested
      if (processingOptions.extract_text) {
        try {
          console.log('[FileUpload] Starting text extraction...');
          const textResult = await this.extractTextFromFile(file);
          metadata.extracted_text = textResult.text;
          metadata.page_count = textResult.page_count;
          console.log(`[FileUpload] Text extracted: ${textResult.word_count} words, ${textResult.page_count} pages`);
        } catch (error) {
          console.warn('[FileUpload] Text extraction failed:', error);
          // Continue without text extraction
        }
      }

      // Generate thumbnail if requested
      if (processingOptions.generate_thumbnail && file.type === 'application/pdf') {
        try {
          console.log('[FileUpload] Starting thumbnail generation...');
          const thumbnailResult = await this.generateThumbnail(file, userId);
          metadata.thumbnail_url = thumbnailResult.thumbnail_url;
          console.log('[FileUpload] Thumbnail generated:', thumbnailResult.thumbnail_url);
        } catch (error) {
          console.warn('[FileUpload] Thumbnail generation failed:', error);
          // Continue without thumbnail
        }
      }

      const result: FileUploadResult = {
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
        metadata
      };

      console.log('[FileUpload] Upload completed successfully');
      return result;

    } catch (error) {
      console.error('[FileUpload] Upload process failed:', error);
      throw error;
    }
  }

  /**
   * Deletes a contract file from storage
   */
  async deleteContractFile(filePath: string): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`File deletion failed: ${error.message}`);
      }

      console.log('[FileUpload] File deleted successfully:', filePath);
    } catch (error) {
      console.error('[FileUpload] File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Gets a signed URL for secure file access
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600, downloadName?: string): Promise<string> {
    try {
      const supabase = this.getSupabaseClient();
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(
          filePath,
          expiresIn,
          downloadName ? { download: downloadName } : undefined
        );

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[FileUpload] Signed URL creation failed:', error);
      throw error;
    }
  }

  /**
   * Extracts text from uploaded file
   */
  private async extractTextFromFile(file: File): Promise<TextExtractionResult> {
    try {
      // For now, we'll implement a basic text extraction
      // In production, you might want to use services like:
      // - PDF.js for PDF files
      // - mammoth.js for DOCX files
      // - External OCR services
      
      if (file.type === 'application/pdf') {
        return await this.extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await this.extractTextFromDOCX(file);
      } else if (file.type === 'application/msword') {
        return await this.extractTextFromDOC(file);
      }

      throw new Error('Unsupported file type for text extraction');
    } catch (error) {
      console.error('[TextExtraction] Failed:', error);
      throw error;
    }
  }

  /**
   * Extracts text from PDF file
   */
  private async extractTextFromPDF(file: File): Promise<TextExtractionResult> {
    // TODO: Implement PDF text extraction using PDF.js or similar
    // For now, return placeholder data
    console.log('[TextExtraction] PDF extraction not yet implemented');
    
    return {
      text: `[PDF Content Placeholder] File: ${file.name}`,
      page_count: 1,
      word_count: 10,
      language: 'ru'
    };
  }

  /**
   * Extracts text from DOCX file
   */
  private async extractTextFromDOCX(file: File): Promise<TextExtractionResult> {
    // TODO: Implement DOCX text extraction using mammoth.js or similar
    console.log('[TextExtraction] DOCX extraction not yet implemented');
    
    return {
      text: `[DOCX Content Placeholder] File: ${file.name}`,
      page_count: 1,
      word_count: 10,
      language: 'ru'
    };
  }

  /**
   * Extracts text from DOC file
   */
  private async extractTextFromDOC(file: File): Promise<TextExtractionResult> {
    // TODO: Implement DOC text extraction
    console.log('[TextExtraction] DOC extraction not yet implemented');
    
    return {
      text: `[DOC Content Placeholder] File: ${file.name}`,
      page_count: 1,
      word_count: 10,
      language: 'ru'
    };
  }

  /**
   * Generates thumbnail for PDF files
   */
  private async generateThumbnail(file: File, userId: string): Promise<ThumbnailGenerationResult> {
    try {
      // TODO: Implement PDF thumbnail generation using PDF.js or Canvas API
      // For now, return placeholder
      console.log('[Thumbnail] Generation not yet implemented');
      
      const thumbnailPath = `${userId}/thumbnails/thumb_${Date.now()}.jpg`;
      
      return {
        thumbnail_url: `/api/contracts/thumbnail/${thumbnailPath}`,
        width: 200,
        height: 280
      };
    } catch (error) {
      console.error('[Thumbnail] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Generates unique file name safe for Supabase Storage (ASCII, no spaces)
   */
  private generateFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(originalName);

    // Take base name without extension and limit length
    let baseName = originalName.replace(/\.[^/.]+$/, "").substring(0, 50);

    // Normalize & transliterate to remove diacritics, then replace non-alphanumeric with underscores
    baseName = baseName
      .normalize('NFD') // split accented characters
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-zA-Z0-9_-]+/g, '_') // replace anything not alphanum, dash, underscore
      .replace(/_+/g, '_') // collapse multiple underscores
      .replace(/^_+|_+$/g, '') // trim underscores at ends
      .toLowerCase();

    if (baseName.length === 0) {
      baseName = 'file';
    }

    return `${timestamp}_${randomString}_${baseName}${extension}`;
  }

  /**
   * Gets file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  /**
   * Validates file against virus scanning (placeholder)
   */
  private async scanFileForViruses(file: File): Promise<boolean> {
    // TODO: Implement virus scanning using ClamAV or similar service
    console.log('[VirusScan] Scanning not yet implemented');
    return true; // Assume clean for now
  }

  /**
   * Gets file storage stats for user
   */
  async getUserStorageStats(userId: string): Promise<{
    total_files: number;
    total_size: number;
    storage_limit: number;
    storage_used_percentage: number;
  }> {
    try {
      const supabase = this.getSupabaseClient();
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId);

      if (error) {
        throw new Error(`Failed to get storage stats: ${error.message}`);
      }

      const totalSize = files?.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0) || 0;
      const storageLimit = 1024 * 1024 * 1024; // 1GB limit per user

      return {
        total_files: files?.length || 0,
        total_size: totalSize,
        storage_limit: storageLimit,
        storage_used_percentage: (totalSize / storageLimit) * 100
      };
    } catch (error) {
      console.error('[StorageStats] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Cleans up old files for user (garbage collection)
   */
  async cleanupOldFiles(userId: string, daysOld: number = 30): Promise<number> {
    try {
      const supabase = this.getSupabaseClient();
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId);

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const filesToDelete = files?.filter((file: any) => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      }) || [];

      if (filesToDelete.length > 0) {
        const pathsToDelete = filesToDelete.map((file: any) => `${userId}/${file.name}`);
        
        const supabaseForDelete = this.getSupabaseClient();
        const { error: deleteError } = await supabaseForDelete.storage
          .from(this.bucketName)
          .remove(pathsToDelete);

        if (deleteError) {
          throw new Error(`Failed to delete old files: ${deleteError.message}`);
        }
      }

      console.log(`[Cleanup] Deleted ${filesToDelete.length} old files for user ${userId}`);
      return filesToDelete.length;
    } catch (error) {
      console.error('[Cleanup] Failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService(); 