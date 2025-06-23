'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Image,
  Upload,
  X,
  FileImage,
  Loader2
} from 'lucide-react';

interface MediaUploadZoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function MediaUploadZone({ 
  images, 
  onImagesChange, 
  maxFiles = 10,
  maxSize = 20 
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= maxSize * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      alert('Пожалуйста, выберите изображения размером до ' + maxSize + 'MB');
      return;
    }

    if (images.length + validFiles.length > maxFiles) {
      alert(`Максимальное количество файлов: ${maxFiles}`);
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate file upload - in real app this would upload to storage
      const newImageUrls = await Promise.all(
        validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );
      
      onImagesChange([...images, ...newImageUrls]);
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Ошибка при загрузке файлов');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
          }
        `}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Загрузка изображений...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Image className="w-12 h-12 text-zinc-400 mb-4" />
            <p className="text-zinc-600 dark:text-zinc-300 mb-2">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Поддерживаемые форматы: JPG, PNG, WebP (до {maxSize}MB)
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Максимум {maxFiles} файлов
            </p>
          </div>
        )}
      </div>

      {/* Selected Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Выбранные изображения ({images.length}/{maxFiles})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 