#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки работы PostRepository
 * Запуск: node scripts/test-post-repository.js
 */

const { PostRepository } = require('../lib/repositories/post-repository.ts')
const { PostService } = require('../lib/services/post-service.ts')

async function testPostRepository() {
  console.log('🧪 Тестирование PostRepository...\n')

  try {
    const postRepo = new PostRepository()
    const postService = new PostService()
    
    // Тестовый пользователь ID (замените на реальный)
    const testUserId = 'test-user-id'
    const testChannelId = 'test-channel-id'

    console.log('1️⃣ Тестируем создание поста...')
    
    const createData = {
      channel_id: testChannelId,
      title: 'Тестовое размещение',
      creative_text: 'Это тестовый текст рекламного размещения. Покупайте наш продукт!',
      advertiser_inn: '1234567890',
      advertiser_name: 'ООО "Тестовая компания"',
      product_description: 'Тестовый продукт для демонстрации',
      target_url: 'https://example.com',
      placement_cost: 5000,
      placement_currency: 'RUB'
    }

    try {
      // Это должно выдать ошибку, так как канал не существует
      const post = await postService.createPost(testUserId, createData)
      console.log('✅ Пост создан:', post.post.id)
    } catch (error) {
      console.log('❌ Ожидаемая ошибка при создании поста:', error.message)
    }

    console.log('\n2️⃣ Тестируем валидацию...')
    
    const invalidData = {
      channel_id: '',
      title: '',
      creative_text: '',
      advertiser_inn: 'invalid',
      advertiser_name: '',
      product_description: ''
    }

    try {
      await postRepo.create(testUserId, invalidData)
      console.log('❌ Валидация не сработала!')
    } catch (error) {
      console.log('✅ Валидация работает:', error.message)
    }

    console.log('\n3️⃣ Тестируем получение постов...')
    
    try {
      const posts = await postRepo.findMany(testUserId, { limit: 5 })
      console.log('✅ Получено постов:', posts.total)
      console.log('   Список постов:', posts.posts.length)
    } catch (error) {
      console.log('❌ Ошибка получения постов:', error.message)
    }

    console.log('\n4️⃣ Тестируем фильтрацию...')
    
    try {
      const draftPosts = await postRepo.findMany(testUserId, { 
        status: 'draft',
        limit: 10 
      })
      console.log('✅ Найдено черновиков:', draftPosts.total)
      
      const scheduledPosts = await postRepo.findScheduled(testUserId)
      console.log('✅ Найдено запланированных:', scheduledPosts.length)
      
      const ordPendingPosts = await postRepo.findByOrdStatus(testUserId, 'pending')
      console.log('✅ Найдено ожидающих ОРД:', ordPendingPosts.length)
    } catch (error) {
      console.log('❌ Ошибка фильтрации:', error.message)
    }

    console.log('\n5️⃣ Тестируем статистику...')
    
    try {
      const stats = await postService.getPostsStats(testUserId)
      console.log('✅ Статистика постов:')
      console.log('   Всего:', stats.total)
      console.log('   Черновики:', stats.draft)
      console.log('   Запланировано:', stats.scheduled)
      console.log('   Опубликовано:', stats.published)
      console.log('   ОРД ожидает:', stats.ord_pending)
    } catch (error) {
      console.log('❌ Ошибка получения статистики:', error.message)
    }

    console.log('\n✅ Тестирование завершено!')

  } catch (error) {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  }
}

// Запускаем тесты
if (require.main === module) {
  testPostRepository()
    .then(() => {
      console.log('\n🎉 Все тесты выполнены!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Ошибка тестирования:', error)
      process.exit(1)
    })
}

module.exports = { testPostRepository } 