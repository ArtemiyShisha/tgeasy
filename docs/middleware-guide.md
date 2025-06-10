# Middleware для защиты маршрутов TGeasy

Система middleware для защиты маршрутов и проверки авторизации в TGeasy.

## 🏗️ Архитектура

### Основные компоненты

1. **`middleware.ts`** - главный Next.js middleware
2. **`lib/auth/middleware.ts`** - логика аутентификации
3. **`lib/auth/permissions.ts`** - система разрешений и ролей
4. **`utils/auth-helpers.ts`** - вспомогательные функции

## 🔒 Защищенные маршруты

### Категории маршрутов

#### Публичные маршруты (без аутентификации)
- `/` - лендинг
- `/login` - страница авторизации
- `/api/auth/*` - endpoints авторизации
- `/public-stats/*` - публичная аналитика
- Статические ресурсы (`/_next/`, `/favicon.ico`, etc.)

#### Защищенные маршруты (требуют аутентификации)
- `/dashboard/*` - основной интерфейс пользователя
- `/api/protected/*` - защищенные API endpoints

#### Админские маршруты (требуют роль admin)
- `/admin/*` - панель администратора
- `/api/admin/*` - админские API endpoints

## 🛡️ Система ролей и разрешений

### Роли пользователей

```typescript
enum UserRole {
  USER = 'user',     // Обычный пользователь
  ADMIN = 'admin'    // Администратор системы
}
```

### Системные разрешения

```typescript
enum SystemPermission {
  // Управление пользователями
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // Управление каналами
  MANAGE_CHANNELS = 'manage_channels',
  CREATE_CHANNELS = 'create_channels',
  VIEW_CHANNELS = 'view_channels',
  
  // Управление размещениями
  CREATE_POSTS = 'create_posts',
  MANAGE_POSTS = 'manage_posts',
  PUBLISH_POSTS = 'publish_posts',
  
  // И другие...
}
```

### Разрешения на уровне канала

```typescript
enum ChannelPermission {
  OWNER = 'owner',      // Владелец канала (все права)
  ADMIN = 'admin',      // Администратор канала
  EDITOR = 'editor',    // Редактор (создание/редактирование постов)
  VIEWER = 'viewer'     // Просмотр (только аналитика)
}
```

## 🔄 Как работает middleware

### 1. Обработка запроса

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Проверяем является ли маршрут публичным
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 2. Для защищенных маршрутов проверяем аутентификацию
  if (isProtectedRoute(pathname) || isAdminRoute(pathname)) {
    const authResult = await authMiddleware(request)
    
    // 3. Перенаправляем неавторизованных на логин
    if (!authResult.isAuthenticated) {
      return NextResponse.redirect('/login?redirect=' + pathname)
    }

    // 4. Проверяем админские права
    if (isAdminRoute(pathname) && !authResult.isAdmin) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // 5. Добавляем информацию о пользователе в headers
    const response = NextResponse.next()
    response.headers.set('x-user-id', authResult.user.id)
    response.headers.set('x-user-role', authResult.user.role)
    return response
  }

  return NextResponse.next()
}
```

### 2. Валидация токена

```typescript
async function validateToken(token: string): Promise<UserSession | null> {
  const supabase = createClient()
  
  // Получаем данные пользователя из JWT токена
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  // Формируем сессию пользователя из metadata
  const userSession: UserSession = {
    id: user.id,
    telegram_id: user.user_metadata.telegram_id,
    role: user.app_metadata.role || 'user',
    // ... другие поля
  }

  return userSession
}
```

## 💻 Использование в API routes

### Базовая проверка аутентификации

```typescript
// app/api/protected/example/route.ts
import { requireAuthInAPI } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthInAPI(request)
    
    return NextResponse.json({
      message: 'Success',
      user: { id: user.id, role: user.role }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}
```

### Проверка админских прав

```typescript
// app/api/admin/example/route.ts
import { requireAdminInAPI } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminInAPI(request)
    
    return NextResponse.json({
      message: 'Admin access granted',
      admin: { id: admin.id, role: admin.role }
    })
  } catch (error) {
    const status = error.message === 'Authentication required' ? 401 : 403
    return NextResponse.json({ error: error.message }, { status })
  }
}
```

### Использование headers (альтернативный способ)

```typescript
import { getUserFromHeaders } from '@/utils/auth-helpers'

export async function GET(request: NextRequest) {
  // Получаем пользователя из headers (установленных middleware)
  const user = getUserFromHeaders(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
```

## 🎯 Проверка разрешений

### Системные разрешения

```typescript
import { hasSystemPermission, UserRole, SystemPermission } from '@/lib/auth/permissions'

// Проверяем может ли пользователь создавать каналы
const canCreateChannels = hasSystemPermission(
  UserRole.USER, 
  SystemPermission.CREATE_CHANNELS
) // true

// Проверяем может ли пользователь управлять пользователями
const canManageUsers = hasSystemPermission(
  UserRole.USER,
  SystemPermission.MANAGE_USERS
) // false
```

### Разрешения канала

```typescript
import { hasChannelPermission, ChannelPermission } from '@/lib/auth/permissions'

// Может ли редактор публиковать посты?
const canPublish = hasChannelPermission(
  ChannelPermission.EDITOR,
  ChannelPermission.VIEWER
) // true (editor > viewer)

// Может ли просматривающий удалять посты?
const canDelete = hasChannelPermission(
  ChannelPermission.VIEWER,
  ChannelPermission.OWNER
) // false (viewer < owner)
```

### Создание объекта разрешений

```typescript
import { createUserPermissions } from '@/lib/auth/permissions'

const channelPermissions = new Map([
  ['channel-1', ChannelPermission.OWNER],
  ['channel-2', ChannelPermission.EDITOR]
])

const permissions = createUserPermissions(
  UserRole.USER,
  'user-id',
  channelPermissions
)

// Использование
permissions.hasSystemPermission(SystemPermission.CREATE_POSTS) // true
permissions.hasChannelPermission('channel-1', ChannelPermission.ADMIN) // true
permissions.canPerformChannelAction('channel-2', 'create_posts') // true
```

## 🧰 Вспомогательные функции

### Создание ответов API

```typescript
import { 
  createApiResponse, 
  createApiErrorResponse,
  createAuthErrorResponse 
} from '@/utils/auth-helpers'

// Успешный ответ
return createApiResponse(
  { message: 'Success', data: result },
  user,
  200
)

// Ошибка API
return createApiErrorResponse(
  'Validation failed',
  'VALIDATION_ERROR',
  400
)

// Ошибка аутентификации
return createAuthErrorResponse(
  'Token expired',
  401
)
```

### Работа с токенами

```typescript
import { 
  extractTokenFromRequest,
  isTokenExpired 
} from '@/utils/auth-helpers'

// Извлечение токена из запроса
const token = extractTokenFromRequest(request)

// Проверка срока действия
if (token && isTokenExpired(token)) {
  // Токен истек
}
```

## 🔧 Конфигурация

### Настройка маршрутов

В `middleware.ts` можно настроить списки маршрутов:

```typescript
// Публичные маршруты
const publicRoutes = [
  '/',
  '/login',
  '/api/auth/telegram',
  '/api/auth/callback',
  // добавьте свои маршруты
]

// Защищенные маршруты
const protectedRoutes = [
  '/dashboard',
  '/api/protected'
]

// Админские маршруты
const adminRoutes = [
  '/admin',
  '/api/admin'
]
```

### Matcher конфигурация

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 🚀 Тестирование

### Тестовые endpoints

Созданы тестовые endpoints для проверки работы:

- `GET /api/protected/test` - проверка аутентификации
- `POST /api/protected/test` - проверка работы с данными
- `GET /api/admin/test` - проверка админских прав
- `POST /api/admin/test` - проверка админских действий

### Пример запроса

```bash
# Запрос к защищенному endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/protected/test

# Запрос к админскому endpoint
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     http://localhost:3000/api/admin/test
```

## 🎯 Следующие шаги

1. **Интеграция с БД** - после создания схемы БД добавить реальные запросы для разрешений каналов
2. **Rate limiting** - добавить ограничения на количество запросов
3. **Session management** - улучшить управление сессиями
4. **Audit logging** - добавить логирование действий пользователей
5. **CSRF protection** - добавить защиту от CSRF атак

## ⚠️ Важные замечания

1. **Security**: Никогда не передавайте чувствительные данные в headers
2. **Performance**: Middleware выполняется на каждом запросе - оптимизируйте проверки
3. **Error handling**: Всегда обрабатывайте ошибки gracefully
4. **Logging**: Логируйте security события для мониторинга
5. **Testing**: Покройте тестами все сценарии аутентификации

Middleware готов к использованию и обеспечивает надежную защиту маршрутов в TGeasy! 🛡️ 