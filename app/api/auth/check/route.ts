import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/check
 * Проверка статуса авторизации пользователя по Telegram ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegram_id')
    const state = searchParams.get('state')

    if (!telegramId || !state) {
      return NextResponse.json({ 
        authorized: false, 
        error: 'Missing telegram_id or state' 
      })
    }

    const supabase = createClient()

    // Проверяем существует ли пользователь
    const { data: user, error } = await supabase
      .from('users')
      .select('id, telegram_first_name, created_at')
      .eq('telegram_id', parseInt(telegramId))
      .single()

    if (error || !user) {
      return NextResponse.json({ 
        authorized: false, 
        error: 'User not found' 
      })
    }

    // Если пользователь найден, создаем сессию
    const response = NextResponse.json({ 
      authorized: true, 
      user: {
        id: user.id,
        name: user.telegram_first_name,
        telegram_id: telegramId
      }
    })

    // Устанавливаем cookies для сессии
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    response.cookies.set('telegram_id', telegramId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    return response

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ 
      authorized: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 