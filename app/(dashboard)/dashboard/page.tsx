/**
 * Дашборд - главная страница после аутентификации
 * Защищена middleware для проверки аутентификации
 */
export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Всего каналов
          </h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500">
            Подключенные каналы
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Размещений за месяц
          </h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500">
            За последние 30 дней
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Просмотров
          </h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500">
            Общая аналитика
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Активных договоров
          </h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500">
            С рекламодателями
          </p>
        </div>
      </div>
    </div>
  )
} 