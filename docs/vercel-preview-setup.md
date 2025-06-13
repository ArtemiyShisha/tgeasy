# Vercel Preview Deployments - Настройка для Telegram OAuth

## 🎯 Цель

Использование **Vercel Preview Deployments** для тестирования Telegram OAuth без локального туннелирования. Каждый push в ветку создает уникальный URL для тестирования.

## 🚀 Первоначальная настройка

### 1. Подключите проект к Vercel

```bash
# Установите Vercel CLI
npm i -g vercel

# Авторизуйтесь в Vercel
vercel login

# Привяжите проект
vercel link
```

### 2. Настройте GitHub Secrets

В GitHub репозитории перейдите в `Settings > Secrets and variables > Actions` и добавьте:

#### Обязательные secrets:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id  
VERCEL_PROJECT_ID=your_project_id
```

#### Переменные для build:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Получите Vercel токен и ID

```bash
# Получите токен
vercel tokens create

# Получите Org ID и Project ID
vercel project ls
cat .vercel/project.json
```

## 🔄 Workflow разработки

### 1. Создайте ветку для разработки

```bash
git checkout -b feature/telegram-auth
git push -u origin feature/telegram-auth
```

### 2. Автоматический деплой

После push, GitHub Actions автоматически:
- ✅ Соберет проект
- ✅ Задеплоит на Vercel Preview
- ✅ Покажет URL в комментарии к PR

### 3. Обновите Telegram webhook

```bash
# Когда получите preview URL, обновите webhook:
npm run webhook:update tgeasy-git-feature-username.vercel.app

# Проверьте текущий webhook:
npm run webhook:check
```

### 4. Тестируйте OAuth

Используйте preview URL для тестирования:
- **OAuth URL**: `https://your-preview-url.vercel.app/api/auth/telegram`
- **Callback URL**: `https://your-preview-url.vercel.app/api/auth/callback`

## 📝 Пример workflow

### 1. Разработка локально
```bash
npm run dev
# Разработка на localhost:3000
```

### 2. Push для тестирования
```bash
git add .
git commit -m "feat: добавил telegram auth"
git push
```

### 3. Получите preview URL
GitHub Actions создаст комментарий в PR с URL:
```
🚀 Preview Deployment Ready!
Preview URL: https://tgeasy-git-feature-username.vercel.app
```

### 4. Обновите webhook
```bash
TELEGRAM_BOT_TOKEN=your_token npm run webhook:update tgeasy-git-feature-username.vercel.app
```

### 5. Тестируйте OAuth
Откройте `https://tgeasy-git-feature-username.vercel.app` и тестируйте авторизацию.

## 🔧 Управление webhook

### Проверить текущий webhook
```bash
TELEGRAM_BOT_TOKEN=your_token node scripts/update-telegram-webhook.js --check
```

### Обновить webhook на новый URL
```bash
TELEGRAM_BOT_TOKEN=your_token node scripts/update-telegram-webhook.js new-preview-url.vercel.app
```

### Удалить webhook (для локальной разработки)
```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
```

## 🎯 Преимущества Preview Deployments

### ✅ Преимущества:
- **Реальные URL** для Telegram OAuth
- **Автоматический деплой** на каждый push
- **Изолированная среда** для каждой ветки
- **HTTPS из коробки** без настройки сертификатов
- **Совместная работа** - поделитесь URL с командой

### ❌ Альтернативы (которые не используем):
- ~~ngrok/localtunnel~~ - нет доступа
- ~~Docker~~ - не нужен для serverless
- ~~VPS~~ - избыточно для тестирования

## 🔍 Troubleshooting

### Build ошибки
```bash
# Проверьте переменные окружения в Vercel
vercel env ls

# Локальный тест build
npm run build
```

### Webhook не обновляется
```bash
# Проверьте токен
echo $TELEGRAM_BOT_TOKEN

# Проверьте URL формат
# Правильно: tgeasy-git-feature-username.vercel.app
# Неправильно: https://tgeasy-git-feature-username.vercel.app
```

### OAuth не работает
- ✅ Проверьте callback URL в Telegram Bot settings
- ✅ Убедитесь что webhook активен
- ✅ Проверьте CORS настройки в `vercel.json`

## 📚 Полезные команды

```bash
# Ручной деплой preview
npm run deploy:preview

# Список всех deployments
vercel ls

# Логи deployment
vercel logs

# Переменные окружения
vercel env ls
vercel env add TELEGRAM_BOT_TOKEN

# Удалить deployment
vercel rm deployment-url
```

---

## 🚀 Готово к тестированию!

Теперь каждый push автоматически создает preview deployment с уникальным URL для тестирования Telegram OAuth без туннелирования! 