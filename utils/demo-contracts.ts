import { Contract } from '@/types/contract';

const DEMO_CONTRACTS_KEY = 'tgeasy_demo_contracts';

// Базовые демо-договоры
const BASE_DEMO_CONTRACTS: Contract[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    title: 'Договор с ООО "Рекламное агентство"',
    advertiser_name: 'ООО "Рекламное агентство"',
    advertiser_inn: '7707083893',
    contract_type: 'agency',
    advertiser_legal_address: '123456, г. Москва, ул. Тверская, д. 10',
    advertiser_contact_person: 'Иванов Иван Иванович',
    advertiser_phone: '+7 (495) 123-45-67',
    advertiser_email: 'ivanov@adagency.com',
    contract_number: 'РА-2024-001',
    contract_date: '2024-01-15',
    status: 'active',
    file_url: undefined,
    file_name: undefined,
    file_size: undefined,
    mime_type: undefined,
    page_count: undefined,
    extracted_text: 'Демонстрационный договор для тестирования функционала',
    thumbnail_url: undefined,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    posts_count: 0
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    title: 'Договор с ИП Петров А.В.',
    advertiser_name: 'ИП Петров Александр Владимирович',
    advertiser_inn: '773301001',
    contract_type: 'direct',
    advertiser_legal_address: '654321, г. Санкт-Петербург, пр. Невский, д. 25',
    advertiser_contact_person: 'Петров Александр Владимирович',
    advertiser_phone: '+7 (812) 987-65-43',
    advertiser_email: 'petrov@example.com',
    contract_number: 'ПР-2024-002',
    contract_date: '2024-02-01',
    status: 'expiring',
    file_url: undefined,
    file_name: undefined,
    file_size: undefined,
    mime_type: undefined,
    page_count: undefined,
    extracted_text: 'Демонстрационный договор истекает в ближайшее время',
    thumbnail_url: undefined,
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    posts_count: 0
  },
  {
    id: 'demo-3',
    user_id: 'demo-user',
    title: 'Договор с ООО "Строительная компания"',
    advertiser_name: 'ООО "Строительная компания"',
    advertiser_inn: '7728168971',
    contract_type: 'self_advertising',
    advertiser_legal_address: '111222, г. Екатеринбург, ул. Ленина, д. 50',
    advertiser_contact_person: 'Сидоров Петр Иванович',
    advertiser_phone: '+7 (343) 555-12-34',
    advertiser_email: 'sidorov@stroyka.com',
    contract_number: 'СР-2023-099',
    contract_date: '2023-11-01',
    status: 'expired',
    file_url: undefined,
    file_name: undefined,
    file_size: undefined,
    mime_type: undefined,
    page_count: undefined,
    extracted_text: 'Демонстрационный истекший договор',
    thumbnail_url: undefined,
    expires_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    posts_count: 0
  }
];

export function getDemoContracts(): Contract[] {
  if (typeof window === 'undefined') {
    return BASE_DEMO_CONTRACTS;
  }

  try {
    const stored = localStorage.getItem(DEMO_CONTRACTS_KEY);
    if (stored) {
      const parsedContracts = JSON.parse(stored);
      // Объединяем базовые и созданные пользователем договоры
      const userContracts = parsedContracts.filter((c: Contract) => !c.id.startsWith('demo-'));
      return [...userContracts, ...BASE_DEMO_CONTRACTS];
    }
  } catch (error) {
    console.warn('Failed to load demo contracts from localStorage:', error);
  }

  return BASE_DEMO_CONTRACTS;
}

export function addDemoContract(contract: Contract): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existingContracts = getDemoContracts();
    const userContracts = existingContracts.filter(c => !c.id.startsWith('demo-'));
    const updatedUserContracts = [contract, ...userContracts];
    localStorage.setItem(DEMO_CONTRACTS_KEY, JSON.stringify(updatedUserContracts));
  } catch (error) {
    console.warn('Failed to save demo contract to localStorage:', error);
  }
}

export function updateDemoContract(id: string, updates: Partial<Contract>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existingContracts = getDemoContracts();
    const updatedContracts = existingContracts.map(contract => 
      contract.id === id ? { ...contract, ...updates } : contract
    );
    
    const userContracts = updatedContracts.filter(c => !c.id.startsWith('demo-'));
    localStorage.setItem(DEMO_CONTRACTS_KEY, JSON.stringify(userContracts));
  } catch (error) {
    console.warn('Failed to update demo contract in localStorage:', error);
  }
}

export function deleteDemoContract(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existingContracts = getDemoContracts();
    const filteredContracts = existingContracts.filter(contract => contract.id !== id);
    
    const userContracts = filteredContracts.filter(c => !c.id.startsWith('demo-'));
    localStorage.setItem(DEMO_CONTRACTS_KEY, JSON.stringify(userContracts));
  } catch (error) {
    console.warn('Failed to delete demo contract from localStorage:', error);
  }
} 