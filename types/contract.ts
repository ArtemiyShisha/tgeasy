// Contract management types for TGeasy

// Contract type for ORD (Operators of Advertising Data) compliance
export type ContractType = 'self_advertising' | 'agency' | 'direct';

// OKVED categories for advertising classification
export type OKVEDCategory = 
  | '73.11' // Рекламные агентства
  | '73.12' // Представление рекламы в СМИ
  | '58.13' // Издание журналов и периодических изданий
  | '58.14' // Издание газет
  | '60.10' // Деятельность в области радиовещания
  | '60.20' // Деятельность в области телевизионного вещания
  | 'other'; // Другие виды деятельности

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  advertiser_name: string;
  advertiser_inn: string;
  
  // ORD compliance fields
  contract_type?: ContractType;
  okved_category?: OKVEDCategory;
  advertiser_legal_address?: string;
  advertiser_contact_person?: string;
  advertiser_phone?: string;
  advertiser_email?: string;
  
  // Contract details
  contract_number?: string;
  contract_date?: string;
  
  file_url?: string;
  status: ContractStatus;
  
  // File metadata
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  extracted_text?: string;
  thumbnail_url?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // Relations
  posts_count?: number;
}

export type ContractStatus = 'draft' | 'active' | 'expiring' | 'expired';

export interface CreateContractDTO {
  title: string;
  advertiser_name: string;
  advertiser_inn: string;
  contract_type: ContractType;
  okved_category?: OKVEDCategory;
  advertiser_legal_address?: string;
  advertiser_contact_person?: string;
  advertiser_phone?: string;
  advertiser_email?: string;
  contract_number?: string;
  contract_date?: string;
  expires_at?: string;
}

export interface UpdateContractDTO {
  title?: string;
  advertiser_name?: string;
  advertiser_inn?: string;
  contract_type?: ContractType;
  okved_category?: OKVEDCategory;
  advertiser_legal_address?: string;
  advertiser_contact_person?: string;
  advertiser_phone?: string;
  advertiser_email?: string;
  contract_number?: string;
  contract_date?: string;
  status?: ContractStatus;
  expires_at?: string;
}

export interface ContractUploadDTO extends CreateContractDTO {
  file: File;
}

export interface ContractFileMetadata {
  file_name: string;
  file_size: number;
  mime_type: string;
  page_count?: number;
  extracted_text?: string;
  thumbnail_url?: string;
}

export interface ContractSearchParams {
  query?: string;
  status?: ContractStatus;
  advertiser_name?: string;
  advertiser_inn?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'advertiser_name';
  sort_order?: 'asc' | 'desc';
}

export interface ContractSearchResult {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ContractValidationError {
  field: string;
  message: string;
}

export interface FileUploadResult {
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  metadata: ContractFileMetadata;
}

export interface ContractStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  draft: number;
  total_file_size: number;
}

// API Response types
export interface ContractResponse {
  success: boolean;
  data?: Contract;
  error?: string;
  validation_errors?: ContractValidationError[];
}

export interface ContractsResponse {
  success: boolean;
  data?: ContractSearchResult;
  error?: string;
}

export interface ContractUploadResponseBase {
  success: boolean;
  data?: Contract;
  upload_result?: FileUploadResult;
  error?: string;
  validation_errors?: ContractValidationError[];
}

export interface ContractStatsResponseBase {
  success: boolean;
  data?: ContractStats;
  error?: string;
}

// File processing types
export interface FileProcessingOptions {
  extract_text: boolean;
  generate_thumbnail: boolean;
  virus_scan: boolean;
  max_file_size: number;
  allowed_mime_types: string[];
}

export interface TextExtractionResult {
  text: string;
  page_count: number;
  word_count: number;
  language?: string;
}

export interface ThumbnailGenerationResult {
  thumbnail_url: string;
  width: number;
  height: number;
}

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_FILE_TYPES;

// Constants
export const CONTRACT_CONSTANTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_TITLE_LENGTH: 255,
  MAX_ADVERTISER_NAME_LENGTH: 255,
  INN_LENGTH_INDIVIDUAL: 12,
  INN_LENGTH_LEGAL: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_MIN_QUERY_LENGTH: 3,
  FILE_URL_EXPIRY_HOURS: 24
} as const;

// Contract type labels for UI
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  'self_advertising': 'Самореклама',
  'agency': 'Агентский договор',
  'direct': 'Прямой договор'
};

// Contract type descriptions for UI
export const CONTRACT_TYPE_DESCRIPTIONS: Record<ContractType, string> = {
  'self_advertising': 'Реклама собственных товаров и услуг на собственных площадках',
  'agency': 'Работа через рекламное агентство или посредника',
  'direct': 'Прямые отношения между рекламодателем и рекламораспространителем'
};

// OKVED category labels for UI
export const OKVED_CATEGORY_LABELS: Record<OKVEDCategory, string> = {
  '73.11': '73.11 - Рекламные агентства',
  '73.12': '73.12 - Представление рекламы в СМИ',
  '58.13': '58.13 - Издание журналов и периодических изданий',
  '58.14': '58.14 - Издание газет',
  '60.10': '60.10 - Деятельность в области радиовещания',
  '60.20': '60.20 - Деятельность в области телевизионного вещания',
  'other': 'Другие виды деятельности'
};

// Currency labels for UI
export const CURRENCY_LABELS = {
  'RUB': '₽ Российский рубль',
  'USD': '$ Доллар США',
  'EUR': '€ Евро'
} as const; 