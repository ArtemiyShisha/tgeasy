'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCompletePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
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
          setMessage('Авторизация успешно завершена!')
          
          // Очищаем localStorage
          localStorage.removeItem('telegram_auth_state')
          
          // Перенаправляем в дашборд через 2 секунды
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Ошибка авторизации')
        }
      } catch (error) {
        console.error('Auth completion error:', error)
        setStatus('error')
        setMessage('Произошла ошибка при завершении авторизации')
      }
    }

    completeAuth()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-8 max-w-md w-full text-center"
      >
        <div className="mb-6">
          {status === 'loading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Loader2 className="w-16 h-16 text-blue-600" />
            </motion.div>
          )}
          
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <XCircle className="w-16 h-16 text-red-600" />
            </motion.div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && 'Завершение авторизации...'}
          {status === 'success' && 'Авторизация успешна!'}
          {status === 'error' && 'Ошибка авторизации'}
        </h1>

        <p className="text-gray-600 mb-6">
          {status === 'loading' && 'Пожалуйста, подождите...'}
          {status === 'success' && 'Перенаправляем вас в дашборд...'}
          {status === 'error' && message}
        </p>

        {status === 'error' && (
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-500">
            Автоматическое перенаправление через 2 секунды...
          </div>
        )}
      </motion.div>
    </div>
  )
} 