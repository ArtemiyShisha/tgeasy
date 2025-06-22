import { 
  CreateContractDTO, 
  UpdateContractDTO, 
  ContractSearchParams, 
  ContractValidationError, 
  CONTRACT_CONSTANTS,
  SUPPORTED_FILE_TYPES,
  SupportedMimeType,
  ContractType
} from '@/types/contract';

/**
 * Validates Russian INN (Individual Taxpayer Number)
 * @param advertiser_inn - The INN to validate
 * @returns true if valid, false otherwise
 */
export function validateINN(advertiser_inn: string): boolean {
  if (!advertiser_inn || typeof advertiser_inn !== 'string') return false;
  
  // Remove any non-digit characters
  const cleanINN = advertiser_inn.replace(/\D/g, '');
  
  // INN must be 10 digits (legal entity) or 12 digits (individual)
  if (cleanINN.length !== 10 && cleanINN.length !== 12) return false;
  
  // Convert to array of numbers for checksum calculation
  const digits = cleanINN.split('').map(Number);
  
  if (cleanINN.length === 10) {
    // Legal entity INN validation
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i];
    }
    
    const checksum = sum % 11;
    const controlDigit = checksum < 2 ? checksum : checksum % 10;
    
    return digits[9] === controlDigit;
  } else {
    // Individual INN validation (12 digits)
    const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    
    let sum1 = 0;
    for (let i = 0; i < 10; i++) {
      sum1 += digits[i] * weights1[i];
    }
    
    const checksum1 = sum1 % 11;
    const controlDigit1 = checksum1 < 2 ? checksum1 : checksum1 % 10;
    
    if (digits[10] !== controlDigit1) return false;
    
    let sum2 = 0;
    for (let i = 0; i < 11; i++) {
      sum2 += digits[i] * weights2[i];
    }
    
    const checksum2 = sum2 % 11;
    const controlDigit2 = checksum2 < 2 ? checksum2 : checksum2 % 10;
    
    return digits[11] === controlDigit2;
  }
}

/**
 * Formats INN for display (adds spaces for readability)
 */
export function formatINN(advertiser_inn: string): string {
  const cleanINN = advertiser_inn.replace(/\D/g, '');
  
  if (cleanINN.length === 10) {
    // Format as XXXX-XXXXXX
    return `${cleanINN.slice(0, 4)}-${cleanINN.slice(4)}`;
  } else if (cleanINN.length === 12) {
    // Format as XXXX-XXXX-XXXX
    return `${cleanINN.slice(0, 4)}-${cleanINN.slice(4, 8)}-${cleanINN.slice(8)}`;
  }
  
  return advertiser_inn;
}

/**
 * Sanitizes text input to prevent XSS and injection attacks
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>'"&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .slice(0, 1000); // Limit length to prevent abuse
}

/**
 * Validates file type and size for contract uploads
 */
export function validateFile(file: File): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  // Check file size
  if (file.size > CONTRACT_CONSTANTS.MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `Файл слишком большой. Максимальный размер: ${CONTRACT_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB`
    });
  }
  
  // Check file type
  if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
    errors.push({
      field: 'file',
      message: `Неподдерживаемый тип файла. Разрешены: PDF, DOC, DOCX`
    });
  }
  
  // Check file name
  if (!file.name || file.name.length > 255) {
    errors.push({
      field: 'file',
      message: 'Некорректное имя файла'
    });
  }
  
  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.vbs', '.js'];
  const fileName = file.name.toLowerCase();
  
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push({
      field: 'file',
      message: 'Недопустимое расширение файла'
    });
  }
  
  return errors;
}

/**
 * Validates contract creation data
 */
export function validateCreateContract(data: CreateContractDTO): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Название договора обязательно'
    });
  } else if (data.title.length > CONTRACT_CONSTANTS.MAX_TITLE_LENGTH) {
    errors.push({
      field: 'title',
      message: `Название слишком длинное (максимум ${CONTRACT_CONSTANTS.MAX_TITLE_LENGTH} символов)`
    });
  }
  
  // Advertiser name validation
  if (!data.advertiser_name || typeof data.advertiser_name !== 'string') {
    errors.push({
      field: 'advertiser_name',
      message: 'Название рекламодателя обязательно'
    });
  } else if (data.advertiser_name.length > CONTRACT_CONSTANTS.MAX_ADVERTISER_NAME_LENGTH) {
    errors.push({
      field: 'advertiser_name',
      message: `Название рекламодателя слишком длинное (максимум ${CONTRACT_CONSTANTS.MAX_ADVERTISER_NAME_LENGTH} символов)`
    });
  }
  
  // INN validation
  if (!data.advertiser_inn || typeof data.advertiser_inn !== 'string') {
    errors.push({
      field: 'advertiser_inn',
      message: 'ИНН обязателен'
    });
  } else if (!validateINN(data.advertiser_inn)) {
    errors.push({
      field: 'advertiser_inn',
      message: 'Некорректный ИНН'
    });
  }
  
  // New ORD validations
  errors.push(...validateContractType(data.contract_type));
  errors.push(...validatePhoneNumber(data.advertiser_phone));
  errors.push(...validateEmail(data.advertiser_email));
  errors.push(...validateContractNumber(data.contract_number));
  errors.push(...validateContractDate(data.contract_date));
  
  // Expiry date validation
  if (data.expires_at) {
    const expiryDate = new Date(data.expires_at);
    const now = new Date();
    
    if (isNaN(expiryDate.getTime())) {
      errors.push({
        field: 'expires_at',
        message: 'Некорректная дата окончания договора'
      });
    } else if (expiryDate <= now) {
      errors.push({
        field: 'expires_at',
        message: 'Дата окончания договора должна быть в будущем'
      });
    }
  }
  
  return errors;
}

/**
 * Validates contract update data
 */
export function validateUpdateContract(data: UpdateContractDTO): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  // Title validation (if provided)
  if (data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      errors.push({
        field: 'title',
        message: 'Название договора не может быть пустым'
      });
    } else if (data.title.length > CONTRACT_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Название слишком длинное (максимум ${CONTRACT_CONSTANTS.MAX_TITLE_LENGTH} символов)`
      });
    }
  }
  
  // Advertiser name validation (if provided)
  if (data.advertiser_name !== undefined) {
    if (!data.advertiser_name || typeof data.advertiser_name !== 'string') {
      errors.push({
        field: 'advertiser_name',
        message: 'Название рекламодателя не может быть пустым'
      });
    } else if (data.advertiser_name.length > CONTRACT_CONSTANTS.MAX_ADVERTISER_NAME_LENGTH) {
      errors.push({
        field: 'advertiser_name',
        message: `Название рекламодателя слишком длинное (максимум ${CONTRACT_CONSTANTS.MAX_ADVERTISER_NAME_LENGTH} символов)`
      });
    }
  }
  
  // INN validation (if provided)
  if (data.advertiser_inn !== undefined) {
    if (!data.advertiser_inn || typeof data.advertiser_inn !== 'string') {
      errors.push({
        field: 'advertiser_inn',
        message: 'ИНН обязателен'
      });
    } else if (!validateINN(data.advertiser_inn)) {
      errors.push({
        field: 'advertiser_inn',
        message: 'Некорректный ИНН'
      });
    }
  }
  
  // New ORD validations (optional)
  if (data.contract_type !== undefined) {
    errors.push(...validateContractType(data.contract_type));
  }
  
  if (data.advertiser_phone !== undefined) {
    errors.push(...validatePhoneNumber(data.advertiser_phone));
  }
  
  if (data.advertiser_email !== undefined) {
    errors.push(...validateEmail(data.advertiser_email));
  }
  
  if (data.contract_number !== undefined) {
    errors.push(...validateContractNumber(data.contract_number));
  }
  
  if (data.contract_date !== undefined) {
    errors.push(...validateContractDate(data.contract_date));
  }
  
  // Status validation (if provided)
  if (data.status !== undefined) {
    const validStatuses = ['draft', 'active', 'expired'];
    if (!validStatuses.includes(data.status)) {
      errors.push({
        field: 'status',
        message: 'Некорректный статус договора'
      });
    }
  }
  
  // Expiry date validation (if provided)
  if (data.expires_at !== undefined) {
    if (data.expires_at === null || data.expires_at === '') {
      // Allow clearing the expiry date
    } else {
      const expiryDate = new Date(data.expires_at);
      
      if (isNaN(expiryDate.getTime())) {
        errors.push({
          field: 'expires_at',
          message: 'Некорректная дата окончания договора'
        });
      }
      // Note: We don't check if it's in the future for updates, 
      // as user might want to set past date for expired contracts
    }
  }
  
  return errors;
}

/**
 * Validates search parameters
 */
export function validateSearchParams(params: ContractSearchParams): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  // Page validation
  if (params.page !== undefined && (params.page < 1 || !Number.isInteger(params.page))) {
    errors.push({
      field: 'page',
      message: 'Номер страницы должен быть положительным целым числом'
    });
  }
  
  // Limit validation
  if (params.limit !== undefined) {
    if (params.limit < 1 || params.limit > 100 || !Number.isInteger(params.limit)) {
      errors.push({
        field: 'limit',
        message: 'Лимит должен быть от 1 до 100'
      });
    }
  }
  
  // Query length validation
  if (params.query !== undefined && params.query.length > 0 && params.query.length < 3) {
    errors.push({
      field: 'query',
      message: 'Поисковый запрос должен содержать минимум 3 символа'
    });
  }
  
  // Status validation
  if (params.status !== undefined) {
    const validStatuses = ['draft', 'active', 'expiring', 'expired'];
    if (!validStatuses.includes(params.status)) {
      errors.push({
        field: 'status',
        message: 'Некорректный статус для фильтрации'
      });
    }
  }
  
  // Sort field validation
  if (params.sort_by !== undefined) {
    const validSortFields = ['created_at', 'updated_at', 'title', 'advertiser_name'];
    if (!validSortFields.includes(params.sort_by)) {
      errors.push({
        field: 'sort_by',
        message: 'Некорректное поле для сортировки'
      });
    }
  }
  
  // Sort order validation
  if (params.sort_order !== undefined) {
    if (!['asc', 'desc'].includes(params.sort_order)) {
      errors.push({
        field: 'sort_order',
        message: 'Порядок сортировки должен быть "asc" или "desc"'
      });
    }
  }
  
  // INN validation for search
  if (params.advertiser_inn && !validateINN(params.advertiser_inn)) {
    errors.push({
      field: 'advertiser_inn',
      message: 'Некорректный ИНН для поиска'
    });
  }
  
  return errors;
}

/**
 * Sanitizes contract data before processing
 */
export function sanitizeContractData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as T;
  
  // Sanitize string fields
  const stringFields = ['title', 'advertiser_name', 'inn'] as const;
  
  for (const field of stringFields) {
    if (field in sanitized && sanitized[field] && typeof sanitized[field] === 'string') {
      (sanitized as any)[field] = sanitizeText(sanitized[field] as string);
    }
  }
  
  // Clean INN (remove non-digits)
  if ('inn' in sanitized && sanitized.inn && typeof sanitized.inn === 'string') {
    (sanitized as any).inn = (sanitized.inn as string).replace(/\D/g, '');
  }
  
  return sanitized;
}

/**
 * Checks if a contract is expired
 */
export function isContractExpired(contract: { expires_at?: string | null }): boolean {
  if (!contract.expires_at) return false;
  
  const expiryDate = new Date(contract.expires_at);
  const now = new Date();
  
  return expiryDate <= now;
}

/**
 * Gets contract expiry status with human-readable message
 */
export function getContractExpiryStatus(contract: { expires_at?: string | null }): {
  status: 'active' | 'expiring_soon' | 'expired';
  message: string;
  days_until_expiry?: number;
} {
  if (!contract.expires_at) {
    return {
      status: 'active',
      message: 'Бессрочный договор'
    };
  }
  
  const expiryDate = new Date(contract.expires_at);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      status: 'expired',
      message: `Истек ${Math.abs(diffDays)} дн. назад`,
      days_until_expiry: diffDays
    };
  } else if (diffDays <= 30) {
    return {
      status: 'expiring_soon',
      message: `Истекает через ${diffDays} дн.`,
      days_until_expiry: diffDays
    };
  } else {
    return {
      status: 'active',
      message: `Действует до ${expiryDate.toLocaleDateString('ru-RU')}`,
      days_until_expiry: diffDays
    };
  }
}

/**
 * Validates contract type
 */
export function validateContractType(contractType: ContractType): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  const validTypes: ContractType[] = ['self_advertising', 'agency', 'direct'];
  if (!validTypes.includes(contractType)) {
    errors.push({
      field: 'contract_type',
      message: 'Недопустимый тип договора'
    });
  }
  
  return errors;
}

/**
 * Validates contract amount
 */
export function validateContractAmount(amount?: number): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  if (amount !== undefined) {
    if (amount < 0) {
      errors.push({
        field: 'contract_amount',
        message: 'Сумма договора не может быть отрицательной'
      });
    }
    
    if (amount > 999999999999.99) {
      errors.push({
        field: 'contract_amount',
        message: 'Сумма договора слишком большая'
      });
    }
  }
  
  return errors;
}

/**
 * Validates phone number (Russian format)
 */
export function validatePhoneNumber(phone?: string): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  if (phone) {
    // Strip spaces, dashes and parentheses for validation
    const sanitized = phone.replace(/[\s\-()]/g, '');
    
    // Accept E.164 international format: optional + followed by 11-15 digits
    const phoneRegex = /^\+?[0-9]{11,15}$/;
    if (!phoneRegex.test(sanitized)) {
      errors.push({
        field: 'advertiser_phone',
        message: 'Неверный формат номера телефона'
      });
    }
  }
  
  return errors;
}

/**
 * Validates email address
 */
export function validateEmail(email?: string): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        field: 'advertiser_email',
        message: 'Неверный формат email адреса'
      });
    }
  }
  
  return errors;
}

/**
 * Validates contract number
 */
export function validateContractNumber(contractNumber?: string): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  if (contractNumber) {
    if (contractNumber.length > 100) {
      errors.push({
        field: 'contract_number',
        message: 'Номер договора не может быть длиннее 100 символов'
      });
    }
    
    if (contractNumber.trim().length === 0) {
      errors.push({
        field: 'contract_number',
        message: 'Номер договора не может быть пустым'
      });
    }
  }
  
  return errors;
}

/**
 * Validates contract date
 */
export function validateContractDate(contractDate?: string): ContractValidationError[] {
  const errors: ContractValidationError[] = [];
  
  if (contractDate) {
    const date = new Date(contractDate);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'contract_date',
        message: 'Неверный формат даты договора'
      });
    } else {
      // Contract date should not be in the future
      const now = new Date();
      if (date > now) {
        errors.push({
          field: 'contract_date',
          message: 'Дата договора не может быть в будущем'
        });
      }
      
      // Contract date should not be too old (more than 10 years)
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      if (date < tenYearsAgo) {
        errors.push({
          field: 'contract_date',
          message: 'Дата договора не может быть старше 10 лет'
        });
      }
    }
  }
  
  return errors;
} 