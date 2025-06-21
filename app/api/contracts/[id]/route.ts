import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '@/lib/services/contract-service';
import { createClient } from '@/lib/supabase/server';
import { 
  ContractResponse, 
  UpdateContractDTO 
} from '@/types/contract';

/**
 * GET /api/contracts/[id] - Get a specific contract
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] GET /api/contracts/', params.id);
  
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[API] Unauthorized access to contract');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contract
    const contract = await contractService.getContract(user.id, params.id);

    if (!contract) {
      console.log('[API] Contract not found:', params.id);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    const response: ContractResponse = {
      success: true,
      data: contract
    };

    console.log('[API] Contract retrieved successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] GET /api/contracts/[id] error:', error);
    
    const response: ContractResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contract'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PUT /api/contracts/[id] - Update a specific contract
 * Body: UpdateContractDTO
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] PUT /api/contracts/', params.id);
  
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[API] Unauthorized contract update attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('[API] Updating contract with data:', { ...body, advertiser_inn: body.advertiser_inn ? 'REDACTED' : undefined });

    const updateData: UpdateContractDTO = {
      title: body.title,
      advertiser_name: body.advertiser_name,
      advertiser_inn: body.advertiser_inn,
      status: body.status,
      expires_at: body.expires_at
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateContractDTO] === undefined) {
        delete updateData[key as keyof UpdateContractDTO];
      }
    });

    // Update contract
    const contract = await contractService.updateContract(user.id, params.id, updateData);

    const response: ContractResponse = {
      success: true,
      data: contract
    };

    console.log('[API] Contract updated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] PUT /api/contracts/[id] error:', error);
    
    const response: ContractResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contract'
    };

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(response, { status: 400 });
    }

    // Check if contract not found
    if (error instanceof Error && error.message.includes('Contract not found')) {
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/contracts/[id] - Delete a specific contract
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API] DELETE /api/contracts/', params.id);
  
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[API] Unauthorized contract deletion attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete contract
    await contractService.deleteContract(user.id, params.id);

    console.log('[API] Contract deleted successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API] DELETE /api/contracts/[id] error:', error);
    
    const response = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contract'
    };

    // Check if contract not found
    if (error instanceof Error && error.message.includes('Contract not found')) {
      return NextResponse.json(response, { status: 404 });
    }

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * OPTIONS /api/contracts/[id] - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 