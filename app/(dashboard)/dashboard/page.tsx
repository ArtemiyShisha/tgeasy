/**
 * Дашборд - главная страница после аутентификации
 * Защищена middleware для проверки аутентификации
 */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  // Проверяем авторизацию
  const cookieStore = cookies()
  const userId = cookieStore.get('user_id')?.value
  
  if (!userId) {
    redirect('/login')
  }

  // Получаем данные пользователя
  const supabase = createClient()
  const { data: user } = await supabase
    .from('users')
    .select('telegram_first_name, telegram_username, created_at')
    .eq('id', userId)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Добро пожаловать в TGeasy! 🎉
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Привет, {user?.telegram_first_name}! Ваш аккаунт успешно создан.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{user?.telegram_username || 'пользователь'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Регистрация: {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'сегодня'}
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Авторизация завершена успешно!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Ваш аккаунт TGeasy готов к использованию. Теперь вы можете:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Подключать Telegram каналы</li>
                    <li>Создавать рекламные размещения</li>
                    <li>Отслеживать аналитику</li>
                    <li>Управлять подписками</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">📺</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Подключить каналы
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Добавьте ваши Telegram каналы
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Подключить канал
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-lg">📝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Создать размещение
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Новое рекламное размещение
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Создать пост
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Аналитика
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Статистика размещений
                  </p>
                </div>
              </div>
              <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Посмотреть отчеты
              </button>
            </div>
          </div>

          {/* Bot Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">🤖</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-200">
                  Telegram бот (опционально)
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Для получения уведомлений о публикациях вы можете подписаться на нашего бота.
                </p>
                <div className="mt-3">
                  <a 
                    href="https://t.me/tgeasy_oauth_bot?start=notifications"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <span className="mr-2">📱</span>
                    Подписаться на уведомления
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 