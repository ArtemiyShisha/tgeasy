import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json({ 
        authorized: false, 
        error: 'State parameter is required' 
      }, { status: 400 })
    }

    const supabase = createClient()

    // Ищем пользователя по auth_state
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_state', state)
      .eq('auth_completed', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ 
        authorized: false,
        error: 'User not found or authorization not completed'
      })
    }

    // Проверяем что авторизация не старше 10 минут
    if (user.updated_at) {
      const authTime = new Date(user.updated_at).getTime()
      const now = Date.now()
      const timeDiff = now - authTime

      if (timeDiff > 10 * 60 * 1000) { // 10 минут
        return NextResponse.json({ 
          authorized: false,
          error: 'Authorization expired'
        })
      }
    }

    // Формируем имя пользователя из доступных полей
    const displayName = user.telegram_first_name 
      ? `${user.telegram_first_name}${user.telegram_last_name ? ' ' + user.telegram_last_name : ''}`
      : user.telegram_username || 'Пользователь'

    return NextResponse.json({
      authorized: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        name: displayName
      }
    })

  } catch (error) {
    console.error('Check status error:', error)
    return NextResponse.json({ 
      authorized: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 