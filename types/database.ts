// Этот файл должен быть сгенерирован автоматически с помощью Supabase CLI.
// Выполните в терминале следующую команду, чтобы сгенерировать актуальные типы из вашей схемы БД:
// npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
//
// Замените <your-project-ref> на реальный ID вашего проекта в Supabase.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Пока типы не сгенерированы, можно использовать этот базовый тип.
// После генерации этот файл будет перезаписан.
export interface Database {
  public: {
    Tables: {
      // Здесь будут перечислены все ваши таблицы
    }
    Views: {
      // Здесь будут перечислены все ваши представления (views)
    }
    Functions: {
      // Здесь будут перечислены все ваши функции
    }
  }
} 