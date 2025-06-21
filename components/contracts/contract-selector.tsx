'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, Search, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useContracts } from '@/hooks/use-contracts'
import type { Contract } from '@/types/contract'

interface ContractSelectorProps {
  selectedContractId?: string
  onContractSelect: (contract: Contract | null) => void
  placeholder?: string
  className?: string
}

export function ContractSelector({
  selectedContractId,
  onContractSelect,
  placeholder = 'Выберите договор',
  className = '',
}: ContractSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { contracts, loading } = useContracts()

  const selectedContract = contracts.find(c => c.id === selectedContractId)

  // Filter contracts based on search query
  const filteredContracts = contracts.filter(contract => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      contract.title.toLowerCase().includes(query) ||
      contract.advertiser_name.toLowerCase().includes(query) ||
      contract.advertiser_inn.includes(query)
    )
  })

  // Get recent contracts (last 5 active contracts)
  const recentContracts = contracts
    .filter(contract => contract.status === 'active')
    .slice(0, 5)

  const handleContractSelect = (contract: Contract) => {
    onContractSelect(contract)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    onContractSelect(null)
    setIsOpen(false)
  }

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

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {selectedContract ? (
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="truncate">{selectedContract.title}</span>
                {getStatusBadge(selectedContract.status)}
              </div>
            ) : (
              <span className="text-zinc-500">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b border-zinc-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                placeholder="Поиск договоров..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 focus:ring-0 focus:border-0"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-zinc-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Загрузка...
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">
                {searchQuery ? 'Договоры не найдены' : 'Нет доступных договоров'}
              </div>
            ) : (
              <div className="py-2">
                {/* Show recent contracts if no search query */}
                {!searchQuery && recentContracts.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                      Недавние
                    </div>
                    {recentContracts.map((contract) => (
                      <button
                        key={contract.id}
                        onClick={() => handleContractSelect(contract)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 rounded-md transition-colors"
                      >
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-zinc-900 truncate">
                            {contract.title}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {contract.advertiser_name}
                          </div>
                        </div>
                        {getStatusBadge(contract.status)}
                        {selectedContractId === contract.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                    <div className="border-t border-zinc-100 my-2"></div>
                  </div>
                )}

                {/* All contracts */}
                <div className="px-3 py-2">
                  {!searchQuery && (
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                      Все договоры
                    </div>
                  )}
                  {filteredContracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => handleContractSelect(contract)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-900 truncate">
                          {contract.title}
                        </div>
                        <div className="text-xs text-zinc-500 truncate flex items-center gap-2">
                          <span>{contract.advertiser_name}</span>
                          <span>•</span>
                          <span>{contract.advertiser_inn}</span>
                          {contract.expires_at && (
                            <>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(contract.expires_at).toLocaleDateString('ru-RU')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(contract.status)}
                      {selectedContractId === contract.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear selection */}
          {selectedContract && (
            <div className="p-3 border-t border-zinc-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="w-full text-zinc-600 hover:text-zinc-900"
              >
                Очистить выбор
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
} 