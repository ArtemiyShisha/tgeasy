'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { BotStatus } from '@/types/channel';
import { getChannelStatusDescription, getChannelSetupInstructions } from './bot-status-badge';
import { useState } from 'react';

interface BotSetupDialogProps {
  open: boolean;
  onClose: () => void;
  channelName: string;
  channelUsername?: string;
  botStatus: BotStatus | null | undefined;
  onCheckStatus: () => void;
  isChecking?: boolean;
}

export function BotSetupDialog({
  open,
  onClose,
  channelName,
  channelUsername,
  botStatus,
  onCheckStatus,
  isChecking = false
}: BotSetupDialogProps) {
  const [copied, setCopied] = useState(false);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '@tgeasy_oauth_bot';

  const copyBotUsername = async () => {
    try {
      await navigator.clipboard.writeText(botUsername);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy bot username:', err);
    }
  };

  const openTelegramChannel = () => {
    if (channelUsername) {
      window.open(`https://t.me/${channelUsername}`, '_blank');
    }
  };

  const instructions = getChannelSetupInstructions(botStatus);
  const description = getChannelStatusDescription(botStatus);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {botStatus === 'active' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            Настройка канала
          </DialogTitle>
          <DialogDescription>
            Канал: <strong>{channelName}</strong>
            {channelUsername && (
              <span className="text-muted-foreground"> (@{channelUsername})</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Статус канала</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {description}
                  </div>
                </div>
                <Badge className={
                  botStatus === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }>
                  {botStatus === 'active' ? 'Активен' : 
                   botStatus === 'pending_bot' ? 'Настройка' : 
                   botStatus === 'bot_missing' ? 'Отключен' : 'Не проверен'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Bot Username */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Имя бота</div>
                  <div className="text-lg font-mono mt-1">{botUsername}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBotUsername}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Скопировано!' : 'Копировать'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {instructions.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="font-medium mb-3">Инструкции по настройке</div>
                <ol className="space-y-2">
                  {instructions.map((instruction: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="text-sm">{instruction}</div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex gap-3">
            {channelUsername && (
              <Button
                variant="outline"
                onClick={openTelegramChannel}
                className="gap-2 flex-1"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть канал в Telegram
              </Button>
            )}
            <Button
              onClick={onCheckStatus}
              disabled={isChecking}
              className="gap-2 flex-1"
            >
              <CheckCircle className="w-4 h-4" />
              {isChecking ? 'Проверяем...' : 'Проверить статус'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>Важно:</strong> Бот @tgeasy_oauth_bot должен быть добавлен как администратор канала 
              с правами на публикацию сообщений, чтобы TGeasy мог размещать ваши рекламные посты.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 