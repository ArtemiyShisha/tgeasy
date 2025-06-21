'use client'

import { useState, useCallback } from 'react'
import { Search, Plus, Grid3X3, List, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ContractTable } from './contract-table'
import { ContractCard } from './contract-card'
import { ContractUploadModal } from './contract-upload-modal'
import { useContracts } from '@/hooks/use-contracts'
import type { Contract, ContractStatus } from '@/types/contract'

type ViewMode = 'table' | 'cards'
type FilterType = 'all' | 'active' | 'expiring' | 'expired'

export function ContractsManagementInterface() {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])

  const { contracts, stats, loading, error, refetch } = useContracts()

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter)
  }, [])

  const handleContractSelect = useCallback((contractId: string, selected: boolean) => {
    setSelectedContracts(prev => 
      selected 
        ? [...prev, contractId]
        : prev.filter(id => id !== contractId)
    )
  }, [])

  const handleBulkAction = useCallback((action: string) => {
    // TODO: Implement bulk actions
    console.log('Bulk action:', action, selectedContracts)
  }, [selectedContracts])

  // Filter contracts based on search and filter
  const filteredContracts = contracts.filter((contract: Contract) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        contract.title.toLowerCase().includes(query) ||
        contract.advertiser_name.toLowerCase().includes(query) ||
        contract.advertiser_inn.includes(query)
      if (!matchesSearch) return false
    }

    // Status filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'active':
          return contract.status === 'active'
        case 'expiring':
          return contract.status === 'expiring'
        case 'expired':
          return contract.status === 'expired'
        default:
          return true
      }
    }

    return true
  })

  const getFilterCounts = () => {
    return {
      all: contracts.length,
      active: contracts.filter((c: Contract) => c.status === 'active').length,
      expiring: contracts.filter((c: Contract) => c.status === 'expiring').length,
      expired: contracts.filter((c: Contract) => c.status === 'expired').length,
    }
  }

  const filterCounts = getFilterCounts()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-zinc-600 mb-4">Произошла ошибка при загрузке договоров</p>
          <Button onClick={refetch} variant="outline">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Договоры</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {contracts.length} {contracts.length === 1 ? 'договор' : 'договоров'}
          </p>
        </div>
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Загрузить договор
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input
            placeholder="Поиск по названию, рекламодателю или ИНН..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 border-zinc-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="px-3"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Все', count: filterCounts.all },
          { key: 'active', label: 'Активные', count: filterCounts.active },
          { key: 'expiring', label: 'Истекающие', count: filterCounts.expiring },
          { key: 'expired', label: 'Истекшие', count: filterCounts.expired },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key as FilterType)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeFilter === key
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent'
            }`}
          >
            {label}
            <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-600">
              {count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedContracts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              Выбрано {selectedContracts.length} {selectedContracts.length === 1 ? 'договор' : 'договоров'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
                className="text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                Экспорт
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContracts([])}
                className="text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              >
                Отменить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-zinc-600">Загрузка договоров...</p>
            </div>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-zinc-600 mb-4">
                {searchQuery || activeFilter !== 'all' 
                  ? 'Договоры не найдены' 
                  : 'У вас пока нет договоров'
                }
              </p>
              {!searchQuery && activeFilter === 'all' && (
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  variant="outline"
                >
                  Загрузить первый договор
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <ContractTable
            contracts={filteredContracts}
            selectedContracts={selectedContracts}
            onContractSelect={handleContractSelect}
            onRefresh={refetch}
          />
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  isSelected={selectedContracts.includes(contract.id)}
                  onSelect={(selected: boolean) => handleContractSelect(contract.id, selected)}
                  onRefresh={refetch}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ContractUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          refetch()
          setIsUploadModalOpen(false)
        }}
      />
    </div>
  )
} 