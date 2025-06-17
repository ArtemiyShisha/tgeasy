'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Moon, Sun } from 'lucide-react'
import TelegramLoginWidget from '@/components/auth/telegram-login-widget'

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tgeasy_oauth_bot'

export default function LoginPage() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 ${
            isDark ? 'bg-blue-500' : 'bg-blue-300'
          }`}
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 ${
            isDark ? 'bg-purple-500' : 'bg-purple-300'
          }`}
        />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-black/10 hover:bg-black/20 text-gray-800'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
            isDark 
              ? 'bg-white/10 border-white/20 text-white' 
              : 'bg-white/70 border-white/40 text-gray-900'
          }`}
        >
          {/* Logo and title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-blue-500' : 'bg-blue-600'
              }`}
            >
              <Send className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              TGeasy
            </h1>
            <p className={`text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Управление рекламой в Telegram каналах
            </p>
          </div>

          {/* Telegram Login Widget */}
          <div className="flex justify-center mb-6">
            <TelegramLoginWidget 
              botName={TELEGRAM_BOT_USERNAME}
              className="telegram-login-widget"
            />
          </div>

          {/* Instructions */}
          <div className={`text-center text-sm space-y-2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>
              Нажимая &quot;Войти через Telegram&quot;, вы соглашаетесь с{' '}
              <a href="/terms" className="text-blue-500 hover:text-blue-600 underline">
                условиями использования
              </a>{' '}
              и{' '}
              <a href="/privacy" className="text-blue-500 hover:text-blue-600 underline">
                политикой конфиденциальности
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 