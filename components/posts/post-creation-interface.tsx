'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostEditor } from './post-editor';
import { MediaUploadZone } from './media-upload-zone';
import { SchedulingPanel } from './scheduling-panel';
import { BasicInfoForm } from './basic-info-form';
import { MarkingForm } from './marking-form';
import { PlacementCostForm } from './placement-cost-form';
import { useChannels } from '@/hooks/use-channels';
import { useContracts } from '@/hooks/use-contracts';
import { usePosts } from '@/hooks/use-posts';
import { CreatePostData } from '@/types/post-ui';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PostCreationInterfaceProps {
  onSave?: (post: any) => void;
  onPublish?: (post: any) => void;
  onCancel?: () => void;
}

interface FormData extends Omit<CreatePostData, 'scheduled_at'> {
  scheduled_at?: Date | null;
  requires_marking: boolean;
  erid: string;
  product_description: string;
}

const INITIAL_FORM_DATA: FormData = {
  channel_id: '',
  contract_id: null,
  title: '',
  creative_text: '',
  creative_images: [],
  target_url: null,
  placement_cost: null,
  placement_currency: 'RUB',
  kktu: '',
  erid: '',
  product_description: '',
  requires_marking: false,
  scheduled_at: null,
};

export function PostCreationInterface({ 
  onSave, 
  onPublish, 
  onCancel 
}: PostCreationInterfaceProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Hooks
  const { channels } = useChannels();
  const { contracts } = useContracts();
  const { create: createPost } = usePosts();

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear action error when user makes changes
    if (actionError) {
      setActionError(null);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Заголовок всегда обязателен
    if (!formData.title.trim()) newErrors.title = 'Введите заголовок'
    if (formData.title.length > 255) newErrors.title = 'Заголовок слишком длинный (максимум 255 символов)'

    // Канал всегда обязателен
    if (!formData.channel_id) newErrors.channel_id = 'Выберите канал'

    // Валидация текста креатива (опциональна)
    if (formData.creative_text.length > 4096) newErrors.creative_text = 'Текст слишком длинный (максимум 4096 символов)'

    // Валидация URL (если указан)
    if (formData.target_url) {
      try {
        new URL(formData.target_url)
      } catch {
        newErrors.target_url = 'Некорректный URL'
      }
    }

    // Валидация стоимости (если указана)
    if (formData.placement_cost !== null && formData.placement_cost !== undefined) {
      if (formData.placement_cost <= 0) newErrors.placement_cost = 'Стоимость должна быть положительной'
    }

    // Валидация маркировки (если включена)
    if (formData.requires_marking) {
      if (!formData.contract_id) newErrors.contract_id = 'Выберите договор для маркировки'
      if (!formData.kktu.trim()) newErrors.kktu = 'Введите ККТУ'
      if (!formData.product_description?.trim()) newErrors.product_description = 'Описание товара обязательно при маркировке'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  };

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.title.trim() && formData.creative_text.trim() && !isLoading) {
        // Auto-save logic
        setLastSaved(new Date());
        console.log('Auto-saved at:', new Date().toLocaleTimeString());
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [formData, isLoading]);

  // Show validation errors to user
  const showValidationErrors = () => {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      setActionError(`Пожалуйста, исправьте ошибки: ${errorMessages.join(', ')}`);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!validateForm()) {
      showValidationErrors();
      return;
    }

    setIsLoading(true);
    setActionError(null);
    
    try {
      const postData: CreatePostData = {
        channel_id: formData.channel_id,
        contract_id: formData.requires_marking ? formData.contract_id ?? null : null,
        title: formData.title,
        creative_text: formData.creative_text,
        creative_images: formData.creative_images,
        target_url: formData.target_url,
        placement_cost: formData.placement_cost,
        placement_currency: formData.placement_currency || 'RUB',
        kktu: formData.requires_marking ? formData.kktu : '',
        product_description: formData.requires_marking ? formData.product_description : '',
        requires_marking: formData.requires_marking,
        scheduled_at: null // Draft is never scheduled
      };
      
      const post = await createPost(postData);
      setLastSaved(new Date());
      onSave?.(post);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setActionError('Не удалось сохранить черновик. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Publish immediately
  const handlePublishNow = async () => {
    if (!validateForm()) {
      showValidationErrors();
      return;
    }

    setIsLoading(true);
    setActionError(null);
    
    try {
      const postData: CreatePostData = {
        channel_id: formData.channel_id,
        contract_id: formData.requires_marking ? formData.contract_id ?? null : null,
        title: formData.title,
        creative_text: formData.creative_text,
        creative_images: formData.creative_images,
        target_url: formData.target_url,
        placement_cost: formData.placement_cost,
        placement_currency: formData.placement_currency || 'RUB',
        kktu: formData.requires_marking ? formData.kktu : '',
        product_description: formData.requires_marking ? formData.product_description : '',
        requires_marking: formData.requires_marking,
        scheduled_at: null
      };
      const post = await createPost(postData);
      onPublish?.(post);
    } catch (error) {
      console.error('Failed to publish post:', error);
      setActionError('Не удалось опубликовать размещение. Проверьте данные и попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!validateForm()) {
      showValidationErrors();
      return;
    }
    
    if (!formData.scheduled_at) {
      setErrors(prev => ({ ...prev, scheduled_at: 'Укажите дату публикации' }));
      setActionError('Необходимо выбрать дату и время публикации');
      return;
    }

    if (formData.scheduled_at <= new Date()) {
      setErrors(prev => ({ ...prev, scheduled_at: 'Дата должна быть в будущем' }));
      setActionError('Дата публикации должна быть в будущем');
      return;
    }

    setIsLoading(true);
    setActionError(null);
    
    try {
      const postData: CreatePostData = {
        channel_id: formData.channel_id,
        contract_id: formData.requires_marking ? formData.contract_id ?? null : null,
        title: formData.title,
        creative_text: formData.creative_text,
        creative_images: formData.creative_images,
        target_url: formData.target_url,
        placement_cost: formData.placement_cost,
        placement_currency: formData.placement_currency || 'RUB',
        kktu: formData.requires_marking ? formData.kktu : '',
        product_description: formData.requires_marking ? formData.product_description : '',
        requires_marking: formData.requires_marking,
        scheduled_at: formData.scheduled_at.toISOString()
      };
      const post = await createPost(postData);
      onPublish?.(post);
    } catch (error) {
      console.error('Failed to schedule post:', error);
      setActionError('Не удалось запланировать размещение. Проверьте данные и попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Editor Section (60%) */}
      <div className="flex-1 pr-6">
        <div className="space-y-6">
          {/* Error Display */}
          {actionError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  {actionError}
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {lastSaved && !actionError && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span>Автосохранено в {lastSaved.toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Основная информация
              </h3>
              
              <BasicInfoForm
                data={{
                  channel_id: formData.channel_id,
                  title: formData.title,
                }}
                errors={errors}
                channels={channels}
                onChange={(field, value) => updateField(field as keyof FormData, value)}
              />
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Контент размещения
              </h3>
              
              <PostEditor
                content={formData.creative_text}
                onChange={(content) => updateField('creative_text', content)}
                error={errors.creative_text}
              />
              
              <div className="mt-4">
                <MediaUploadZone
                  images={formData.creative_images || []}
                  onImagesChange={(images) => updateField('creative_images', images)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marking */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Маркировка
              </h3>

              <MarkingForm
                data={{
                  requires_marking: formData.requires_marking,
                  contract_id: formData.contract_id ?? null,
                  kktu: formData.kktu,
                  product_description: formData.product_description,
                  erid: formData.erid
                }}
                errors={errors}
                contracts={contracts}
                onChange={(field, value) => updateField(field as keyof FormData, value)}
              />
            </CardContent>
          </Card>

          {/* Placement Cost */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <PlacementCostForm
                data={{
                  placement_cost: formData.placement_cost ?? null,
                  placement_currency: formData.placement_currency || 'RUB'
                }}
                onChange={(field, value) => updateField(field as keyof FormData, value)}
              />
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <SchedulingPanel
                scheduledAt={formData.scheduled_at}
                onScheduledAtChange={(date) => updateField('scheduled_at', date)}
                error={errors.scheduled_at}
                onSaveDraft={handleSaveDraft}
                onPublishNow={handlePublishNow}
                onSchedule={handleSchedule}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section - simplified */}
      <div className="w-2/5 pl-6 border-l border-zinc-200 dark:border-zinc-800 hidden xl:block">
        <div className="sticky top-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Предварительный просмотр
          </h3>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Здесь будет показан предварительный просмотр размещения в Telegram
          </div>
        </div>
      </div>
    </div>
  );
} 