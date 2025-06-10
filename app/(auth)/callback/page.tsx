'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const processCallback = async () => {
      try {
        // useSearchParams() is now safe to use here
        const urlParams = new URLSearchParams(searchParams.toString())
        
        // Проверяем наличие необходимых параметров
        if (!urlParams.get('id') || !urlParams.get('hash')) {
          throw new Error('Недостаточно данных от Telegram')
        }

        // Отправляем данные на callback API
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(urlParams)),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка авторизации')
        }

        setStatus('success')
        setMessage('Успешно авторизованы! Перенаправляем...')
        
        // Перенаправляем на dashboard через 2 секунды
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Неизвестная ошибка')
      }
    }

    processCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 px-8 py-10 shadow-lg rounded-xl text-center">
          {status === 'loading' && (
            <LoadingState />
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Добро пожаловать!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ошибка авторизации
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <>
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Обработка авторизации...
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Создаем ваш аккаунт
      </p>
    </>
  )
}

export default function CallbackPage() {
  return (
    // You could have a loading skeleton as the `fallback` too
    <Suspense fallback={<LoadingState />}>
      <CallbackHandler />
    </Suspense>
  )
} 