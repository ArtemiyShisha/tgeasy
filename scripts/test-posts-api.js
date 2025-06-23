#!/usr/bin/env node

/**
 * Тестовый скрипт для Posts API
 * Проверяет основные endpoints API рекламных размещений
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Тестовые данные
const testPost = {
  channel_id: 'test-channel-id',
  title: 'Тестовое размещение API',
  creative_text: 'Это тестовый текст рекламного креатива для проверки API',
  target_url: 'https://example.com',
  advertiser_inn: '1234567890',
  advertiser_name: 'Тестовый рекламодатель',
  product_description: 'Тестовый продукт',
  placement_cost: 5000,
  placement_currency: 'RUB'
}

const testAuthHeaders = {
  'Authorization': 'Bearer test-token',
  'Content-Type': 'application/json'
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}/api${endpoint}`
  
  try {
    console.log(`\n🔄 ${options.method || 'GET'} ${endpoint}`)
    
    const response = await fetch(url, {
      headers: testAuthHeaders,
      ...options
    })
    
    const data = await response.json()
    
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2))
    
    return { response, data }
  } catch (error) {
    console.error(`   Error:`, error.message)
    return { error }
  }
}

async function testPostsAPI() {
  console.log('🧪 Тестирование Posts API')
  console.log('=' .repeat(50))
  
  let createdPostId = null
  
  // 1. Получение списка постов
  console.log('\n📋 1. Получение списка постов')
  await makeRequest('/posts')
  
  // 2. Получение статистики
  console.log('\n📊 2. Получение статистики')
  await makeRequest('/posts/stats')
  
  // 3. Создание поста
  console.log('\n➕ 3. Создание поста')
  const createResult = await makeRequest('/posts', {
    method: 'POST',
    body: JSON.stringify(testPost)
  })
  
  if (createResult.data?.success) {
    createdPostId = createResult.data.data.post.id
    console.log(`   ✅ Пост создан с ID: ${createdPostId}`)
  }
  
  if (createdPostId) {
    // 4. Получение поста по ID
    console.log('\n🔍 4. Получение поста по ID')
    await makeRequest(`/posts/${createdPostId}`)
    
    // 5. Обновление поста
    console.log('\n✏️ 5. Обновление поста')
    await makeRequest(`/posts/${createdPostId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Обновленный заголовок',
        creative_text: 'Обновленный текст креатива'
      })
    })
    
    // 6. Планирование поста
    console.log('\n⏰ 6. Планирование поста')
    const scheduleDate = new Date()
    scheduleDate.setHours(scheduleDate.getHours() + 1) // Через час
    
    await makeRequest(`/posts/${createdPostId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        scheduled_at: scheduleDate.toISOString()
      })
    })
    
    // 7. Отмена планирования
    console.log('\n❌ 7. Отмена планирования')
    await makeRequest(`/posts/${createdPostId}/schedule`, {
      method: 'DELETE'
    })
    
    // 8. Удаление поста
    console.log('\n🗑️ 8. Удаление поста')
    await makeRequest(`/posts/${createdPostId}`, {
      method: 'DELETE'
    })
  }
  
  // 9. Поиск постов
  console.log('\n🔎 9. Поиск постов')
  await makeRequest('/posts/search?q=тест&limit=5')
  
  // 10. Тестирование валидации
  console.log('\n❗ 10. Тестирование валидации')
  await makeRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: '', // Пустой заголовок - должно вызвать ошибку
      creative_text: 'test'
    })
  })
  
  console.log('\n✅ Тестирование завершено!')
}

async function testRateLimit() {
  console.log('\n🚦 Тестирование Rate Limiting')
  console.log('=' .repeat(50))
  
  // Отправляем много запросов подряд
  console.log('\n📈 Отправка множественных запросов...')
  
  const promises = []
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('/posts/stats'))
  }
  
  await Promise.all(promises)
  console.log('\n✅ Rate limiting тест завершен')
}

// Запуск тестов
async function runTests() {
  try {
    await testPostsAPI()
    await testRateLimit()
  } catch (error) {
    console.error('\n❌ Ошибка при выполнении тестов:', error)
    process.exit(1)
  }
}

// Проверка аргументов командной строки
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Использование: node test-posts-api.js [опции]

Опции:
  --help, -h     Показать эту справку
  --url <url>    Указать базовый URL (по умолчанию: http://localhost:3000)

Примеры:
  node test-posts-api.js
  node test-posts-api.js --url https://your-app.vercel.app

Переменные окружения:
  NEXT_PUBLIC_APP_URL    Базовый URL приложения
`)
  process.exit(0)
}

if (args.includes('--url')) {
  const urlIndex = args.indexOf('--url')
  if (args[urlIndex + 1]) {
    BASE_URL = args[urlIndex + 1]
  }
}

console.log(`🌐 Тестирование API на: ${BASE_URL}`)
runTests() 