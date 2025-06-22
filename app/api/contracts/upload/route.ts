import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '@/lib/services/contract-service';
import { createClient } from '@/lib/supabase/server';
import { 
  ContractUploadResponseBase,
  CreateContractDTO 
} from '@/types/contract';
import { validateFile } from '@/utils/contract-validation';
import { addDemoContract } from '@/utils/demo-contracts';
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * POST /api/contracts/upload - Create a contract with file upload
 * Content-Type: multipart/form-data
 * Fields:
 * - file: File (PDF, DOC, DOCX)
 * - title: string
 * - advertiser_name: string
 * - advertiser_inn: string
 * - expires_at: string (optional, ISO date)
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/contracts/upload');
  
  try {
    // Debug headers
    const authHeader = request.headers.get('authorization');
    console.log('[API] Request headers debug:', {
      hasAuthHeader: !!authHeader,
      authHeaderType: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type')
    });

    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request);
    } catch {
      userId = null;
    }
    console.log('[API] Auth check:', { hasUser: !!userId, userId });
    
    // Demo mode fallback - if no auth, return demo success
    if (!userId) {
      console.log('[API] Demo mode: Creating demo contract with file');
      
      // Parse multipart form data
      const formData = await request.formData();
      
      // Extract file
      const file = formData.get('file') as File;
      if (!file) {
        console.warn('[API] No file provided in upload request');
        return NextResponse.json(
          { 
            success: false, 
            error: 'No file provided',
            validation_errors: [{ field: 'file', message: 'File is required' }]
          },
          { status: 400 }
        );
      }

      // Extract contract data
      const title = formData.get('title') as string;
      const advertiser_name = formData.get('advertiser_name') as string;
      const advertiser_inn = formData.get('advertiser_inn') as string;
      const expires_at = formData.get('expires_at') as string;

      console.log('[API] Demo upload data:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        title,
        advertiser_name,
        advertiser_inn: advertiser_inn ? 'REDACTED' : undefined,
        expires_at
      });

      // Validate required fields
      const missingFields = [];
      if (!title) missingFields.push({ field: 'title', message: 'Title is required' });
      if (!advertiser_name) missingFields.push({ field: 'advertiser_name', message: 'Advertiser name is required' });
      if (!advertiser_inn) missingFields.push({ field: 'advertiser_inn', message: 'INN is required' });

      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing required fields',
            validation_errors: missingFields
          },
          { status: 400 }
        );
      }

      // Validate file
      const fileValidationErrors = validateFile(file);
      if (fileValidationErrors.length > 0) {
        console.warn('[API] File validation failed:', fileValidationErrors);
        return NextResponse.json(
          { 
            success: false, 
            error: 'File validation failed',
            validation_errors: fileValidationErrors
          },
          { status: 400 }
        );
      }

      // Extract additional fields from form data
      const contract_type = formData.get('contract_type') as string || 'direct';
      const advertiser_legal_address = formData.get('advertiser_legal_address') as string || undefined;
      const advertiser_contact_person = formData.get('advertiser_contact_person') as string || undefined;
      const advertiser_phone = formData.get('advertiser_phone') as string || undefined;
      const advertiser_email = formData.get('advertiser_email') as string || undefined;
      const contract_number = formData.get('contract_number') as string || undefined;
      const contract_date = formData.get('contract_date') as string || undefined;

      // Create demo contract with file response
      const demoContract = {
        id: `demo-${Date.now()}`,
        user_id: 'demo-user',
        title,
        advertiser_name,
        advertiser_inn,
        contract_type: contract_type as any,
        advertiser_legal_address,
        advertiser_contact_person,
        advertiser_phone,
        advertiser_email,
        contract_number,
        contract_date,
        status: 'active' as const,
        file_url: `demo-file-${Date.now()}.pdf`,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        page_count: Math.floor(Math.random() * 10) + 1,
        extracted_text: `Демонстрационный текст договора: ${title}`,
        thumbnail_url: undefined,
        expires_at: expires_at || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        posts_count: 0
      };

      const response: ContractUploadResponseBase = {
        success: true,
        data: demoContract,
        upload_result: {
          file_url: demoContract.file_url!,
          file_name: demoContract.file_name!,
          file_size: demoContract.file_size!,
          mime_type: demoContract.mime_type!,
          metadata: {
            file_name: demoContract.file_name!,
            file_size: demoContract.file_size!,
            mime_type: demoContract.mime_type!,
            page_count: demoContract.page_count,
            extracted_text: demoContract.extracted_text,
            thumbnail_url: demoContract.thumbnail_url
          }
        },
        validation_errors: []
      };

      console.log('[API] Demo contract with file created successfully:', demoContract.id);
      return NextResponse.json(response, { status: 201 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract file
    const file = formData.get('file') as File;
    if (!file) {
      console.warn('[API] No file provided in upload request');
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file provided',
          validation_errors: [{ field: 'file', message: 'File is required' }]
        },
        { status: 400 }
      );
    }

    // Extract contract data
    const title = formData.get('title') as string;
    const advertiser_name = formData.get('advertiser_name') as string;
    const advertiser_inn = formData.get('advertiser_inn') as string;
    const expires_at = formData.get('expires_at') as string;

    console.log('[API] Upload data:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      title,
      advertiser_name,
      advertiser_inn: advertiser_inn ? 'REDACTED' : undefined,
      expires_at
    });

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push({ field: 'title', message: 'Title is required' });
    if (!advertiser_name) missingFields.push({ field: 'advertiser_name', message: 'Advertiser name is required' });
    if (!advertiser_inn) missingFields.push({ field: 'advertiser_inn', message: 'INN is required' });

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          validation_errors: missingFields
        },
        { status: 400 }
      );
    }

    // Validate file
    const fileValidationErrors = validateFile(file);
    if (fileValidationErrors.length > 0) {
      console.warn('[API] File validation failed:', fileValidationErrors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'File validation failed',
          validation_errors: fileValidationErrors
        },
        { status: 400 }
      );
    }

    // Extract additional fields from form data
    const contract_type = formData.get('contract_type') as string || 'direct';
    const advertiser_legal_address = formData.get('advertiser_legal_address') as string || undefined;
    const advertiser_contact_person = formData.get('advertiser_contact_person') as string || undefined;
    const advertiser_phone = formData.get('advertiser_phone') as string || undefined;
    const advertiser_email = formData.get('advertiser_email') as string || undefined;
    const contract_number = formData.get('contract_number') as string || undefined;
    const contract_date = formData.get('contract_date') as string || undefined;

    console.log('[API] Authenticated user creating contract:', { 
      userId: userId,
      title,
      advertiser_name,
      contract_type
    });

    // Prepare contract data
    const contractData = {
      title,
      advertiser_name,
      advertiser_inn,
      contract_type: contract_type as any,
      advertiser_legal_address,
      advertiser_contact_person,
      advertiser_phone,
      advertiser_email,
      contract_number,
      contract_date,
      expires_at: expires_at || undefined,
      file
    };

    // Create contract with file
    const result = await contractService.createContractWithFile(userId, contractData);

    const response: ContractUploadResponseBase = {
      success: true,
      data: result.contract,
      upload_result: result.upload_result,
      validation_errors: result.validation_errors
    };

    console.log('[API] Contract with file created successfully:', result.contract.id);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[API] POST /api/contracts/upload error:', error);
    
    const response: ContractUploadResponseBase = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload contract'
    };

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(response, { status: 400 });
    }

    // Check if it's a file size/type error
    if (error instanceof Error && (
      error.message.includes('File validation failed') ||
      error.message.includes('file too large') ||
      error.message.includes('unsupported file type')
    )) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/contracts/upload - Upload file to existing contract
 * Content-Type: multipart/form-data
 * Fields:
 * - file: File (PDF, DOC, DOCX)
 * - contract_id: string
 */
export async function PUT(request: NextRequest) {
  console.log('[API] PUT /api/contracts/upload');
  
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[API] Unauthorized file upload attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract file and contract ID
    const file = formData.get('file') as File;
    const contractId = formData.get('contract_id') as string;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file provided',
          validation_errors: [{ field: 'file', message: 'File is required' }]
        },
        { status: 400 }
      );
    }

    if (!contractId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Contract ID is required',
          validation_errors: [{ field: 'contract_id', message: 'Contract ID is required' }]
        },
        { status: 400 }
      );
    }

    console.log('[API] Uploading file to contract:', { 
      contractId,
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type
    });

    // Validate file
    const fileValidationErrors = validateFile(file);
    if (fileValidationErrors.length > 0) {
      console.warn('[API] File validation failed:', fileValidationErrors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'File validation failed',
          validation_errors: fileValidationErrors
        },
        { status: 400 }
      );
    }

    // Upload file to contract
    const result = await contractService.uploadFileToContract(user.id, contractId, file);

    const response: ContractUploadResponseBase = {
      success: true,
      data: result.contract,
      upload_result: result.upload_result
    };

    console.log('[API] File uploaded to contract successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] PUT /api/contracts/upload error:', error);
    
    const response: ContractUploadResponseBase = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };

    // Check if contract not found
    if (error instanceof Error && error.message.includes('Contract not found')) {
      return NextResponse.json(response, { status: 404 });
    }

    // Check if it's a file validation error
    if (error instanceof Error && error.message.includes('File validation failed')) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * OPTIONS /api/contracts/upload - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 