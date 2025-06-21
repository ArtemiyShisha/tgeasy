import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContractStatsResponseBase } from '@/types/contract';

/**
 * GET /api/contracts/stats - Get contract statistics
 */
export async function GET(request: NextRequest) {
  console.log('[API] GET /api/contracts/stats');
  
  try {
    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.warn('[API] Unauthorized access to contract stats - returning demo data');
      
      // Return demo stats for testing
      const response: ContractStatsResponseBase = {
        success: true,
        data: {
          total: 3,
          active: 1,
          expiring: 1,
          expired: 1,
          draft: 0,
          total_file_size: 0
        }
      };
      
      return NextResponse.json(response);
    }

    // TODO: Implement real stats logic when authenticated
    const response: ContractStatsResponseBase = {
      success: true,
      data: {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        draft: 0,
        total_file_size: 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] GET /api/contracts/stats error:', error);
    
    const response: ContractStatsResponseBase = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contract stats'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * OPTIONS /api/contracts/stats - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 