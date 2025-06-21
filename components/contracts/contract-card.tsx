'use client'

import { useState } from 'react'
import { FileText, Download, Eye, MoreHorizontal, Calendar, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Contract } from '@/types/contract'
import { contractsApi } from '@/lib/api/contracts-api'

interface ContractCardProps {
  contract: Contract
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onRefresh: () => void
}

export function ContractCard({ 
  contract, 
  isSelected, 
  onSelect, 
  onRefresh 
}: ContractCardProps) {
  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            Активный
          </Badge>
        )
      case 'expiring':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
            Истекает
          </Badge>
        )
      case 'expired':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            Истек
          </Badge>
        )
      case 'draft':
        return (
          <Badge className="bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-50">
            Черновик
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async () => {
    try {
      const blob = await contractsApi.downloadContract(contract.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = contract.file_name || contract.title || 'contract.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Не удалось скачать файл договора')
    }
  }

  const handlePreview = async () => {
    try {
      const blob = await contractsApi.downloadContract(contract.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) {
      console.error('Preview failed:', error)
      alert('Не удалось открыть договор для просмотра')
    }
  }

  return (
    <div className={`bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-lg transition-shadow ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-200' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-zinc-900 truncate">
              {contract.title}
            </h3>
            {contract.file_size && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatBytes(contract.file_size)}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Скачать
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Advertiser Info */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Building className="w-3 h-3 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-900">
            {contract.advertiser_name}
          </p>
        </div>
        <p className="text-xs text-zinc-600 ml-5">
          ИНН: {contract.advertiser_inn}
        </p>
      </div>

      {/* Status */}
      <div className="mb-3">
        {getStatusBadge(contract.status)}
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Calendar className="w-3 h-3" />
          <span>Создан: {formatDate(contract.created_at)}</span>
        </div>
        {contract.expires_at && (
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <Calendar className="w-3 h-3" />
            <span>Истекает: {formatDate(contract.expires_at)}</span>
          </div>
        )}
      </div>
    </div>
  )
} 