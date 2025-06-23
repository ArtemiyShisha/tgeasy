'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Channel } from '@/types/channel';
import { Contract } from '@/types/contract';
import { 
  FileText
} from 'lucide-react';
import { isChannelOperational } from '@/components/channels/bot-status-badge';
import { RubleIcon } from '@/components/ui/ruble-icon';
import { Combobox } from '@/components/ui/combobox';
import { KKTU_CODES } from '@/data/kktu-codes';

interface AdvertiserInfoFormData {
  channel_id: string;
  contract_id: string | null;
  title: string;
  kktu: string;
  product_description: string;
  placement_cost: number | null;
  placement_currency: string;
}

interface AdvertiserInfoFormProps {
  data: AdvertiserInfoFormData;
  errors: Record<string, string>;
  channels: Channel[];
  contracts: Contract[];
  onChange: (field: keyof AdvertiserInfoFormData, value: any) => void;
}

export function AdvertiserInfoForm({ 
  data, 
  errors, 
  channels, 
  contracts, 
  onChange 
}: AdvertiserInfoFormProps) {
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value ? parseFloat(value) : null;
    onChange('placement_cost', numValue);
  };

  return (
    <div className="space-y-6">
      {/* Channel Selection */}
      <div className="space-y-2">
        <Label htmlFor="channel_id">Канал для размещения *</Label>
        <Select
          value={data.channel_id || 'none'}
          onValueChange={(value) => onChange('channel_id', value === 'none' ? '' : value)}
        >
          <SelectTrigger className={`bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${errors.channel_id ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Выберите канал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Сбросить выбор</SelectItem>
            {channels.filter(c => isChannelOperational(c.bot_status)).map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {channel.channel_title.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{channel.channel_title}</p>
                    {channel.channel_username && (
                      <p className="text-xs text-zinc-500">@{channel.channel_username}</p>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.channel_id && (
          <p className="text-sm text-red-600">{errors.channel_id}</p>
        )}
      </div>

      {/* Contract Selection (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="contract_id">Договор (опционально)</Label>
        <Select
          value={data.contract_id ?? 'none'}
          onValueChange={(value) => onChange('contract_id', value === 'none' ? null : value)}
        >
          <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <SelectValue placeholder="Выберите договор или оставьте пустым" />
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
      </div>

      {/* Post Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Название размещения *</Label>
        <Input
          id="title"
          type="text"
          placeholder="Краткое название размещения"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          className={`bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${errors.title ? 'border-red-500' : ''}`}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* KKTU */}
      <div className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Label htmlFor="kktu">ККТУ (код категории товаров/услуг) *</Label>
        <Combobox
          value={data.kktu}
          onValueChange={(val) => onChange('kktu', val)}
          options={KKTU_CODES.map(c => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
          placeholder="Начните вводить код или название..."
        />
        {errors.kktu && (
          <p className="text-sm text-red-600">{errors.kktu}</p>
        )}
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
          className={`
            w-full px-3 py-2 border rounded-md resize-none
            bg-white dark:bg-zinc-900
            border-zinc-200 dark:border-zinc-800
            text-zinc-900 dark:text-white
            placeholder-zinc-400 dark:placeholder-zinc-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${errors.product_description ? 'border-red-500' : ''}
          `}
        />
        {errors.product_description && (
          <p className="text-sm text-red-600">{errors.product_description}</p>
        )}
      </div>

      {/* Placement Cost (Optional) */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
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
              value={data.placement_cost || ''}
              onChange={handleCostChange}
              className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="placement_currency">Валюта</Label>
            <Select
              value={data.placement_currency}
              onValueChange={(value) => onChange('placement_currency', value)}
            >
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
    </div>
  );
} 