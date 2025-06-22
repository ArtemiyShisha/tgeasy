import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '@/lib/services/contract-service';
import { createClient } from '@/lib/supabase/server';
import { 
  ContractsResponse, 
  ContractResponse, 
  ContractSearchParams,
  CreateContractDTO 
} from '@/types/contract';
import { getDemoContracts } from '@/utils/demo-contracts';
import { getUserIdFromRequest } from '@/lib/auth/api-helpers'

/**
 * GET /api/contracts - List and search contracts
 * Query parameters:
 * - query: string (search in title, advertiser_name, extracted_text)
 * - status: 'draft' | 'active' | 'expired'
 * - advertiser_name: string
 * - advertiser_inn: string
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sort_by: 'created_at' | 'updated_at' | 'title' | 'advertiser_name'
 * - sort_order: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/contracts');
  
  try {
    // Try to resolve user id via helper (Supabase or cookie fallback)
    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request as any);
    } catch {}

    console.log('[API] GET Auth check:', { hasUser: !!userId, userId });

    if (!userId) {
      console.warn('[API] Unauthorized access to contracts - returning demo data');
      
      // Get demo contracts (includes user-created ones from localStorage)
      const demoContracts = getDemoContracts();

      const response: ContractsResponse = {
        success: true,
        data: {
          contracts: demoContracts,
          total: demoContracts.length,
          page: 1,
          limit: 20,
          total_pages: Math.ceil(demoContracts.length / 20)
        }
      };
      
      return NextResponse.json(response);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: ContractSearchParams = {
      query: searchParams.get('query') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      advertiser_name: searchParams.get('advertiser_name') || undefined,
      advertiser_inn: searchParams.get('advertiser_inn') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      sort_by: (searchParams.get('sort_by') as any) || undefined,
      sort_order: (searchParams.get('sort_order') as any) || undefined
    };

    console.log('[API] Search params:', params);
    console.log('[API] Authenticated user fetching contracts:', userId);

    // Search contracts
    const result = await contractService.searchContracts(userId, params);

    const response: ContractsResponse = {
      success: true,
      data: result
    };

    console.log(`[API] Returning ${result.contracts.length} contracts`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] GET /api/contracts error:', error);
    
    const response: ContractsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contracts'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/contracts - Create a new contract (without file)
 * Body: CreateContractDTO
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/contracts');
  
  try {
    // Try to resolve user id via helper (Supabase or cookie fallback)
    let userId: string | null = null;
    try {
      userId = await getUserIdFromRequest(request as any);
    } catch {}

    console.log('[API] GET Auth check:', { hasUser: !!userId, userId });

    if (!userId) {
      console.log('[API] Demo mode: Creating demo contract');
      
      // Parse request body for demo
      const body = await request.json();
      console.log('[API] Demo contract data:', { ...body, advertiser_inn: body.advertiser_inn ? 'REDACTED' : undefined });

      // Validate required fields
      if (!body.title || !body.advertiser_name || !body.advertiser_inn) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Missing required fields',
            validation_errors: [
              { field: 'title', message: 'Title is required' },
              { field: 'advertiser_name', message: 'Advertiser name is required' },
              { field: 'advertiser_inn', message: 'INN is required' }
            ].filter(err => !body[err.field])
          },
          { status: 400 }
        );
      }

      // Create demo contract response
      const demoContract = {
        id: `demo-${Date.now()}`,
        user_id: 'demo-user',
        title: body.title,
        advertiser_name: body.advertiser_name,
        advertiser_inn: body.advertiser_inn,
        contract_type: body.contract_type || 'direct',
        advertiser_legal_address: body.advertiser_legal_address || undefined,
        advertiser_contact_person: body.advertiser_contact_person || undefined,
        advertiser_phone: body.advertiser_phone || undefined,
        advertiser_email: body.advertiser_email || undefined,
        contract_number: body.contract_number || undefined,
        contract_date: body.contract_date || undefined,
        status: 'draft' as const,
        file_url: undefined,
        file_name: undefined,
        file_size: undefined,
        mime_type: undefined,
        page_count: undefined,
        extracted_text: undefined,
        thumbnail_url: undefined,
        expires_at: body.expires_at || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        posts_count: 0
      };

      const response: ContractResponse = {
        success: true,
        data: demoContract,
        validation_errors: []
      };

      console.log('[API] Demo contract created successfully:', demoContract.id);
      return NextResponse.json(response, { status: 201 });
    }

    // Parse request body
    const body = await request.json();
    console.log('[API] Creating contract with data:', { ...body, advertiser_inn: body.advertiser_inn ? 'REDACTED' : undefined });

    // Validate required fields
    if (!body.title || !body.advertiser_name || !body.advertiser_inn) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          validation_errors: [
            { field: 'title', message: 'Title is required' },
            { field: 'advertiser_name', message: 'Advertiser name is required' },
            { field: 'advertiser_inn', message: 'INN is required' }
          ].filter(err => !body[err.field])
        },
        { status: 400 }
      );
    }

    const contractData: CreateContractDTO = {
      title: body.title,
      advertiser_name: body.advertiser_name,
      advertiser_inn: body.advertiser_inn,
      contract_type: body.contract_type || 'direct',
      advertiser_legal_address: body.advertiser_legal_address || undefined,
      advertiser_contact_person: body.advertiser_contact_person || undefined,
      advertiser_phone: body.advertiser_phone || undefined,
      advertiser_email: body.advertiser_email || undefined,
      contract_number: body.contract_number || undefined,
      contract_date: body.contract_date || undefined,
      expires_at: body.expires_at || undefined
    };

    // Create contract
    const result = await contractService.createContract(userId, contractData);

    const response: ContractResponse = {
      success: true,
      data: result.contract,
      validation_errors: result.validation_errors
    };

    console.log('[API] Contract created successfully:', result.contract.id);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[API] POST /api/contracts error:', error);
    
    const response: ContractResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contract'
    };

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * OPTIONS /api/contracts - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 