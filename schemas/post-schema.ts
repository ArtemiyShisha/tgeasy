import { z } from 'zod'
import { POST_CONSTANTS } from '@/types/post'

// Базовая схема поста
export const PostBaseSchema = z.object({
  title: z.string()
    .min(1, 'Заголовок обязателен')
    .max(POST_CONSTANTS.MAX_TITLE_LENGTH, `Заголовок не может быть длиннее ${POST_CONSTANTS.MAX_TITLE_LENGTH} символов`)
    .trim(),
  
  creative_text: z.string()
    .trim()
    .max(POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH, `Текст креатива не может быть длиннее ${POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH} символов`)
    .optional()
    .default(''),
  
  creative_images: z.array(z.string().url('Некорректный URL изображения'))
    .max(POST_CONSTANTS.MAX_MEDIA_FILES, `Максимум ${POST_CONSTANTS.MAX_MEDIA_FILES} изображений`)
    .optional()
    .default([]),
  
  target_url: z.string().url('Некорректный URL').optional().nullable(),
  
  placement_cost: z.number()
    .positive('Стоимость должна быть положительной')
    .max(999999999.99, 'Слишком большая стоимость')
    .optional()
    .nullable(),
  
  placement_currency: z.enum(['RUB', 'USD', 'EUR']).default('RUB'),
  
  advertiser_inn: z.string()
    .regex(POST_CONSTANTS.INN_REGEX, 'ИНН должен содержать 10-12 цифр')
    .trim()
    .optional()
    .nullable(),
  
  advertiser_name: z.string()
    .max(255, 'Название рекламодателя слишком длинное')
    .trim()
    .optional()
    .nullable(),
  
  product_description: z.string()
    .max(1000, 'Описание товара/услуги слишком длинное')
    .trim()
    .optional()
    .nullable(),
  
  // ККТУ может потребоваться при маркировке
  kktu: z.string()
    .trim()
    .optional()
    .nullable()
})

// Схема для создания поста
export const CreatePostSchema = z.object({
  channel_id: z.string().uuid('Некорректный ID канала'),
  contract_id: z.string().uuid('Некорректный ID договора').optional().nullable(),
  title: z.string()
    .min(1, 'Заголовок обязателен')
    .max(POST_CONSTANTS.MAX_TITLE_LENGTH, `Заголовок не может быть длиннее ${POST_CONSTANTS.MAX_TITLE_LENGTH} символов`)
    .trim(),
  creative_text: z.string()
    .trim()
    .max(POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH, `Текст креатива не может быть длиннее ${POST_CONSTANTS.MAX_CREATIVE_TEXT_LENGTH} символов`)
    .optional()
    .default(''),
  creative_images: z.array(z.string().url()).optional().default([]),
  target_url: z.string().url('Некорректный URL').optional().nullable(),
  placement_cost: z.number().positive('Стоимость должна быть положительной').optional().nullable(),
  placement_currency: z.enum(['RUB', 'USD', 'EUR']).optional().default('RUB'),
  advertiser_inn: z.string().optional().nullable(),
  advertiser_name: z.string().optional().nullable(),
  product_description: z.string().optional().nullable(),
  kktu: z.string().optional().nullable(),
  requires_marking: z.boolean().optional().default(false),
  scheduled_at: z.string().datetime('Некорректная дата планирования').optional().nullable()
}).superRefine((data, ctx) => {
  // Проверяем только при необходимости маркировки
  if (data.requires_marking) {
    if (!data.contract_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Договор обязателен при маркировке',
        path: ['contract_id']
      })
    }

    if (!data.kktu || data.kktu.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ККТУ обязателен при маркировке',
        path: ['kktu']
      })
    } else if (!POST_CONSTANTS.KKTU_REGEX.test(data.kktu.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ККТУ должен состоять из 6 цифр',
        path: ['kktu']
      })
    }

    if (!data.product_description || data.product_description.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Описание товара обязательно при маркировке',
        path: ['product_description']
      })
    }
  }
})

// Схема для обновления поста
export const UpdatePostSchema = PostBaseSchema.partial().extend({
  channel_id: z.string().uuid('Некорректный ID канала').optional(),
  contract_id: z.string().uuid('Некорректный ID договора').optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'archived']).optional(),
  erid: z.string().max(50, 'ERID слишком длинный').optional().nullable(),
  ord_status: z.enum(['pending', 'registered', 'failed', 'expired']).optional(),
  ord_error_message: z.string().max(500, 'Сообщение об ошибке слишком длинное').optional().nullable(),
  scheduled_at: z.string().datetime('Некорректная дата планирования').optional().nullable(),
  published_at: z.string().datetime('Некорректная дата публикации').optional().nullable(),
  telegram_message_id: z.number().int('ID сообщения должен быть целым числом').positive().optional().nullable()
})

// Схема для планирования поста
export const SchedulePostSchema = z.object({
  scheduled_at: z.string()
    .datetime('Некорректная дата планирования')
    .refine((date) => {
      const scheduledDate = new Date(date)
      const now = new Date()
      const minDate = new Date(now.getTime() + 5 * 60 * 1000) // +5 минут от текущего времени
      return scheduledDate >= minDate
    }, 'Дата планирования должна быть не менее чем через 5 минут от текущего времени')
})

// Схема для фильтров поиска
export const PostFiltersSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'archived']).optional(),
  channel_id: z.string().uuid('Некорректный ID канала').optional(),
  contract_id: z.string().uuid('Некорректный ID договора').optional(),
  ord_status: z.enum(['pending', 'registered', 'failed', 'expired']).optional(),
  date_from: z.string().datetime('Некорректная дата начала').optional(),
  date_to: z.string().datetime('Некорректная дата окончания').optional(),
  search: z.string().max(255, 'Поисковый запрос слишком длинный').optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
}).refine((data) => {
  if (data.date_from && data.date_to) {
    return new Date(data.date_from) <= new Date(data.date_to)
  }
  return true
}, {
  message: 'Дата начала должна быть раньше даты окончания',
  path: ['date_to']
})

// Схема для загрузки медиафайлов
export const PostMediaSchema = z.object({
  file_name: z.string().min(1, 'Имя файла обязательно').max(255, 'Имя файла слишком длинное'),
  file_size: z.number().int().positive('Размер файла должен быть положительным'),
  file_type: z.string().refine((type) => {
    const supportedTypes = [...POST_CONSTANTS.SUPPORTED_IMAGE_TYPES, ...POST_CONSTANTS.SUPPORTED_VIDEO_TYPES] as readonly string[]
    return supportedTypes.includes(type)
  }, 'Неподдерживаемый тип файла'),
  sort_order: z.number().int().min(0).default(0)
}).refine((data) => {
  const isImage = (POST_CONSTANTS.SUPPORTED_IMAGE_TYPES as readonly string[]).includes(data.file_type)
  const isVideo = (POST_CONSTANTS.SUPPORTED_VIDEO_TYPES as readonly string[]).includes(data.file_type)
  
  if (isImage && data.file_size > POST_CONSTANTS.MAX_IMAGE_SIZE) {
    return false
  }
  
  if (isVideo && data.file_size > POST_CONSTANTS.MAX_VIDEO_SIZE) {
    return false
  }
  
  return true
}, {
  message: 'Файл превышает максимально допустимый размер',
  path: ['file_size']
})

// Экспорт TypeScript типов из схем
export type CreatePostDTO = z.infer<typeof CreatePostSchema>
export type UpdatePostDTO = z.infer<typeof UpdatePostSchema>
export type SchedulePostDTO = z.infer<typeof SchedulePostSchema>
export type PostFiltersDTO = z.infer<typeof PostFiltersSchema>
export type PostMediaDTO = z.infer<typeof PostMediaSchema>

// Утилиты для валидации
export const validateCreatePost = (data: unknown) => CreatePostSchema.parse(data)
export const validateUpdatePost = (data: unknown) => UpdatePostSchema.parse(data)
export const validateSchedulePost = (data: unknown) => SchedulePostSchema.parse(data)
export const validatePostFilters = (data: unknown) => PostFiltersSchema.parse(data)
export const validatePostMedia = (data: unknown) => PostMediaSchema.parse(data)

// Безопасная валидация с возвратом результата
export const safeValidateCreatePost = (data: unknown) => CreatePostSchema.safeParse(data)
export const safeValidateUpdatePost = (data: unknown) => UpdatePostSchema.safeParse(data)
export const safeValidateSchedulePost = (data: unknown) => SchedulePostSchema.safeParse(data)
export const safeValidatePostFilters = (data: unknown) => PostFiltersSchema.safeParse(data)
export const safeValidatePostMedia = (data: unknown) => PostMediaSchema.safeParse(data) 