'use client'

import React, { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Send, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import TelegramLoginWidget from '@/components/auth/telegram-login-widget'

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'tgeasy_oauth_bot'

export default function LoginPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Prevents hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  const isDark = mounted ? theme === 'dark' : true

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (!mounted) {
    return null // Prevents hydration mismatch
  }

  return (
    <div className={`min-h-screen w-full relative overflow-hidden flex items-center justify-center transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-50'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <motion.div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            isDark ? 'bg-blue-500' : 'bg-blue-300'
          }`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 ${
            isDark ? 'bg-purple-500' : 'bg-purple-300'
          }`}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className={`absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-2xl opacity-15 ${
            isDark ? 'bg-cyan-400' : 'bg-cyan-200'
          }`}
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Theme toggle button */}
      <motion.button
        onClick={handleThemeToggle}
        className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
          isDark 
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
            : 'bg-black/10 border-black/20 text-gray-800 hover:bg-black/20'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glassmorphism card */}
        <div className={`relative backdrop-blur-xl rounded-3xl p-8 border shadow-2xl ${
          isDark 
            ? 'bg-white/10 border-white/20' 
            : 'bg-white/70 border-white/40'
        }`}>
          {/* Card glow effect */}
          <div className={`absolute -inset-[1px] rounded-3xl opacity-50 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20' 
              : 'bg-gradient-to-r from-blue-300/30 via-purple-300/30 to-cyan-300/30'
          }`} />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Logo and branding */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-400 to-purple-500'
              }`}>
                <Send className="w-8 h-8 text-white" />
              </div>
              
              <h1 className={`text-3xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                TGeasy
              </h1>
              
              <p className={`text-sm ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Управляйте рекламой в Telegram каналах
              </p>
            </motion.div>

            {/* Telegram login section */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Telegram Login Widget */}
              <div className="flex justify-center">
                <Suspense fallback={
                  <div className="flex justify-center items-center h-12">
                    <motion.div 
                      className={`h-8 w-8 border-2 border-t-transparent rounded-full ${
                        isDark ? 'border-white/30' : 'border-gray-400'
                      }`}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                }>
                  <TelegramLoginWidget
                    botName={TELEGRAM_BOT_USERNAME}
                    redirectUrl="/api/auth/callback"
                    className="telegram-widget-wrapper"
                  />
                </Suspense>
              </div>

              {/* Additional info */}
              <div className="text-center">
                <p className={`text-xs ${
                  isDark ? 'text-white/50' : 'text-gray-400'
                }`}>
                  Нажимая "Войти через Telegram", вы соглашаетесь с{' '}
                  <span className={`underline cursor-pointer transition-colors ${
                    isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}>
                    условиями использования
                  </span>
                </p>
              </div>

              {/* Development info */}
              {process.env.NODE_ENV === 'development' && (
                <motion.div 
                  className={`mt-4 p-3 rounded-2xl border text-xs ${
                    isDark 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="font-medium mb-2">Разработка - настройка бота:</p>
                  <div className="space-y-1 text-left">
                    <p>1. @BotFather → /setdomain</p>
                    <p>2. Выберите @{TELEGRAM_BOT_USERNAME}</p>
                    <p>3. Введите домен: localhost:3000</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${
            isDark ? 'bg-white/20' : 'bg-gray-400/30'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
} 