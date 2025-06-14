import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Проверяем cookies аутентификации
    const userId = cookieStore.get('user_id')?.value
    const telegramId = cookieStore.get('telegram_id')?.value

    if (!userId || !telegramId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Создаем Supabase client для работы с БД
    const supabase = createClient()

    // Получаем данные пользователя из нашей таблицы
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 