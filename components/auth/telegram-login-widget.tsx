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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Очищаем контейнер
    if (ref.current) {
      ref.current.innerHTML = ''
    }

    // Получаем полный URL для redirect
    const fullRedirectUrl = new URL(redirectUrl, window.location.origin).toString()

    // Создаем скрипт для Telegram виджета
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', fullRedirectUrl)
    script.setAttribute('data-request-access', 'write')
    script.async = true

    // Добавляем скрипт в контейнер
    if (ref.current) {
      ref.current.appendChild(script)
    }
  }, [botName, redirectUrl])

  return (
    <div className={className}>
      <div ref={ref} />
    </div>
  )
} 