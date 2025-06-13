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
        className="bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium py-3 px-6 rounded-lg flex items-center gap-3 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169 1.858-.896 6.728-.896 6.728-.896 6.728-1.292 8.323-1.292 8.323-.179.792-.669.792-1.235.792-.566 0-.896-.317-1.235-.792 0 0-.396-1.595-1.292-8.323 0 0-.727-4.87-.896-6.728-.056-.621.169-1.13.565-1.13s.621.509.565 1.13z"/>
        </svg>
        Войти через Telegram
      </button>
    </div>
  )
} 