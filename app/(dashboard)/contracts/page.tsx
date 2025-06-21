import { Metadata } from 'next'
import { ContractsManagementInterface } from '@/components/contracts/contracts-management-interface'

export const metadata: Metadata = {
  title: 'Договоры | TGeasy',
  description: 'Управление договорами с рекламодателями',
}

export default function ContractsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <ContractsManagementInterface />
    </div>
  )
} 