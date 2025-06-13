#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram Bot Webhook
 * 
 * Использование:
 * node scripts/setup-telegram-webhook.js
 * 
 * Переменные окружения:
 * - TELEGRAM_BOT_TOKEN: токен бота от @BotFather
 * - NEXTAUTH_URL: базовый URL приложения (например, https://tgeasy.vercel.app)
 */

// Загружаем переменные окружения из .env.local
const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  try {
    const envFile = fs.readFileSync(filePath, 'utf8')
    const lines = envFile.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          process.env[key] = value
        }
      }
    }
  } catch (error) {
    // Файл не найден или не читается - не критично
  }
}

// Загружаем .env.local если существует
loadEnvFile(path.join(__dirname, '..', '.env.local'))

const https = require('https')
const { URL } = require('url')

// Конфигурация
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://tgeasy.vercel.app/api/telegram/webhook'

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения')
  process.exit(1)
}

/**
 * Выполняет HTTP запрос к Telegram Bot API
 */
function telegramRequest(method, data = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`)
    const postData = JSON.stringify(data)
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    
    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', (chunk) => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.ok) {
            resolve(result.result)
          } else {
            reject(new Error(`Telegram API Error: ${result.description}`))
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`))
        }
      })
    })
    
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

/**
 * Получает информацию о боте
 */
async function getBotInfo() {
  try {
    const botInfo = await telegramRequest('getMe')
    console.log('🤖 Информация о боте:')
    console.log(`   Имя: ${botInfo.first_name}`)
    console.log(`   Username: @${botInfo.username}`)
    console.log(`   ID: ${botInfo.id}`)
    return botInfo
  } catch (error) {
    console.error('❌ Ошибка получения информации о боте:', error.message)
    throw error
  }
}

/**
 * Получает текущий webhook
 */
async function getWebhookInfo() {
  try {
    const webhookInfo = await telegramRequest('getWebhookInfo')
    console.log('🔗 Текущий webhook:')
    console.log(`   URL: ${webhookInfo.url || 'не установлен'}`)
    console.log(`   Pending updates: ${webhookInfo.pending_update_count}`)
    if (webhookInfo.last_error_date) {
      console.log(`   Последняя ошибка: ${webhookInfo.last_error_message}`)
    }
    return webhookInfo
  } catch (error) {
    console.error('❌ Ошибка получения webhook:', error.message)
    throw error
  }
}

/**
 * Устанавливает webhook
 */
async function setWebhook() {
  try {
    console.log('🚀 Настройка Telegram Bot для TGeasy\n')

    // Получаем информацию о боте
    const botInfo = await getBotInfo()
    console.log('🤖 Информация о боте:')
    console.log(`   Имя: ${botInfo.first_name}`)
    console.log(`   Username: @${botInfo.username}`)
    console.log(`   ID: ${botInfo.id}\n`)

    // Проверяем текущий webhook
    const webhookInfo = await getWebhookInfo()
    console.log('🔗 Текущий webhook:')
    console.log(`   URL: ${webhookInfo.url || 'не установлен'}`)
    console.log(`   Pending updates: ${webhookInfo.pending_update_count}\n`)

    // Устанавливаем новый webhook
    console.log(`🔧 Устанавливаем webhook: ${WEBHOOK_URL}`)
    
    await telegramRequest('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query']
    })
    
    console.log('✅ Webhook успешно установлен!')
    console.log(`📡 URL: ${WEBHOOK_URL}`)
    console.log('\n🎉 Telegram Bot готов к работе!')
    
    // Проверяем что webhook работает
    console.log('\n🔍 Проверяем webhook...')
    const testResponse = await fetch(WEBHOOK_URL)
    
    if (testResponse.ok) {
      console.log('✅ Webhook endpoint доступен')
    } else {
      console.log('⚠️  Webhook endpoint недоступен, но это нормально для production')
    }

  } catch (error) {
    console.error('💥 Ошибка настройки:', error.message)
    process.exit(1)
  }
}

/**
 * Удаляет webhook (для отладки)
 */
async function deleteWebhook() {
  try {
    console.log('🗑️  Удаляем webhook...')
    await telegramRequest('deleteWebhook', { drop_pending_updates: true })
    console.log('✅ Webhook удален!')
  } catch (error) {
    console.error('❌ Ошибка удаления webhook:', error.message)
    throw error
  }
}

/**
 * Устанавливает команды бота
 */
async function setBotCommands() {
  try {
    console.log('📝 Устанавливаем команды бота...')
    
    await telegramRequest('setMyCommands', {
      commands: [
        {
          command: 'start',
          description: 'Активировать аккаунт TGeasy'
        },
        {
          command: 'help',
          description: 'Помощь по использованию'
        }
      ]
    })
    
    console.log('✅ Команды бота установлены!')
  } catch (error) {
    console.error('❌ Ошибка установки команд:', error.message)
    throw error
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🚀 Настройка Telegram Bot для TGeasy\n')
  
  try {
    // Получаем информацию о боте
    await getBotInfo()
    console.log()
    
    // Проверяем текущий webhook
    await getWebhookInfo()
    console.log()
    
    // Обрабатываем аргументы командной строки
    const args = process.argv.slice(2)
    
    if (args.includes('--delete')) {
      await deleteWebhook()
      return
    }
    
    // Устанавливаем webhook
    await setWebhook()
    console.log()
    
    // Устанавливаем команды
    await setBotCommands()
    console.log()
    
    // Проверяем результат
    await getWebhookInfo()
    
    console.log('\n🎉 Настройка завершена!')
    console.log('\n📋 Что дальше:')
    console.log('1. Убедитесь что переменная TELEGRAM_BOT_TOKEN добавлена в Vercel')
    console.log('2. Протестируйте бота: напишите /start боту @' + (await getBotInfo()).username)
    console.log('3. Проверьте логи webhook в Vercel Dashboard')
    
  } catch (error) {
    console.error('\n💥 Ошибка настройки:', error.message)
    process.exit(1)
  }
}

// Запускаем скрипт
if (require.main === module) {
  main()
}

module.exports = {
  getBotInfo,
  getWebhookInfo,
  setWebhook,
  deleteWebhook,
  setBotCommands
} 