'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Contract } from '@/types/contract';
import { Combobox } from '@/components/ui/combobox';
import { KKTU_CODES } from '@/data/kktu-codes';
import { FileText } from 'lucide-react';

interface MarkingFormData {
  requires_marking: boolean;
  contract_id: string | null;
  kktu: string;
  product_description: string;
  erid: string;
}

interface MarkingFormProps {
  data: MarkingFormData;
  errors: Record<string, string>;
  contracts: Contract[];
  onChange: (field: keyof MarkingFormData, value: any) => void;
}

export function MarkingForm({ data, errors, contracts, onChange }: MarkingFormProps) {
  const handleGenerateErid = () => {
    if (!canGenerate) return;
    // TODO: replace with real API call to ORD service
    const generated = `ERID-${Math.floor(Math.random() * 1_000_000_000)}`;
    onChange('erid', generated);
  };

  const canGenerate =
    !!data.contract_id && data.kktu.trim().length > 0 && data.product_description.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Marking Toggle */}
      <div className="flex items-center space-x-3">
        <Checkbox
          id="requires_marking"
          checked={data.requires_marking}
          onCheckedChange={(checked) => onChange('requires_marking', checked)}
        />
        <Label htmlFor="requires_marking" className="cursor-pointer select-none">
          Требуется маркировка
        </Label>
      </div>

      {data.requires_marking && (
        <div className="space-y-6">
          {/* Contract Selection */}
          <div className="space-y-2">
            <Label htmlFor="contract_id">Договор *</Label>
            <Select
              value={data.contract_id ?? 'none'}
              onValueChange={(value) => onChange('contract_id', value === 'none' ? null : value)}
            >
              <SelectTrigger className={`bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${errors.contract_id ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Выберите договор" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без договора</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-xs text-zinc-500">{contract.advertiser_name}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contract_id && <p className="text-sm text-red-600">{errors.contract_id}</p>}
          </div>

          {/* KKTU */}
          <div className="space-y-2">
            <Label htmlFor="kktu">ККТУ *</Label>
            <Combobox
              value={data.kktu}
              onValueChange={(val) => onChange('kktu', val)}
              options={KKTU_CODES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
              placeholder="Начните вводить код или название..."
            />
            {errors.kktu && <p className="text-sm text-red-600">{errors.kktu}</p>}
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="product_description">Описание товара/услуги *</Label>
            <textarea
              id="product_description"
              rows={3}
              placeholder="Краткое описание рекламируемого товара или услуги"
              value={data.product_description}
              onChange={(e) => onChange('product_description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md resize-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.product_description ? 'border-red-500' : ''}`}
            />
            {errors.product_description && <p className="text-sm text-red-600">{errors.product_description}</p>}
          </div>

          {/* ERID Generation */}
          <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Label htmlFor="erid">ERID токен</Label>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Input
                  id="erid"
                  type="text"
                  readOnly
                  placeholder="Нажмите кнопку, чтобы получить ERID"
                  value={data.erid}
                  className="pr-20 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                />
                {data.erid && (
                  <div className="absolute inset-y-0 right-2 flex items-center space-x-2">
                    {/* Copy icon */}
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(data.erid)}
                      className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    {/* Clear icon */}
                    <button
                      type="button"
                      onClick={() => onChange('erid', '')}
                      className="text-zinc-500 hover:text-red-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleGenerateErid}
                disabled={!canGenerate}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  canGenerate
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Получить ERID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 