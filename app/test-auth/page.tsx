export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Тест Telegram Auth</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Проверьте настройки @BotFather:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Откройте @BotFather</li>
              <li>• Отправьте /setdomain</li>
              <li>• Выберите @tgeasy_oauth_bot</li>
              <li>• Введите: tgeasy.vercel.app</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Простая Telegram кнопка:</h3>
            <div 
              id="telegram-login-widget"
              dangerouslySetInnerHTML={{
                __html: `
                  <script 
                    async 
                    src="https://telegram.org/js/telegram-widget.js?22" 
                    data-telegram-login="tgeasy_oauth_bot" 
                    data-size="large" 
                    data-auth-url="https://tgeasy.vercel.app/api/auth/callback"
                    data-request-access="write">
                  </script>
                `
              }}
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Если не работает:</h3>
            <p className="text-sm text-gray-600">
              Проблема в настройках домена у @BotFather. 
              Telegram Login Widget работает только с зарегистрированными доменами.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 