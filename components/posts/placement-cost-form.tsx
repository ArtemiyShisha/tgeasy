'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RubleIcon } from '@/components/ui/ruble-icon';

interface PlacementCostFormData {
  placement_cost: number | null;
  placement_currency: string;
}

interface PlacementCostFormProps {
  data: PlacementCostFormData;
  onChange: (field: keyof PlacementCostFormData, value: any) => void;
}

export function PlacementCostForm({ data, onChange }: PlacementCostFormProps) {
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value ? parseFloat(value) : null;
    onChange('placement_cost', numValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <RubleIcon className="w-5 h-5 text-zinc-500" />
        <h4 className="font-medium text-zinc-900 dark:text-white">Стоимость размещения</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Cost */}
        <div className="space-y-2">
          <Label htmlFor="placement_cost">Стоимость</Label>
          <Input
            id="placement_cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={data.placement_cost ?? ''}
            onChange={handleCostChange}
            className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="placement_currency">Валюта</Label>
          <Select value={data.placement_currency} onValueChange={(value) => onChange('placement_currency', value)}>
            <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RUB">₽ Рубли</SelectItem>
              <SelectItem value="USD">$ Доллары</SelectItem>
              <SelectItem value="EUR">€ Евро</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 