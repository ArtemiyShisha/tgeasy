'use client'

import { useEffect, useRef } from 'react'

interface TelegramLoginWidgetProps {
  botName: string
  redirectUrl?: string
  className?: string
}

export default function TelegramLoginWidget({ 
  botName, 
  redirectUrl = '/api/auth/callback',
  className = '' 
}: TelegramLoginWidgetProps) {
  
  // Генерируем уникальный state для безопасности
  const generateState = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleTelegramAuth = () => {
    const state = generateState()
    // Сохраняем state в localStorage для проверки
    localStorage.setItem('telegram_auth_state', state)
    
    // Создаем ссылку на бота с параметрами
    const botUrl = `https://t.me/${botName}?start=auth_${state}`
    
    // Открываем в новом окне
    window.open(botUrl, '_blank', 'width=400,height=600')
    
    // Показываем инструкции пользователю
    alert('Перейдите в Telegram бота и нажмите "START", затем вернитесь сюда')
  }

  return (
    <div className={className}>
      <button
        onClick={handleTelegramAuth}
        className="w-full bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
      >
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-[#0088cc] text-sm font-bold">✈</span>
        </div>
        Войти через Telegram
      </button>
    </div>
  )
} 