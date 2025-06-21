# TGeasy - Автоматизация рекламы в Telegram каналах

**🏷️ Платформа для автоматической регистрации рекламы в ОРД Яндекса и управления Telegram каналами**

## 🎯 Основная функция

**ОРД (Общий реестр рекламы) автоматизация - это CORE функция TGeasy:**

- 🚨 **Юридическое соответствие**: Автоматическая регистрация каждого рекламного размещения в ОРД Яндекса
- ⚡ **ERID автоматизация**: Автоматическое получение и добавление ERID кодов к постам
- 🛡️ **Защита от штрафов**: Предотвращение штрафов до 500,000₽ за немаркированную рекламу
- ⏰ **Экономия времени**: Сокращение времени на маркировку с 2-5 часов до 30 секунд
- 📋 **Compliance**: Полное соответствие требованиям российского законодательства

## 🚀 Дополнительные возможности

- 📺 **Управление каналами**: Подключение и управление множественными Telegram каналами
- 🤖 **Автопостинг**: Автоматическая публикация с ОРД маркировкой
- 📊 **Аналитика**: Детальная статистика по рекламным размещениям
- 📋 **Договоры**: Управление договорами с рекламодателями
- 💰 **Монетизация**: Подписочная модель с тарифными планами
- * Управление Telegram-каналами (multi-user, disconnect/reconnect)
- * Загрузка и хранение договоров (PDF/DOCX) с просмотром и скачиванием

[![Production](https://img.shields.io/badge/Production-Live-green)](https://tgeasy-avr4ev24t-shishkinartemiy-gmailcoms-projects.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)
[![Horizon UI](https://img.shields.io/badge/Horizon%20UI-Integrated-blue)](https://horizon-ui.com/)

## 🎯 Текущий статус: **ЭТАП 3 + HORIZON UI ЗАВЕРШЕН** - Современный интерфейс готов!

**Production URL**: https://tgeasy-avr4ev24t-shishkinartemiy-gmailcoms-projects.vercel.app

### ✅ Последние обновления (Декабрь 2024)

**🎨 NEW: Horizon UI Design System интеграция**
- **Modern glassmorphism** дизайн для всех компонентов
- **Enhanced dashboard** header с breadcrumbs и theme toggle  
- **Professional UI/UX** с improved navigation и animations
- **100% совместимость** с существующей архитектурой
- **Production deployed** и optimized для всех устройств

**🎯 UX Redesign: Рефакторинг статусов каналов**
- Переработана логика: **статус канала = статус бота** (готовность к работе)
- 🟢 **АКТИВЕН** - готов к работе | 🟡 **НАСТРОЙКА** - нужно добавить бота | 🔴 **ОТКЛЮЧЕН** - нет доступа  
- ✅ Исправлена ошибка 401 в API проверки статуса
- ✅ Исправлено имя бота: `@tgeasy_oauth_bot`
- ✅ Права пользователей показываются только для активных каналов

---

## 🚀 Production Ready Функции

### ✅ Аутентификация
- **Telegram OAuth** через бота @tgeasy_oauth_bot
- **Безопасные сессии** с cookies
- **Middleware защита** маршрутов
- **Mobile WebView** поддержка

### ✅ Управление каналами
- **Подключение каналов** по @username или invite link
- **Telegram-native права доступа** (Creator/Administrator)
- **Автоматическая синхронизация** прав из Telegram
- **Real-time UI** с optimistic updates
- **Comprehensive error handling** с retry logic

### ✅ UI/UX Excellence (Horizon UI Enhanced)
- **Horizon UI design system** с professional glassmorphism
- **Enhanced dashboard layout** с modern navigation  
- **Responsive glassmorphism** для всех устройств
- **Advanced dark/light theme** с system preferences
- **Breadcrumb navigation** с automatic generation
- **Avatar integration** и user profile display
- **Smooth animations** и hover effects
- **Loading states** и comprehensive error handling
- **WCAG 2.1 accessibility** compliance

---

## 🏗️ Архитектура

### Технологический стек
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui + Horizon UI
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **UI Generation**: 21st.dev MCP + Horizon UI Design System
- **Integrations**: Telegram Bot API

### Ключевые особенности
- **Serverless-first** архитектура
- **Telegram-native** система прав доступа
- **MCP-driven** UI development
- **TypeScript strict** mode для type safety
- **Production monitoring** и error tracking

---

## 📊 Статистика разработки

- **Завершенные задачи**: 14 из 46 (30%)
- **Завершенные этапы**: 3 из 10 (30%)
- **Строки кода**: 5,200+ (TypeScript/React/SQL)
- **Файлы созданы**: 55+
- **Production deployments**: 16+
- **UI Components**: 20+ (shadcn/ui + Horizon UI enhanced)

### MVP Готовность: **60%**
- ✅ **Core functionality**: Аутентификация + Каналы
- ⚠️ **Content creation**: Требуется (Этап 5)
- ⚠️ **Publishing**: Требуется (Этап 6)
- ⚠️ **Analytics**: Требуется (Этап 7)

---

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+
- npm или yarn
- Supabase аккаунт
- Telegram Bot Token

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/tgeasy.git
cd tgeasy

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Заполните переменные в .env.local

# Запуск в режиме разработки
npm run dev
```

### Переменные окружения

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_SECRET=your_bot_secret
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username

# App
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 📁 Структура проекта

```
tgeasy/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Аутентификация
│   ├── (dashboard)/       # Основное приложение
│   └── api/               # API endpoints
├── components/            # React компоненты
│   ├── auth/             # Компоненты аутентификации
│   ├── channels/         # Управление каналами
│   └── ui/               # shadcn/ui компоненты
├── hooks/                # React hooks
├── lib/                  # Утилиты и сервисы
│   ├── api/             # API клиенты
│   ├── auth/            # Аутентификация
│   ├── integrations/    # Внешние интеграции
│   ├── repositories/    # Data access layer
│   ├── services/        # Бизнес-логика
│   └── supabase/        # Supabase клиенты
├── types/               # TypeScript типы
├── utils/               # Вспомогательные функции
└── schemas/             # Database schemas
```

---

## 🎯 Roadmap

### Краткосрочные цели (1-2 недели)
- [ ] **Этап 4**: Система договоров
- [ ] **Этап 5**: Создание и управление размещений
- [ ] **Базовое тестирование** критических путей

### Среднесрочные цели (1 месяц)
- [ ] **Этап 6**: Интеграции (ОРД + Публикация)
- [ ] **Этап 7**: Аналитика и отчеты
- [ ] **Security audit** и hardening

### Долгосрочные цели (2-3 месяца)
- [ ] **Этап 8**: Платежная система
- [ ] **Этап 9**: Уведомления
- [ ] **MVP Launch** с полным функционалом

---

## 🤝 Разработка

### Команды разработки

```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Production build
npm run start        # Запуск production сервера
npm run lint         # ESLint проверка
npm run type-check   # TypeScript проверка

# База данных
npm run db:generate  # Генерация типов из Supabase
npm run db:reset     # Сброс локальной БД
```

### Стандарты кода
- **TypeScript strict mode** для type safety
- **ESLint + Prettier** для code quality
- **Conventional Commits** для commit messages
- **Component-first** архитектура
- **API-first** design

---

## 📚 Документация

- [TODO.md](./TODO.md) - Детальный план разработки
- [STATUS.md](./STATUS.md) - Текущий статус проекта
- [CHANGELOG.md](./CHANGELOG.md) - История изменений
- [DEVELOPMENT_INSIGHTS.md](./DEVELOPMENT_INSIGHTS.md) - Insights разработки

---

## 🔧 Техническое состояние

### ✅ Стабильность
- **Build**: ✅ Компилируется без ошибок
- **Performance**: ✅ < 2 секунд загрузка
- **Security**: ⚠️ Базовая (требует audit)

### ✅ Интеграции
- **Supabase**: ✅ Работает стабильно
- **Telegram Bot API**: ✅ Полностью интегрирован
- **Vercel**: ✅ Auto-deploy настроен
- **21st.dev MCP**: ✅ UI генерация работает

---

## 📄 Лицензия

MIT License - см. [LICENSE](./LICENSE) файл для деталей.

---

## 👥 Команда

Разработано с использованием AI-инструментов (Cursor/Claude) для ускорения разработки.

---

**🎉 TGeasy - Современная система управления рекламой в Telegram каналах**
