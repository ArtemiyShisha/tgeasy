'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Channel } from '@/types/channel';
import { RubleIcon } from '@/components/ui/ruble-icon';
import { isChannelOperational } from '@/components/channels/bot-status-badge';

interface BasicInfoFormData {
  channel_id: string;
  title: string;
}

interface BasicInfoFormProps {
  data: BasicInfoFormData;
  errors: Record<string, string>;
  channels: Channel[];
  onChange: (field: keyof BasicInfoFormData, value: any) => void;
}

export function BasicInfoForm({ data, errors, channels, onChange }: BasicInfoFormProps) {
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
            {channels.filter((c) => isChannelOperational(c.bot_status)).map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {channel.channel_title.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{channel.channel_title}</p>
                    {channel.channel_username && <p className="text-xs text-zinc-500">@{channel.channel_username}</p>}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.channel_id && <p className="text-sm text-red-600">{errors.channel_id}</p>}
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
        {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Стоимость убрана отсюда, перенесена в отдельный блок */}
    </div>
  );
} 