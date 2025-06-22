'use client'

import React, { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUploadZone } from './index'
import { useContracts, useContractUpload } from '@/hooks/use-contracts'
import { 
  ContractType,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_DESCRIPTIONS,
  CreateContractDTO,
  ContractUploadResponseBase
} from '@/types/contract'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface ContractUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ContractFormData {
  title: string
  advertiser_name: string
  advertiser_inn: string
  contract_type: ContractType
  advertiser_legal_address?: string
  advertiser_contact_person?: string
  advertiser_phone?: string
  advertiser_email?: string
  contract_number?: string
  contract_date?: string
  expires_at: string
  file: File | null
}

interface ContractFormErrors {
  title?: string
  advertiser_name?: string
  advertiser_inn?: string
  file?: string
  expires_at?: string
  contract_type?: string
  advertiser_legal_address?: string
  advertiser_contact_person?: string
  advertiser_phone?: string
  advertiser_email?: string
  contract_number?: string
  contract_date?: string
}

export function ContractUploadModal({ isOpen, onClose, onSuccess }: ContractUploadModalProps) {
  const { user } = useAuth()
  const { refetch } = useContracts()
  const [formData, setFormData] = useState<ContractFormData>({
    title: '',
    advertiser_name: '',
    advertiser_inn: '',
    contract_type: 'direct',
    expires_at: '',
    file: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ContractFormErrors>({})

  const handleInputChange = (field: keyof ContractFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileSelect = (file: File) => {
    setFormData(prev => ({ ...prev, file }))
    setErrors(prev => ({ ...prev, file: undefined }))
  }

  const handleFileRemove = () => {
    setFormData(prev => ({ ...prev, file: null }))
    setErrors(prev => ({ ...prev, file: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: ContractFormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно'
    }

    if (!formData.advertiser_name.trim()) {
      newErrors.advertiser_name = 'Название рекламодателя обязательно'
    }

    if (!formData.advertiser_inn.trim()) {
      newErrors.advertiser_inn = 'ИНН обязателен'
    } else if (!/^\d{10}$|^\d{12}$/.test(formData.advertiser_inn)) {
      newErrors.advertiser_inn = 'ИНН должен содержать 10 или 12 цифр'
    }

    // Phone validation (E.164 basic)
    if (formData.advertiser_phone && !/^\+?[0-9]{11,15}$/.test(formData.advertiser_phone.replace(/[^0-9+]/g, ''))) {
      newErrors.advertiser_phone = 'Телефон должен быть в международном формате, минимум 11 цифр'
    }

    // Email validation
    if (formData.advertiser_email && !/^[\w.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.advertiser_email)) {
      newErrors.advertiser_email = 'Неверный формат e-mail'
    }

    if (!formData.file) {
      newErrors.file = 'Файл договора обязателен'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file || !formData.title || !formData.advertiser_name || !formData.advertiser_inn) {
      setErrors({
        file: !formData.file ? 'Файл обязателен' : undefined,
        title: !formData.title ? 'Название обязательно' : undefined,
        advertiser_name: !formData.advertiser_name ? 'Имя рекламодателя обязательно' : undefined,
        advertiser_inn: !formData.advertiser_inn ? 'ИНН обязателен' : undefined,
      })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('file', formData.file)
      uploadData.append('title', formData.title)
      uploadData.append('advertiser_name', formData.advertiser_name)
      uploadData.append('advertiser_inn', formData.advertiser_inn)
      
      // Add optional fields
      if (formData.expires_at) uploadData.append('expires_at', formData.expires_at)
      if (formData.contract_type) uploadData.append('contract_type', formData.contract_type)
      if (formData.advertiser_legal_address) uploadData.append('advertiser_legal_address', formData.advertiser_legal_address)
      if (formData.advertiser_contact_person) uploadData.append('advertiser_contact_person', formData.advertiser_contact_person)
      if (formData.advertiser_phone) uploadData.append('advertiser_phone', formData.advertiser_phone)
      if (formData.advertiser_email) uploadData.append('advertiser_email', formData.advertiser_email)
      if (formData.contract_number) uploadData.append('contract_number', formData.contract_number)
      if (formData.contract_date) uploadData.append('contract_date', formData.contract_date)

      console.log('Auth debug:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email
      })

      // Get authentication headers
      const headers: Record<string, string> = {}

      // Always attempt to retrieve current session token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      console.log('Session fetch:', { hasSession: !!session, sessionError: sessionError?.message })

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
        console.log('Adding auth token to request')
      } else {
        console.log('No auth token found, request will be in demo mode')
      }

      // Make API call
      const response = await fetch('/api/contracts/upload', {
        method: 'POST',
        headers,
        body: uploadData,
        credentials: 'same-origin',
      })

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const result: ContractUploadResponseBase = await response.json()
      console.log('API Response:', result)

      if (result.success && result.data) {
        console.log('Contract created successfully:', result.data.id)
        
        // Refresh the contracts list
        await refetch()
        
        // Reset form and close modal
        resetForm()
        onClose()
      } else {
        console.error('Contract creation failed:', result.error)
        if (result.validation_errors && result.validation_errors.length > 0) {
          const newErrors: ContractFormErrors = {}
          result.validation_errors.forEach(error => {
            newErrors[error.field as keyof ContractFormErrors] = error.message
          })
          setErrors(newErrors)
        }
        // Всегда показываем текст ошибки от сервера
        if (result.error) {
          setGeneralError(result.error)
          // Простое распознавание полей в текстовом сообщении
          const autoErrors: ContractFormErrors = {}
          const err = result.error.toLowerCase()
          if (err.includes('инн')) autoErrors.advertiser_inn = 'Некорректный ИНН'
          if (err.includes('телефон')) autoErrors.advertiser_phone = 'Неверный формат телефона'
          if (err.includes('email') || err.includes('e-mail')) autoErrors.advertiser_email = 'Неверный формат email'
          if (Object.keys(autoErrors).length) setErrors(autoErrors)
        }
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      setGeneralError(error instanceof Error ? error.message : 'Произошла ошибка. Попробуйте ещё раз')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      advertiser_name: '',
      advertiser_inn: '',
      contract_type: 'direct',
      expires_at: '',
      file: null,
    })
    setErrors({})
  }

  const hasFormErrors = Object.values(errors).some(Boolean)
  const [generalError, setGeneralError] = useState<string | null>(null)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-zinc-900">
            Загрузить договор
          </DialogTitle>
        </DialogHeader>

        {generalError && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-px" />
            <span>{generalError}</span>
          </div>
        )}
        {hasFormErrors && !generalError && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-px" />
            <span>Пожалуйста, исправьте ошибки в форме.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* File Upload */}
          <div>
            <Label className="text-sm font-medium text-zinc-700">
              Файл договора
            </Label>
            <FileUploadZone
              onFileSelect={handleFileSelect}
              selectedFile={formData.file}
              onFileRemove={handleFileRemove}
              error={errors.file}
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-zinc-700">
              Название договора
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Например: Договор с ООО Рекламное агентство"
              className={`mt-1 ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Advertiser Name */}
          <div>
            <Label htmlFor="advertiser_name" className="text-sm font-medium text-zinc-700">
              Название рекламодателя
            </Label>
            <Input
              id="advertiser_name"
              value={formData.advertiser_name}
              onChange={(e) => handleInputChange('advertiser_name', e.target.value)}
              placeholder="ООО Рекламное агентство"
              className={`mt-1 ${errors.advertiser_name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.advertiser_name && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_name}</p>
            )}
          </div>

          {/* Advertiser INN */}
          <div>
            <Label htmlFor="advertiser_inn" className="text-sm font-medium text-zinc-700">
              ИНН рекламодателя
            </Label>
            <Input
              id="advertiser_inn"
              value={formData.advertiser_inn}
              onChange={(e) => handleInputChange('advertiser_inn', e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              maxLength={12}
              className={`mt-1 ${errors.advertiser_inn ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <p className="text-xs text-zinc-500 mt-1">10 или 12 цифр</p>
            {errors.advertiser_inn && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_inn}</p>
            )}
          </div>

                     {/* Contract Type */}
           <div>
             <Label className="text-sm font-medium text-zinc-700">
               Тип договора
             </Label>
             <Select
               value={formData.contract_type}
               onValueChange={(value) => handleInputChange('contract_type', value as ContractType)}
             >
               <SelectTrigger className="mt-1">
                 <SelectValue placeholder="Выберите тип договора" />
               </SelectTrigger>
               <SelectContent>
                 {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                   <SelectItem key={value} value={value}>
                     {label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {errors.contract_type && (
               <p className="mt-1 text-xs text-red-600">{errors.contract_type}</p>
             )}
           </div>

          {/* Advertiser Legal Address */}
          <div>
            <Label htmlFor="advertiser_legal_address" className="text-sm font-medium text-zinc-700">
              Юридический адрес рекламодателя
            </Label>
            <Input
              id="advertiser_legal_address"
              value={formData.advertiser_legal_address || ''}
              onChange={(e) => handleInputChange('advertiser_legal_address', e.target.value)}
              placeholder="123456, г. Москва, ул. Ленина, д. 1"
              className={`mt-1 ${errors.advertiser_legal_address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.advertiser_legal_address && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_legal_address}</p>
            )}
          </div>

          {/* Advertiser Contact Person */}
          <div>
            <Label htmlFor="advertiser_contact_person" className="text-sm font-medium text-zinc-700">
              Контактное лицо рекламодателя
            </Label>
            <Input
              id="advertiser_contact_person"
              value={formData.advertiser_contact_person || ''}
              onChange={(e) => handleInputChange('advertiser_contact_person', e.target.value)}
              placeholder="Иванов Иван Иванович"
              className={`mt-1 ${errors.advertiser_contact_person ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.advertiser_contact_person && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_contact_person}</p>
            )}
          </div>

          {/* Advertiser Phone */}
          <div>
            <Label htmlFor="advertiser_phone" className="text-sm font-medium text-zinc-700">
              Телефон рекламодателя
            </Label>
            <Input
              id="advertiser_phone"
              value={formData.advertiser_phone || ''}
              onChange={(e) => handleInputChange('advertiser_phone', e.target.value)}
              placeholder="+7 (123) 456-78-90"
              className={`mt-1 ${errors.advertiser_phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <p className="text-xs text-zinc-500 mt-1">Формат: +7XXXXXXXXXX (11-15 цифр)</p>
            {errors.advertiser_phone && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_phone}</p>
            )}
          </div>

          {/* Advertiser Email */}
          <div>
            <Label htmlFor="advertiser_email" className="text-sm font-medium text-zinc-700">
              Email рекламодателя
            </Label>
            <Input
              id="advertiser_email"
              value={formData.advertiser_email || ''}
              onChange={(e) => handleInputChange('advertiser_email', e.target.value)}
              placeholder="ivanov@example.com"
              className={`mt-1 ${errors.advertiser_email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <p className="text-xs text-zinc-500 mt-1">Формат: name@example.com</p>
            {errors.advertiser_email && (
              <p className="mt-1 text-xs text-red-600">{errors.advertiser_email}</p>
            )}
          </div>

          {/* Contract Number */}
          <div>
            <Label htmlFor="contract_number" className="text-sm font-medium text-zinc-700">
              Номер договора
            </Label>
            <Input
              id="contract_number"
              value={formData.contract_number || ''}
              onChange={(e) => handleInputChange('contract_number', e.target.value)}
              placeholder="Введите номер договора"
              className={`mt-1 ${errors.contract_number ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.contract_number && (
              <p className="mt-1 text-xs text-red-600">{errors.contract_number}</p>
            )}
          </div>

          {/* Contract Date */}
          <div>
            <Label htmlFor="contract_date" className="text-sm font-medium text-zinc-700">
              Дата заключения договора
            </Label>
            <Input
              id="contract_date"
              type="date"
              value={formData.contract_date}
              onChange={(e) => handleInputChange('contract_date', e.target.value)}
              className="mt-1"
            />
            {errors.contract_date && (
              <p className="mt-1 text-xs text-red-600">{errors.contract_date}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <Label htmlFor="expires_at" className="text-sm font-medium text-zinc-700">
              Дата окончания <span className="text-zinc-500">(необязательно)</span>
            </Label>
            <Input
              id="expires_at"
              type="date"
              value={formData.expires_at}
              onChange={(e) => handleInputChange('expires_at', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Отменить
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Загрузка...' : 'Загрузить договор'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 