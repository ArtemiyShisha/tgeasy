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
import { formatBytes, formatDate } from '@/lib/utils'
import type { Contract } from '@/types/contract'

interface ContractTableProps {
  contracts: Contract[]
  selectedContracts: string[]
  onContractSelect: (contractId: string, selected: boolean) => void
  onRefresh: () => void
}

export function ContractTable({ 
  contracts, 
  selectedContracts, 
  onContractSelect, 
  onRefresh 
}: ContractTableProps) {
  const [sortBy, setSortBy] = useState<'created_at' | 'expires_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortedContracts = [...contracts].sort((a, b) => {
    let aValue: string | Date
    let bValue: string | Date

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.created_at)
        bValue = new Date(b.created_at)
        break
      case 'expires_at':
        aValue = a.expires_at ? new Date(a.expires_at) : new Date(0)
        bValue = b.expires_at ? new Date(b.expires_at) : new Date(0)
        break
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

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

  const handleDownload = (contract: Contract) => {
    const url = `/api/contracts/${contract.id}/download?dl=1`
    const link = document.createElement('a')
    link.href = url
    link.download = contract.file_name || contract.title || 'contract.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handlePreview = (contract: Contract) => {
    const url = `/api/contracts/${contract.id}/download`
    window.open(url, '_blank')
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-3 px-4 w-8">
                <input
                  type="checkbox"
                  checked={selectedContracts.length === contracts.length && contracts.length > 0}
                  onChange={(e) => {
                    const allSelected = e.target.checked
                    contracts.forEach(contract => {
                      onContractSelect(contract.id, allSelected)
                    })
                  }}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('title')}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
                >
                  Документ
                  {sortBy === 'title' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-medium text-zinc-700">Рекламодатель</span>
              </th>
              <th className="text-left py-3 px-4">
                <span className="text-sm font-medium text-zinc-700">Статус</span>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('created_at')}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
                >
                  Создан
                  {sortBy === 'created_at' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4">
                <button
                  onClick={() => handleSort('expires_at')}
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
                >
                  Истекает
                  {sortBy === 'expires_at' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-right py-3 px-4 w-12">
                <span className="text-sm font-medium text-zinc-700">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedContracts.map((contract) => (
              <tr 
                key={contract.id} 
                className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedContracts.includes(contract.id)}
                    onChange={(e) => onContractSelect(contract.id, e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {contract.title}
                      </p>
                      {contract.file_size && (
                        <p className="text-xs text-zinc-500">
                          {formatBytes(contract.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {contract.advertiser_name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      ИНН: {contract.advertiser_inn}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(contract.status)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-sm text-zinc-600">
                    <Calendar className="w-3 h-3" />
                    {formatDate(contract.created_at)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {contract.expires_at ? (
                    <div className="flex items-center gap-1 text-sm text-zinc-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(contract.expires_at)}
                    </div>
                  ) : (
                    <span className="text-sm text-zinc-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handlePreview(contract)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(contract)}>
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 