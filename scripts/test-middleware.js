#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки middleware логики
 * Запуск: node scripts/test-middleware.js
 */

const crypto = require('crypto');

// Mock данные для тестирования
const mockTelegramUser = {
  id: 123456789,
  first_name: 'Тест',
  last_name: 'Пользователь',
  username: 'testuser',
  telegram_id: 123456789,
  role: 'user',
  created_at: new Date().toISOString()
};

const mockAdminUser = {
  id: 987654321,
  first_name: 'Админ',
  last_name: 'Пользователь',
  username: 'adminuser',
  telegram_id: 987654321,
  role: 'admin',
  created_at: new Date().toISOString()
};

/**
 * Создаем mock JWT токен для тестирования
 */
function createMockJWT(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    sub: user.id.toString(),
    user_metadata: {
      telegram_id: user.telegram_id,
      telegram_first_name: user.first_name,
      telegram_last_name: user.last_name,
      telegram_username: user.username
    },
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 час
  };

  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Простая подпись для тестирования (в реальности используется Supabase)
  const signature = crypto
    .createHmac('sha256', 'test-secret')
    .update(`${headerBase64}.${payloadBase64}`)
    .digest('base64url');

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * Тестирует извлечение пользователя из JWT токена
 */
function testExtractUserFromToken() {
  console.log('\n🔍 Тестирование извлечения пользователя из токена...\n');
  
  const userToken = createMockJWT(mockTelegramUser);
  const adminToken = createMockJWT(mockAdminUser);
  
  console.log('📝 Mock User JWT Token:');
  console.log(userToken.substring(0, 50) + '...');
  
  console.log('\n📝 Mock Admin JWT Token:');
  console.log(adminToken.substring(0, 50) + '...');
  
  // Тестируем декодирование
  try {
    const userPayload = JSON.parse(
      Buffer.from(userToken.split('.')[1], 'base64url').toString()
    );
    
    console.log('\n✅ User Token Payload:');
    console.log({
      sub: userPayload.sub,
      role: userPayload.role,
      telegram_id: userPayload.user_metadata?.telegram_id,
      first_name: userPayload.user_metadata?.telegram_first_name
    });
    
    const adminPayload = JSON.parse(
      Buffer.from(adminToken.split('.')[1], 'base64url').toString()
    );
    
    console.log('\n✅ Admin Token Payload:');
    console.log({
      sub: adminPayload.sub,
      role: adminPayload.role,
      telegram_id: adminPayload.user_metadata?.telegram_id,
      first_name: adminPayload.user_metadata?.telegram_first_name
    });
    
  } catch (error) {
    console.error('❌ Ошибка декодирования токена:', error.message);
  }
}

/**
 * Тестирует логику проверки маршрутов
 */
function testRouteMatching() {
  console.log('\n🛣️  Тестирование проверки маршрутов...\n');
  
  const publicRoutes = [
    '/',
    '/login',
    '/api/auth/telegram',
    '/api/auth/callback',
    '/public-stats/abc123'
  ];
  
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/channels',
    '/dashboard/posts/new',
    '/api/protected/test'
  ];
  
  const adminRoutes = [
    '/admin',
    '/admin/users',
    '/api/admin/test'
  ];
  
  // Функции проверки маршрутов (копия из middleware)
  function isPublicRoute(pathname) {
    const publicPaths = ['/', '/login', '/api/auth', '/public-stats', '/favicon.ico', '/_next', '/static'];
    return publicPaths.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
  }
  
  function isProtectedRoute(pathname) {
    const protectedPaths = ['/dashboard', '/api/protected'];
    return protectedPaths.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
  }
  
  function isAdminRoute(pathname) {
    const adminPaths = ['/admin', '/api/admin'];
    return adminPaths.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
  }
  
  console.log('✅ Публичные маршруты:');
  publicRoutes.forEach(route => {
    const isPublic = isPublicRoute(route);
    console.log(`  ${isPublic ? '✅' : '❌'} ${route} -> public: ${isPublic}`);
  });
  
  console.log('\n🔐 Защищенные маршруты:');
  protectedRoutes.forEach(route => {
    const isProtected = isProtectedRoute(route);
    console.log(`  ${isProtected ? '✅' : '❌'} ${route} -> protected: ${isProtected}`);
  });
  
  console.log('\n👑 Админские маршруты:');
  adminRoutes.forEach(route => {
    const isAdmin = isAdminRoute(route);
    console.log(`  ${isAdmin ? '✅' : '❌'} ${route} -> admin: ${isAdmin}`);
  });
}

/**
 * Тестирует логику middleware
 */
function testMiddlewareLogic() {
  console.log('\n⚙️  Тестирование логики middleware...\n');
  
  const userToken = createMockJWT(mockTelegramUser);
  const adminToken = createMockJWT(mockAdminUser);
  
  // Симуляция различных запросов
  const testCases = [
    { path: '/', token: null, expected: 'public' },
    { path: '/login', token: null, expected: 'public' },
    { path: '/dashboard', token: null, expected: 'redirect-login' },
    { path: '/dashboard', token: userToken, expected: 'allow' },
    { path: '/dashboard/channels', token: userToken, expected: 'allow' },
    { path: '/admin', token: null, expected: 'redirect-login' },
    { path: '/admin', token: userToken, expected: 'forbidden' },
    { path: '/admin', token: adminToken, expected: 'allow' },
    { path: '/api/protected/test', token: userToken, expected: 'allow' },
    { path: '/api/admin/test', token: userToken, expected: 'forbidden' },
    { path: '/api/admin/test', token: adminToken, expected: 'allow' }
  ];
  
  testCases.forEach(({ path, token, expected }) => {
    let result;
    
    // Публичные маршруты
    if (path === '/' || path === '/login' || path.startsWith('/public-stats')) {
      result = 'public';
    }
    // Нет токена
    else if (!token) {
      result = 'redirect-login';
    }
    // Есть токен
    else {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString()
        );
        
        const isAdmin = payload.role === 'admin';
        
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          result = isAdmin ? 'allow' : 'forbidden';
        } else {
          result = 'allow';
        }
      } catch (error) {
        result = 'invalid-token';
      }
    }
    
    const status = result === expected ? '✅' : '❌';
    console.log(`  ${status} ${path} (token: ${token ? 'yes' : 'no'}) -> ${result} (expected: ${expected})`);
  });
}

/**
 * Главная функция тестирования
 */
function runTests() {
  console.log('🧪 Запуск тестов middleware для TGeasy\n');
  console.log('=' .repeat(60));
  
  testExtractUserFromToken();
  testRouteMatching();
  testMiddlewareLogic();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Тестирование завершено!');
  console.log('\n💡 Для полного тестирования:');
  console.log('   1. Настройте переменные окружения');
  console.log('   2. Запустите приложение: npm run dev');
  console.log('   3. Попробуйте аутентификацию через Telegram');
  console.log('   4. Протестируйте доступ к защищенным маршрутам');
}

// Запуск тестов
runTests(); 