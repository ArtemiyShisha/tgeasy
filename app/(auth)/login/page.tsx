'use client'

import { Suspense } from 'react'
import TelegramLoginWidget from '@/components/auth/telegram-login-widget'

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tgeasy_oauth_bot'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TGeasy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управляй рекламой в Telegram
          </p>
        </div>

        <div className="space-y-6">
          <Suspense fallback={
            <div className="flex justify-center items-center h-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }>
            <TelegramLoginWidget
              botName={TELEGRAM_BOT_USERNAME}
              redirectUrl="/api/auth/callback"
              className="flex justify-center"
            />
          </Suspense>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>
              Нажимая кнопку входа, вы соглашаетесь с использованием ваших данных
              из Telegram для создания аккаунта
            </p>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Для работы виджета:</p>
              <p>1. Перейдите к @BotFather в Telegram</p>
              <p>2. Выполните /setdomain</p>
              <p>3. Выберите @{TELEGRAM_BOT_USERNAME}</p>
              <p>4. Введите: tired-birds-mix.loca.lt</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 