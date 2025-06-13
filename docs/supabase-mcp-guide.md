# Supabase через MCP - Руководство для агентов

## 🔄 Важно: Serverless проект с MCP интеграцией

**TGeasy - это serverless проект!** Работает нативно (`npm run dev`) без Docker.
**В проекте НЕТ локального Supabase!** Все взаимодействие с базой данных происходит через **Supabase MCP интеграцию**.

## ✅ Что уже выполнено

### Задача 2: Схема базы данных ✅ ЗАВЕРШЕНО через MCP
- ✅ **Схема находится в**: `schemas/database.sql`
- ✅ **Таблицы созданы в удаленном Supabase** через MCP
- ✅ **RLS политики настроены** через MCP
- ✅ **НЕ ИЩИТЕ**: `supabase/migrations/` - их нет локально!

### Задача 3: Supabase клиент ✅ ЗАВЕРШЕНО через MCP  
- ✅ **Клиенты находятся в**: `lib/supabase/`
- ✅ **Подключение работает** через MCP Supabase
- ✅ **НЕ ИЩИТЕ**: локальную установку Supabase CLI

## 🛠️ Как работать с базой данных

### 1. Просмотр схемы
```bash
# Схема находится в файле:
schemas/database.sql
```

### 2. Просмотр таблиц
Используйте MCP функции:
```
mcp_supabase_list_tables
```

### 3. Выполнение SQL
Используйте MCP функции:
```
mcp_supabase_execute_sql
mcp_supabase_apply_migration
```

### 4. Генерация TypeScript типов
Используйте MCP функции:
```
mcp_supabase_generate_typescript_types
```

## 📂 Где искать файлы

### ✅ ЕСТЬ в проекте:
- `schemas/database.sql` - полная схема БД
- `lib/supabase/client.ts` - браузерный клиент
- `lib/supabase/server.ts` - серверный клиент  
- `types/database.ts` - TypeScript типы

### ❌ НЕТ в проекте (работает через MCP):
- `supabase/` папка с локальной конфигурацией
- `supabase/migrations/` - миграции через MCP
- локальная установка Supabase CLI
- `.env.local` с локальными credentials

## 🔗 Переменные окружения

Supabase credentials находятся в MCP, но для клиентов нужны:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🚫 Частые ошибки агентов

### ❌ НЕ ДЕЛАЙТЕ:
- Не ищите `supabase/migrations/`
- Не пытайтесь установить Supabase CLI
- Не создавайте локальные миграции
- Не ищите `supabase init` или `supabase start`

### ✅ ДЕЛАЙТЕ:
- Используйте MCP функции для работы с БД
- Обращайтесь к `schemas/database.sql` для схемы
- Используйте существующие клиенты в `lib/supabase/`
- Генерируйте типы через MCP

## 📋 Проверка состояния проекта

Если агент хочет проверить Supabase:

1. **Проверить подключение**:
   ```
   mcp_supabase_list_projects
   ```

2. **Посмотреть таблицы**:
   ```
   mcp_supabase_list_tables
   ```

3. **Проверить схему**:
   Читать файл `schemas/database.sql`

## 🎯 Для новых задач

Если задача требует работы с БД:
1. **НЕ создавайте** локальные миграции
2. **Используйте** MCP функции
3. **Обновляйте** `schemas/database.sql` при изменениях
4. **Генерируйте** новые типы через MCP

## 🚀 Serverless разработка

### Нативная разработка (без Docker):
- ✅ `npm run dev` - запуск dev сервера
- ✅ Vercel Functions для API
- ✅ Next.js App Router
- ❌ Docker НЕ НУЖЕН (файлы есть, но опциональные)

### MacBook friendly:
- ✅ Работает без Docker Desktop
- ✅ Нативная Node.js разработка
- ✅ Serverless архитектура
- ✅ AI-оптимизированная структура

---

**Помните**: 
- Задачи 2 и 3 **УЖЕ ЗАВЕРШЕНЫ** через MCP интеграцию!
- Задача 5 (Docker) **ОПЦИОНАЛЬНА** - проект serverless! 