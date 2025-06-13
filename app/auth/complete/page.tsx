'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'

// Типы для Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openLink: (url: string) => void
      }
    }
  }
}

function AuthCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isTelegramWebView, setIsTelegramWebView] = useState(false)

  useEffect(() => {
    // Проверяем, открыто ли в Telegram WebView
    const userAgent = navigator.userAgent.toLowerCase()
    const isTgWebView = userAgent.includes('telegram')
    setIsTelegramWebView(isTgWebView)

    const telegramId = searchParams.get('telegram_id')
    const state = searchParams.get('state')

    if (!telegramId || !state) {
      setStatus('error')
      setMessage('Отсутствуют необходимые параметры авторизации')
      return
    }

    // Проверяем авторизацию
    const completeAuth = async () => {
      try {
        const response = await fetch(`/api/auth/check?telegram_id=${telegramId}&state=${state}`)
        const data = await response.json()

        if (data.authorized) {
          setStatus('success')
          setMessage('Авторизация успешна! Перенаправляем в дашборд...')
          
          // Для Telegram WebView используем специальную логику
          if (isTgWebView) {
            // Пытаемся открыть в браузере
            const dashboardUrl = `${window.location.origin}/dashboard`
            
            // Показываем кнопку для открытия в браузере
            setTimeout(() => {
              setMessage('Нажмите кнопку ниже чтобы открыть дашборд в браузере')
            }, 2000)
          } else {
            // Обычное перенаправление для браузера
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Ошибка авторизации')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Ошибка при проверке авторизации')
        console.error('Auth check error:', error)
      }
    }

    completeAuth()
  }, [searchParams, router])

  const openInBrowser = () => {
    const dashboardUrl = `${window.location.origin}/dashboard`
    
    // Пытаемся открыть в браузере разными способами
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(dashboardUrl)
    } else {
      // Fallback - открываем в новом окне
      window.open(dashboardUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Завершаем авторизацию...
            </h1>
            <p className="text-gray-600">
              Проверяем ваши данные
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Успешно!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {isTelegramWebView && message.includes('браузере') && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={openInBrowser}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 w-full transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Открыть дашборд в браузере
              </motion.button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ошибка авторизации
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg w-full transition-colors"
            >
              Попробовать снова
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <AuthCompleteContent />
    </Suspense>
  )
} 