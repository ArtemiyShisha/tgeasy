#!/usr/bin/env node

/**
 * Скрипт для обновления Telegram webhook URL на preview deployment
 * Использование: node scripts/update-telegram-webhook.js <VERCEL_URL>
 */

// Загружаем переменные из .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');

async function updateTelegramWebhook(vercelUrl) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
    process.exit(1);
  }

  const webhookUrl = `https://${vercelUrl}/api/webhooks/telegram`;
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
  
  const data = JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['message', 'channel_post', 'chat_member']
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(telegramApiUrl, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const response = JSON.parse(responseData);
        if (response.ok) {
          console.log('✅ Telegram webhook обновлен успешно!');
          console.log(`🔗 Webhook URL: ${webhookUrl}`);
          resolve(response);
        } else {
          console.error('❌ Ошибка обновления webhook:', response.description);
          reject(new Error(response.description));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Ошибка запроса:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function checkCurrentWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  
  return new Promise((resolve, reject) => {
    https.get(telegramApiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('📡 Текущий webhook:', response.result.url || 'не установлен');
          resolve(response.result);
        } else {
          reject(new Error(response.description));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const vercelUrl = process.argv[2];
  
  if (!vercelUrl) {
    console.error('❌ Использование: node scripts/update-telegram-webhook.js <VERCEL_URL>');
    console.error('   Пример: node scripts/update-telegram-webhook.js tgeasy-git-dev-username.vercel.app');
    process.exit(1);
  }

  try {
    console.log('🔍 Проверяем текущий webhook...');
    await checkCurrentWebhook();
    
    console.log('🔄 Обновляем webhook...');
    await updateTelegramWebhook(vercelUrl);
    
    console.log('\n🎉 Готово! Теперь можно тестировать Telegram OAuth:');
    console.log(`   OAuth URL: https://${vercelUrl}/api/auth/telegram`);
    console.log(`   Callback URL: https://${vercelUrl}/api/auth/callback`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateTelegramWebhook, checkCurrentWebhook }; 