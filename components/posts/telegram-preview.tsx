'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Channel } from '@/types/channel';
import { 
  MessageCircle,
  Share,
  Eye
} from 'lucide-react';
import { telegramMarkdownToHtml } from '@/utils/telegram-markdown';

interface TelegramPreviewProps {
  content: string;
  images?: string[];
  targetUrl?: string | null;
  channelId?: string;
  channels?: Channel[];
  advertiserName?: string;
}

export function TelegramPreview({ 
  content, 
  images = [], 
  targetUrl, 
  channelId, 
  channels = [], 
  advertiserName 
}: TelegramPreviewProps) {
  const selectedChannel = channels.find(c => c.id === channelId);
  
  // Format content for Telegram-like display
  const formatContent = (text: string) => {
    if (!text.trim()) return 'Введите текст размещения...';
    
    // Add ERID if advertiser name is provided
    let formattedText = text;
    if (advertiserName && !text.includes('ERID:')) {
      formattedText += `\n\n#реклама ERID: 2VtzqvQqLNh`;
    }
    
    return formattedText;
  };

  const displayContentHtml = telegramMarkdownToHtml(formatContent(content));
  const hasMedia = images.length > 0;
  const hasUrl = targetUrl && targetUrl.trim();

  return (
    <div className="space-y-4">
      {/* Channel Info */}
      {selectedChannel ? (
        <div className="flex items-center space-x-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              {selectedChannel.channel_title.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">
              {selectedChannel.channel_title}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{selectedChannel.channel_username || 'channel'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3 pb-3 border-b border-zinc-200 dark:border-zinc-700">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
              ?
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-zinc-500 dark:text-zinc-400">
              Выберите канал
            </p>
          </div>
        </div>
      )}

      {/* Message Preview */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Media Preview */}
        {hasMedia && (
          <div className="relative">
            {images.length === 1 ? (
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={images[0]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {images.slice(0, 4).map((image, index) => (
                  <div key={index} className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          +{images.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div
            className="text-zinc-900 dark:text-white text-sm leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: displayContentHtml }}
          />
        </div>

        {/* Telegram Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-zinc-500">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">12</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-zinc-500">
                <Share className="w-4 h-4 mr-1" />
                <span className="text-xs">5</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto text-zinc-500">
                <Eye className="w-4 h-4 mr-1" />
                <span className="text-xs">1.2K</span>
              </Button>
            </div>
            <div className="text-xs text-zinc-400">
              {new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Stats */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <div className="flex justify-between">
          <span>Символов:</span>
          <span className={content.length > 4096 ? 'text-red-500' : ''}>
            {content.length}/4096
          </span>
        </div>
        <div className="flex justify-between">
          <span>Изображений:</span>
          <span>{images.length}/10</span>
        </div>
        {advertiserName && (
          <div className="flex justify-between">
            <span>ERID:</span>
            <span className="text-emerald-500">Добавлен</span>
          </div>
        )}
      </div>
    </div>
  );
} 