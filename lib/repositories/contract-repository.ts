import { 
  Contract, 
  CreateContractDTO, 
  UpdateContractDTO, 
  ContractSearchParams, 
  ContractSearchResult,
  ContractStats,
  ContractFileMetadata,
  ContractStatus
} from '@/types/contract';
import { createClient as createSupabaseBackendClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

type ContractRow = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type ContractUpdate = Database['public']['Tables']['contracts']['Update'];

// Helper function to transform database row to Contract type
function transformContractRow(contract: any): Contract {
  return {
    id: contract.id,
    user_id: contract.user_id,
    title: contract.title,
    advertiser_name: contract.advertiser_name,
    advertiser_inn: contract.advertiser_inn,
    contract_type: contract.contract_type || 'direct',
    advertiser_legal_address: contract.advertiser_legal_address || undefined,
    advertiser_contact_person: contract.advertiser_contact_person || undefined,
    advertiser_phone: contract.advertiser_phone || undefined,
    advertiser_email: contract.advertiser_email || undefined,
          contract_number: contract.contract_number || undefined,
      contract_date: contract.contract_date || undefined,
    file_url: contract.file_url || undefined,
    file_name: contract.file_name || undefined,
    file_size: contract.file_size || undefined,
    mime_type: contract.mime_type || undefined,
    page_count: contract.page_count || undefined,
    extracted_text: contract.extracted_text || undefined,
    thumbnail_url: contract.thumbnail_url || undefined,
    status: (contract.status as ContractStatus) || 'draft',
    created_at: contract.created_at!,
    updated_at: contract.updated_at!,
    expires_at: contract.expires_at || undefined,
    posts_count: contract.posts?.[0]?.count || 0
  };
}

function getSupabaseServer() {
  return createSupabaseBackendClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Contract Repository - Database operations for contract management
 * Uses Supabase client for database access
 */
export class ContractRepository {
  
  /**
   * Creates a new contract in the database
   */
  async create(data: CreateContractDTO & { user_id: string }): Promise<Contract> {
    console.log('[ContractRepo] Creating contract:', data.title);
    
    const supabase = getSupabaseServer();
    
    const contractData: ContractInsert = {
      user_id: data.user_id,
      title: data.title,
      advertiser_name: data.advertiser_name,
      advertiser_inn: data.advertiser_inn,
      expires_at: data.expires_at
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select(`
        *,
        posts:posts(count)
      `)
      .single();

    if (error) {
      console.error('[ContractRepo] Error creating contract:', error);
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    // Transform database row to Contract type
    const result = transformContractRow(contract);

    console.log('[ContractRepo] Contract created successfully:', result.id);
    return result;
  }

  /**
   * Finds a contract by ID
   */
  async findById(id: string, userId: string): Promise<Contract | null> {
    console.log('[ContractRepo] Finding contract by ID:', id);
    
    const supabase = getSupabaseServer();

    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        posts:posts(count)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('[ContractRepo] Contract not found:', id);
        return null;
      }
      console.error('[ContractRepo] Error finding contract:', error);
      throw new Error(`Failed to find contract: ${error.message}`);
    }

    // Transform database row to Contract type
    const result = transformContractRow(contract);

    console.log('[ContractRepo] Contract found:', result.title);
    return result;
  }

  /**
   * Updates a contract
   */
  async update(id: string, userId: string, data: UpdateContractDTO): Promise<Contract> {
    console.log('[ContractRepo] Updating contract:', id);
    
    const supabase = getSupabaseServer();
    
    const updateData: ContractUpdate = {
      ...(data.title && { title: data.title }),
      ...(data.advertiser_name && { advertiser_name: data.advertiser_name }),
      ...(data.advertiser_inn && { advertiser_inn: data.advertiser_inn }),
      ...(data.status && { status: data.status }),
      ...(data.expires_at !== undefined && { expires_at: data.expires_at })
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        posts:posts(count)
      `)
      .single();

    if (error) {
      console.error('[ContractRepo] Error updating contract:', error);
      throw new Error(`Failed to update contract: ${error.message}`);
    }

    // Transform database row to Contract type
    const result: Contract = {
      id: contract.id,
      user_id: contract.user_id,
      title: contract.title,
      advertiser_name: contract.advertiser_name,
      advertiser_inn: contract.advertiser_inn,
      file_url: contract.file_url || undefined,
      status: (contract.status as ContractStatus) || 'draft',
      file_name: contract.file_name || undefined,
      file_size: contract.file_size || undefined,
      mime_type: contract.mime_type || undefined,
      created_at: contract.created_at!,
      updated_at: contract.updated_at!,
      expires_at: contract.expires_at || undefined,
      posts_count: contract.posts?.[0]?.count || 0
    };

    console.log('[ContractRepo] Contract updated successfully');
    return result;
  }

  /**
   * Deletes a contract
   */
  async delete(id: string, userId: string): Promise<void> {
    console.log('[ContractRepo] Deleting contract:', id);
    
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[ContractRepo] Error deleting contract:', error);
      throw new Error(`Failed to delete contract: ${error.message}`);
    }

    console.log('[ContractRepo] Contract deleted successfully');
  }

  /**
   * Updates contract file metadata
   */
  async updateFileMetadata(
    id: string, 
    userId: string, 
    metadata: ContractFileMetadata & { file_url: string }
  ): Promise<Contract> {
    console.log('[ContractRepo] Updating file metadata for contract:', id);
    
    const supabase = getSupabaseServer();

    const updateData: ContractUpdate = {
      file_url: metadata.file_url,
      file_name: metadata.file_name,
      file_size: metadata.file_size,
      mime_type: metadata.mime_type
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        posts:posts(count)
      `)
      .single();

    if (error) {
      console.error('[ContractRepo] Error updating file metadata:', error);
      throw new Error(`Failed to update file metadata: ${error.message}`);
    }

    // Transform database row to Contract type
    const result: Contract = {
      id: contract.id,
      user_id: contract.user_id,
      title: contract.title,
      advertiser_name: contract.advertiser_name,
      advertiser_inn: contract.advertiser_inn,
      file_url: contract.file_url || undefined,
      status: (contract.status as ContractStatus) || 'draft',
      file_name: contract.file_name || undefined,
      file_size: contract.file_size || undefined,
      mime_type: contract.mime_type || undefined,
      created_at: contract.created_at!,
      updated_at: contract.updated_at!,
      expires_at: contract.expires_at || undefined,
      posts_count: contract.posts?.[0]?.count || 0
    };

    console.log('[ContractRepo] File metadata updated successfully');
    return result;
  }

  /**
   * Searches contracts with pagination and filtering
   */
  async search(userId: string, params: ContractSearchParams): Promise<ContractSearchResult> {
    console.log('[ContractRepo] Searching contracts with params:', params);
    
    const supabase = getSupabaseServer();
    const {
      query = '',
      status,
      advertiser_name,
      advertiser_inn,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = params;

    let queryBuilder = supabase
      .from('contracts')
      .select(`
        *,
        posts:posts(count)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,advertiser_name.ilike.%${query}%`);
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }
    if (advertiser_name) {
      queryBuilder = queryBuilder.ilike('advertiser_name', `%${advertiser_name}%`);
    }
    if (advertiser_inn) {
      queryBuilder = queryBuilder.eq('advertiser_inn', advertiser_inn);
    }

    // Apply sorting
    const ascending = sort_order === 'asc';
    queryBuilder = queryBuilder.order(sort_by === 'advertiser_name' ? 'advertiser_name' : sort_by, { ascending });

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: contracts, error, count } = await queryBuilder;

    if (error) {
      console.error('[ContractRepo] Error searching contracts:', error);
      throw new Error(`Failed to search contracts: ${error.message}`);
    }

    // Transform database rows to Contract types
    const transformedContracts: Contract[] = (contracts || []).map(contract => ({
      id: contract.id,
      user_id: contract.user_id,
      title: contract.title,
      advertiser_name: contract.advertiser_name,
      advertiser_inn: contract.advertiser_inn,
      file_url: contract.file_url || undefined,
      status: (contract.status as ContractStatus) || 'draft',
      file_name: contract.file_name || undefined,
      file_size: contract.file_size || undefined,
      mime_type: contract.mime_type || undefined,
      created_at: contract.created_at!,
      updated_at: contract.updated_at!,
      expires_at: contract.expires_at || undefined,
      posts_count: contract.posts?.[0]?.count || 0
    }));

    const result: ContractSearchResult = {
      contracts: transformedContracts,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };

    console.log('[ContractRepo] Found contracts:', result.total);
    return result;
  }

  /**
   * Gets contract statistics for a user
   */
  async getStats(userId: string): Promise<ContractStats> {
    console.log('[ContractRepo] Getting contract stats for user:', userId);
    
    const supabase = getSupabaseServer();

    const { data: stats, error } = await supabase
      .from('contracts')
      .select('status, file_size')
      .eq('user_id', userId);

    if (error) {
      console.error('[ContractRepo] Error getting contract stats:', error);
      throw new Error(`Failed to get contract stats: ${error.message}`);
    }

    const result: ContractStats = {
      total: stats.length,
      active: stats.filter(s => s.status === 'active').length,
      expiring: stats.filter(s => s.status === 'expiring').length,
      expired: stats.filter(s => s.status === 'expired').length,
      draft: stats.filter(s => s.status === 'draft').length,
      total_file_size: stats.reduce((sum, s) => sum + (s.file_size || 0), 0)
    };

    console.log('[ContractRepo] Contract stats:', result);
    return result;
  }

  /**
   * Finds contracts by advertiser INN
   */
  async findByAdvertiserINN(userId: string, advertiser_inn: string): Promise<Contract[]> {
    console.log('[ContractRepo] Finding contracts by INN:', advertiser_inn);
    
    const supabase = getSupabaseServer();

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        *,
        posts:posts(count)
      `)
      .eq('user_id', userId)
      .eq('advertiser_inn', advertiser_inn)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ContractRepo] Error finding contracts by INN:', error);
      throw new Error(`Failed to find contracts by INN: ${error.message}`);
    }

    // Transform database rows to Contract types
    const result: Contract[] = (contracts || []).map(contract => ({
      id: contract.id,
      user_id: contract.user_id,
      title: contract.title,
      advertiser_name: contract.advertiser_name,
      advertiser_inn: contract.advertiser_inn,
      file_url: contract.file_url || undefined,
      status: (contract.status as ContractStatus) || 'draft',
      file_name: contract.file_name || undefined,
      file_size: contract.file_size || undefined,
      mime_type: contract.mime_type || undefined,
      created_at: contract.created_at!,
      updated_at: contract.updated_at!,
      expires_at: contract.expires_at || undefined,
      posts_count: contract.posts?.[0]?.count || 0
    }));

    console.log('[ContractRepo] Found contracts by INN:', result.length);
    return result;
  }

  /**
   * Finds contracts expiring within specified days
   */
  async findExpiring(userId: string, daysAhead: number = 30): Promise<Contract[]> {
    console.log('[ContractRepo] Finding expiring contracts, days ahead:', daysAhead);
    
    const supabase = getSupabaseServer();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        *,
        posts:posts(count)
      `)
      .eq('user_id', userId)
      .not('expires_at', 'is', null)
      .lte('expires_at', futureDate.toISOString())
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      console.error('[ContractRepo] Error finding expiring contracts:', error);
      throw new Error(`Failed to find expiring contracts: ${error.message}`);
    }

    // Transform database rows to Contract types
    const result: Contract[] = (contracts || []).map(contract => ({
      id: contract.id,
      user_id: contract.user_id,
      title: contract.title,
      advertiser_name: contract.advertiser_name,
      advertiser_inn: contract.advertiser_inn,
      file_url: contract.file_url || undefined,
      status: (contract.status as ContractStatus) || 'draft',
      file_name: contract.file_name || undefined,
      file_size: contract.file_size || undefined,
      mime_type: contract.mime_type || undefined,
      created_at: contract.created_at!,
      updated_at: contract.updated_at!,
      expires_at: contract.expires_at || undefined,
      posts_count: contract.posts?.[0]?.count || 0
    }));

    console.log('[ContractRepo] Found expiring contracts:', result.length);
    return result;
  }

  /**
   * Updates contract status
   */
  async updateStatus(id: string, userId: string, status: 'draft' | 'active' | 'expired'): Promise<void> {
    console.log('[ContractRepo] Updating contract status:', id, status);
    
    const supabase = getSupabaseServer();

    const { error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[ContractRepo] Error updating contract status:', error);
      throw new Error(`Failed to update contract status: ${error.message}`);
    }

    console.log('[ContractRepo] Contract status updated successfully');
  }

  /**
   * Marks expired contracts based on expiration date
   */
  async markExpiredContracts(userId: string): Promise<number> {
    console.log('[ContractRepo] Marking expired contracts for user:', userId);
    
    const supabase = getSupabaseServer();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('contracts')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .neq('status', 'expired')
      .select('id');

    if (error) {
      console.error('[ContractRepo] Error marking expired contracts:', error);
      throw new Error(`Failed to mark expired contracts: ${error.message}`);
    }

    const count = data?.length || 0;
    console.log('[ContractRepo] Marked expired contracts:', count);
    return count;
  }
}

// Export singleton instance
export const contractRepository = new ContractRepository(); 