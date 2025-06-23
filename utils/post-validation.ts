import { CreatePostInput, UpdatePostInput, POST_CONSTANTS, PostError } from '@/types/post'

/**
 * Валидация ИНН (10 или 12 цифр)
 */
export function validateINN(inn: string): boolean {
  if (!inn || typeof inn !== 'string') return false
  
  // Убираем все нецифровые символы
  const cleanInn = inn.replace(/\D/g, '')
  
  // Проверяем длину
  if (cleanInn.length !== 10 && cleanInn.length !== 12) return false
  
  // Проверяем контрольные суммы
  if (cleanInn.length === 10) {
    return validateINN10(cleanInn)
  } else {
    return validateINN12(cleanInn)
  }
}

/**
 * Валидация 10-значного ИНН
 */
function validateINN10(inn: string): boolean {
  const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(inn[i]) * coefficients[i]
  }
  
  const checkSum = (sum % 11) % 10
  return checkSum === parseInt(inn[9])
}

/**
 * Валидация 12-значного ИНН
 */
function validateINN12(inn: string): boolean {
  const coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
  const coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
  
  let sum1 = 0
  for (let i = 0; i < 10; i++) {
    sum1 += parseInt(inn[i]) * coefficients1[i]
  }
  const checkSum1 = (sum1 % 11) % 10
  
  if (checkSum1 !== parseInt(inn[10])) return false
  
  let sum2 = 0
  for (let i = 0; i < 11; i++) {
    sum2 += parseInt(inn[i]) * coefficients2[i]
  }
  const checkSum2 = (sum2 % 11) % 10
  
  return checkSum2 === parseInt(inn[11])
}

/**
 * Валидация ККТУ (6 цифр)
 */
export function validateKKTU(kktu: string): boolean {
  if (!kktu || typeof kktu !== 'string') return false
  
  const cleanKktu = kktu.replace(/\D/g, '')
  return cleanKktu.length === 6
}

/**
 * Валидация URL
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Валидация email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Валидация телефона (российский формат)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  // Убираем все нецифровые символы кроме +
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  
  // Российские номера: +7XXXXXXXXXX или 8XXXXXXXXXX
  const phoneRegex = /^(\+7|8)\d{10}$/
  return phoneRegex.test(cleanPhone)
}

/**
 * Валидация размера файла
 */
export function validateFileSize(size: number, isVideo: boolean = false): boolean {
  const maxSize = isVideo ? POST_CONSTANTS.MAX_VIDEO_SIZE : POST_CONSTANTS.MAX_IMAGE_SIZE
  return size > 0 && size <= maxSize
}

/**
 * Валидация типа файла
 */
export function validateFileType(mimeType: string): boolean {
  const supportedTypes: string[] = [
    ...POST_CONSTANTS.SUPPORTED_IMAGE_TYPES,
    ...POST_CONSTANTS.SUPPORTED_VIDEO_TYPES
  ]
  return supportedTypes.includes(mimeType)
}

/**
 * Валидация данных для создания поста
 */
export function validateCreatePostInput(data: any): PostError[] {
  const errors: PostError[] = []

  // Валидация заголовка (всегда обязателен)
  if (!data.title || data.title.trim().length === 0) {
    errors.push(new PostError('Заголовок обязателен', 'VALIDATION_ERROR', 'title'))
  } else if (data.title.length > POST_CONSTANTS.MAX_TITLE_LENGTH) {
    errors.push(new PostError(
      `Заголовок не должен превышать ${POST_CONSTANTS.MAX_TITLE_LENGTH} символов`,
      'VALIDATION_ERROR',
      'title'
    ))
  }

  // Валидация канала (всегда обязателен)
  if (!data.channel_id) {
    errors.push(new PostError('Канал обязателен', 'VALIDATION_ERROR', 'channel_id'))
  }

  // Валидация текста креатива (опциональна для черновиков)
  if (data.creative_text && data.creative_text.length > POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH) {
    errors.push(new PostError(
      `Текст креатива не должен превышать ${POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH} символов`,
      'VALIDATION_ERROR',
      'creative_text'
    ))
  }

  // Валидация URL (если указан)
  if (data.target_url && data.target_url.trim()) {
    try {
      new URL(data.target_url)
    } catch {
      errors.push(new PostError('Некорректный URL', 'VALIDATION_ERROR', 'target_url'))
    }
  }

  // Валидация стоимости (если указана)
  if (data.placement_cost !== undefined && data.placement_cost !== null) {
    if (typeof data.placement_cost !== 'number' || data.placement_cost <= 0) {
      errors.push(new PostError('Стоимость должна быть положительным числом', 'VALIDATION_ERROR', 'placement_cost'))
    }
  }

  // Валидация медиафайлов (если есть)
  if (data.creative_images && Array.isArray(data.creative_images)) {
    if (data.creative_images.length > POST_CONSTANTS.MAX_MEDIA_FILES) {
      errors.push(new PostError(
        `Максимальное количество медиафайлов: ${POST_CONSTANTS.MAX_MEDIA_FILES}`,
        'VALIDATION_ERROR',
        'creative_images'
      ))
    }
  }

  // Валидация маркировки (если требуется)
  if (data.requires_marking) {
    if (!data.contract_id) {
      errors.push(new PostError('Договор обязателен при маркировке', 'VALIDATION_ERROR', 'contract_id'))
    }

    if (!data.kktu || data.kktu.trim().length === 0) {
      errors.push(new PostError('ККТУ обязателен при маркировке', 'VALIDATION_ERROR', 'kktu'))
    } else if (!POST_CONSTANTS.KKTU_REGEX.test(data.kktu.trim())) {
      errors.push(new PostError('ККТУ должен состоять из 6 цифр', 'VALIDATION_ERROR', 'kktu'))
    }

    if (!data.product_description || data.product_description.trim().length === 0) {
      errors.push(new PostError('Описание товара обязательно при маркировке', 'VALIDATION_ERROR', 'product_description'))
    }
  }

  return errors
}

/**
 * Валидация данных для обновления поста
 */
export function validateUpdatePostInput(data: UpdatePostInput): PostError[] {
  const errors: PostError[] = []

  // Валидация заголовка (если указан)
  if (data.title !== undefined) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push(new PostError('Заголовок не может быть пустым', 'VALIDATION_ERROR', 'title'))
    } else if (data.title.length > POST_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push(new PostError(
        `Заголовок не должен превышать ${POST_CONSTANTS.MAX_TITLE_LENGTH} символов`, 
        'VALIDATION_ERROR', 
        'title'
      ))
    }
  }

  // Валидация текста креатива (если указан)
  if (data.creative_text !== undefined) {
    if (!data.creative_text || data.creative_text.trim().length === 0) {
      errors.push(new PostError('Текст креатива не может быть пустым', 'VALIDATION_ERROR', 'creative_text'))
    } else if (data.creative_text.length > POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH) {
      errors.push(new PostError(
        `Текст креатива не должен превышать ${POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH} символов`, 
        'VALIDATION_ERROR', 
        'creative_text'
      ))
    } else if (data.creative_text.length < POST_CONSTANTS.MIN_CREATIVE_TEXT_LENGTH) {
      errors.push(new PostError(
        `Текст креатива должен содержать минимум ${POST_CONSTANTS.MIN_CREATIVE_TEXT_LENGTH} символ`, 
        'VALIDATION_ERROR', 
        'creative_text'
      ))
    }
  }

  // Валидация описания товара (если указано)
  if (data.product_description !== undefined) {
    if (!data.product_description || data.product_description.trim().length === 0) {
      errors.push(new PostError('Описание товара не может быть пустым', 'VALIDATION_ERROR', 'product_description'))
    } else if (data.product_description.length > 1000) {
      errors.push(new PostError('Описание товара не должно превышать 1000 символов', 'VALIDATION_ERROR', 'product_description'))
    }
  }

  // Валидация целевой ссылки (если указана)
  if (data.target_url !== undefined && data.target_url !== null && !validateURL(data.target_url)) {
    errors.push(new PostError('Введите корректную целевую ссылку', 'VALIDATION_ERROR', 'target_url'))
  }

  // Валидация стоимости размещения (если указана)
  if (data.placement_cost !== undefined && data.placement_cost !== null) {
    if (data.placement_cost < 0) {
      errors.push(new PostError('Стоимость размещения не может быть отрицательной', 'VALIDATION_ERROR', 'placement_cost'))
    } else if (data.placement_cost > 10000000) {
      errors.push(new PostError('Стоимость размещения не может превышать 10 млн рублей', 'VALIDATION_ERROR', 'placement_cost'))
    }
  }

  // Валидация изображений (если указаны)
  if (data.creative_images !== undefined && data.creative_images.length > POST_CONSTANTS.MAX_MEDIA_FILES) {
    errors.push(new PostError(
      `Максимальное количество медиафайлов: ${POST_CONSTANTS.MAX_MEDIA_FILES}`, 
      'VALIDATION_ERROR', 
      'creative_images'
    ))
  }

  // Валидация даты планирования (если указана)
  if (data.scheduled_at !== undefined && data.scheduled_at !== null) {
    const scheduledDate = new Date(data.scheduled_at)
    if (isNaN(scheduledDate.getTime())) {
      errors.push(new PostError('Некорректная дата планирования', 'VALIDATION_ERROR', 'scheduled_at'))
    } else if (scheduledDate <= new Date()) {
      errors.push(new PostError('Дата планирования должна быть в будущем', 'VALIDATION_ERROR', 'scheduled_at'))
    }
  }

  return errors
}

/**
 * Форматирование ИНН для отображения
 */
export function formatINN(inn: string): string {
  if (!inn) return ''
  
  const cleanInn = inn.replace(/\D/g, '')
  
  if (cleanInn.length === 10) {
    // ИНН юридического лица: XXXX-XXXXXX
    return cleanInn.replace(/(\d{4})(\d{6})/, '$1-$2')
  } else if (cleanInn.length === 12) {
    // ИНН физического лица: XXXX-XXXX-XXXX
    return cleanInn.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  return inn
}

/**
 * Очистка ИНН от форматирования
 */
export function cleanINN(inn: string): string {
  if (!inn) return ''
  return inn.replace(/\D/g, '')
}

/**
 * Проверка, является ли ИНН юридическим лицом
 */
export function isLegalEntityINN(inn: string): boolean {
  const cleanInn = cleanINN(inn)
  return cleanInn.length === 10
}

/**
 * Проверка, является ли ИНН физическим лицом
 */
export function isIndividualINN(inn: string): boolean {
  const cleanInn = cleanINN(inn)
  return cleanInn.length === 12
}

/**
 * Форматирование стоимости для отображения
 */
export function formatCurrency(amount: number, currency: 'RUB' | 'USD' | 'EUR' = 'RUB'): string {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  
  return formatter.format(amount)
}

/**
 * Получение текстового описания статуса поста
 */
export function getPostStatusText(status: 'draft' | 'scheduled' | 'published' | 'failed'): string {
  const statusTexts = {
    draft: 'Черновик',
    scheduled: 'Запланировано',
    published: 'Опубликовано',
    failed: 'Ошибка'
  }
  
  return statusTexts[status] || status
}

/**
 * Получение текстового описания статуса ОРД
 */
export function getOrdStatusText(status: 'pending' | 'registered' | 'failed'): string {
  const statusTexts = {
    pending: 'Ожидает регистрации',
    registered: 'Зарегистрировано',
    failed: 'Ошибка регистрации'
  }
  
  return statusTexts[status] || status
}

/**
 * Получение цвета для статуса поста
 */
export function getPostStatusColor(status: 'draft' | 'scheduled' | 'published' | 'failed'): string {
  const statusColors = {
    draft: 'gray',
    scheduled: 'blue',
    published: 'green',
    failed: 'red'
  }
  
  return statusColors[status] || 'gray'
}

/**
 * Получение цвета для статуса ОРД
 */
export function getOrdStatusColor(status: 'pending' | 'registered' | 'failed'): string {
  const statusColors = {
    pending: 'yellow',
    registered: 'green',
    failed: 'red'
  }
  
  return statusColors[status] || 'gray'
} 