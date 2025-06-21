'use client'

import React, { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onFileRemove: () => void
  error?: string
  accept?: string
  maxSize?: number // in bytes
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  selectedFile,
  onFileRemove,
  error,
  accept = '.pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `Файл слишком большой. Максимальный размер: ${formatBytes(maxSize)}`
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`
    }

    return null
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const validationError = validateFile(files[0])
      
      if (validationError) {
        setUploadError(validationError)
        return
      }

      setUploadError('')
      onFileSelect(files[0])
    }
  }, [onFileSelect, validateFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const validationError = validateFile(files[0])
      
      if (validationError) {
        setUploadError(validationError)
        return
      }

      setUploadError('')
      onFileSelect(files[0])
    }
  }, [onFileSelect, validateFile])

  const handleRemoveFile = () => {
    setUploadError('')
    onFileRemove()
  }

  const displayError = error || uploadError

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : displayError 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={`mx-auto h-12 w-12 mb-4 ${displayError ? 'text-red-400' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-2 ${displayError ? 'text-red-600' : 'text-gray-900'}`}>
            Загрузите договор
          </p>
          <p className={`text-sm ${displayError ? 'text-red-500' : 'text-gray-500'}`}>
            Перетащите файл сюда или нажмите для выбора
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Поддерживаются: PDF, DOC, DOCX (до 10 МБ)
          </p>
          {displayError && (
            <p className="text-sm text-red-500 mt-2">{displayError}</p>
          )}
          <input
            id="file-input"
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploadZone 