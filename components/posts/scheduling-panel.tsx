'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, CalendarDays, Info } from 'lucide-react';

interface SchedulingPanelProps {
  scheduledAt?: Date | null;
  onScheduledAtChange: (date: Date | null) => void;
  error?: string;
  onSaveDraft: () => void;
  onPublishNow: () => void;
  onSchedule: () => void;
  isLoading?: boolean;
}

// Utility function to convert Date to local datetime-local string
function toLocalInputString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SchedulingPanel({
  scheduledAt,
  onScheduledAtChange,
  error,
  onSaveDraft,
  onPublishNow,
  onSchedule,
  isLoading = false,
}: SchedulingPanelProps) {
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [dateInput, setDateInput] = useState(() => {
    if (scheduledAt) {
      return toLocalInputString(scheduledAt);
    }
    return '';
  });

  const handlePublishModeChange = (mode: 'immediate' | 'scheduled') => {
    setPublishMode(mode);
    
    if (mode === 'scheduled' && !scheduledAt) {
      // Set default time to +1 hour when switching to scheduled mode
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
      onScheduledAtChange(defaultDate);
      setDateInput(toLocalInputString(defaultDate));
    } else if (mode === 'immediate') {
      // Clear scheduled time when switching to immediate
      onScheduledAtChange(null);
      setDateInput('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateInput(value);
    
    if (value) {
      const date = new Date(value);
      // Validate that the date is in the future
      if (date > new Date()) {
        onScheduledAtChange(date);
      }
    } else {
      onScheduledAtChange(null);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    return toLocalInputString(now);
  };

  const getSuggestedTimes = () => {
    const now = new Date();
    const suggestions = [];
    
    // Next hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    suggestions.push({ 
      label: 'Через час', 
      date: nextHour 
    });
    
    // Tomorrow at 9 AM
    const tomorrow9 = new Date(now);
    tomorrow9.setDate(tomorrow9.getDate() + 1);
    tomorrow9.setHours(9, 0, 0, 0);
    suggestions.push({ 
      label: 'Завтра в 9:00', 
      date: tomorrow9 
    });
    
    // Tomorrow at 18 PM
    const tomorrow18 = new Date(now);
    tomorrow18.setDate(tomorrow18.getDate() + 1);
    tomorrow18.setHours(18, 0, 0, 0);
    suggestions.push({ 
      label: 'Завтра в 18:00', 
      date: tomorrow18 
    });
    
    return suggestions;
  };

  const handleSuggestedTimeClick = (date: Date) => {
    onScheduledAtChange(date);
    setDateInput(toLocalInputString(date));
  };

  const isScheduleReady = publishMode === 'scheduled' && scheduledAt && scheduledAt > new Date();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Планирование публикации
      </h3>
      
      {/* Publication Mode Selection */}
      <div className="space-y-3">
        <Label>Когда опубликовать?</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            variant={publishMode === 'immediate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePublishModeChange('immediate')}
            className="flex-1"
            disabled={isLoading}
          >
            Сейчас
          </Button>
          <Button
            type="button"
            variant={publishMode === 'scheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePublishModeChange('scheduled')}
            className="flex-1"
            disabled={isLoading}
          >
            Запланировать
          </Button>
        </div>
      </div>

      {/* Scheduling Interface - only show when scheduled mode is active */}
      {publishMode === 'scheduled' && (
        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          {/* Info message */}
          <div className="flex items-start space-x-2 text-sm text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Размещение будет опубликовано автоматически в указанное время</span>
          </div>

          {/* Date & Time Input */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Дата и время публикации *</Label>
            <div className="relative">
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={dateInput}
                onChange={handleDateChange}
                min={getMinDateTime()}
                className={`
                  bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800
                  ${error ? 'border-red-500' : ''}
                `}
              />
              <CalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <Label>Быстрый выбор:</Label>
            <div className="flex flex-wrap gap-2">
              {getSuggestedTimes().map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestedTimeClick(suggestion.date)}
                  className="text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                  disabled={isLoading}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Scheduled Time Display */}
          {scheduledAt && (
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  Запланировано на {scheduledAt.toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} в {scheduledAt.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Time Zone Info */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="w-3 h-3 inline mr-1" />
            Время указывается по вашему часовому поясу ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={isLoading}
          className="flex-1 border-zinc-200 dark:border-zinc-700"
        >
          {isLoading ? 'Сохраняем...' : 'Сохранить черновик'}
        </Button>

        {publishMode === 'immediate' ? (
          <Button
            type="button"
            onClick={onPublishNow}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? 'Отправляем...' : 'Опубликовать сейчас'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSchedule}
            disabled={isLoading || !isScheduleReady}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Планируем...' : 'Подтвердить планирование'}
          </Button>
        )}
      </div>
    </div>
  );
} 