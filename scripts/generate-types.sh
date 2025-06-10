#!/bin/bash

# Скрипт для генерации TypeScript типов из удаленного Supabase проекта
# Использование: ./scripts/generate-types.sh

echo "🔧 Генерация TypeScript типов из Supabase..."

# Проверяем наличие PROJECT_ID
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "❌ Переменная SUPABASE_PROJECT_ID не установлена"
    echo "💡 Установите её одним из способов:"
    echo "   export SUPABASE_PROJECT_ID=your-project-id"
    echo "   или создайте .env.local файл"
    echo ""
    echo "🔍 Project ID можно найти в URL вашего Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/YOUR_PROJECT_ID"
    exit 1
fi

echo "📡 Проект ID: $SUPABASE_PROJECT_ID"

# Генерируем типы
echo "🚀 Генерация типов..."
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.ts

if [ $? -eq 0 ]; then
    echo "✅ Типы успешно сгенерированы в types/database.ts"
    echo "📄 Проверьте файл types/database.ts"
else
    echo "❌ Ошибка при генерации типов"
    echo "💡 Убедитесь что:"
    echo "   1. Supabase CLI установлен (npm install -g supabase)"
    echo "   2. Project ID корректный"
    echo "   3. У вас есть доступ к проекту"
    exit 1
fi 