'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import { BotStatus } from '@/types/channel';

interface ChannelStatusBadgeProps {
  botStatus: BotStatus | null | undefined;
  lastCheckedAt?: string | null;
  className?: string;
}

/**
 * Отображает единый статус канала на основе статуса бота
 * Логика: статус канала = статус бота (готовность к работе)
 */
export function ChannelStatusBadge({ botStatus, lastCheckedAt, className }: ChannelStatusBadgeProps) {
  if (!botStatus) {
    return (
      <Badge variant="outline" className={className}>
        <Clock className="w-3 h-3 mr-1" />
        Не проверен
      </Badge>
    );
  }

  switch (botStatus) {
    case 'active':
      return (
        <Badge className={`bg-green-100 text-green-800 border-green-200 hover:bg-green-100 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Активен
        </Badge>
      );
    
    case 'pending_bot':
      return (
        <Badge className={`bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 ${className}`}>
          <Settings className="w-3 h-3 mr-1" />
          Настройка
        </Badge>
      );
    
    case 'bot_missing':
      return (
        <Badge className={`bg-red-100 text-red-800 border-red-200 hover:bg-red-100 ${className}`}>
          <AlertCircle className="w-3 h-3 mr-1" />
          Отключен
        </Badge>
      );
    
    default:
      return (
        <Badge variant="outline" className={className}>
          <AlertCircle className="w-3 h-3 mr-1" />
          Неизвестно
        </Badge>
      );
  }
}

/**
 * Возвращает описание статуса канала
 */
export function getChannelStatusDescription(botStatus: BotStatus | null | undefined): string {
  switch (botStatus) {
    case 'active':
      return 'Канал готов к работе. Бот подключен и имеет необходимые права для публикации.';
    
    case 'pending_bot':
      return 'Канал подключен к TGeasy, но требует настройки. Добавьте @tgeasy_oauth_bot в администраторы канала.';
    
    case 'bot_missing':
      return 'Канал недоступен для работы. Бот был удален или потерял права администратора.';
    
    default:
      return 'Статус канала не определен. Нажмите "Проверить статус" для диагностики.';
  }
}

/**
 * Возвращает инструкции по настройке канала
 */
export function getChannelSetupInstructions(botStatus: BotStatus | null | undefined): string[] {
  switch (botStatus) {
    case 'pending_bot':
    case 'bot_missing':
      return [
        '1. Перейдите в настройки вашего Telegram канала',
        '2. Выберите "Администраторы"',
        '3. Нажмите "Добавить администратора"',
        '4. Найдите и добавьте @tgeasy_oauth_bot',
        '5. Дайте боту права на публикацию сообщений',
        '6. Нажмите "Проверить статус" в TGeasy'
      ];
    
    case 'active':
      return ['Канал настроен правильно! Вы можете создавать и публиковать посты.'];
    
    default:
      return ['Нажмите "Проверить статус" для диагностики канала.'];
  }
}

/**
 * Определяет, доступен ли канал для работы (публикации постов)
 */
export function isChannelOperational(botStatus: BotStatus | null | undefined): boolean {
  return botStatus === 'active';
}

/**
 * Определяет, требует ли канал настройки
 */
export function isChannelNeedsSetup(botStatus: BotStatus | null | undefined): boolean {
  return botStatus === 'pending_bot' || botStatus === 'bot_missing';
}

// Backwards compatibility - экспортируем старые функции для плавного перехода
export const BotStatusBadge = ChannelStatusBadge;
export const getBotStatusDescription = getChannelStatusDescription;
export const getBotStatusInstructions = getChannelSetupInstructions; 