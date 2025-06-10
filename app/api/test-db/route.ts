import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)
    console.log('Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)

    // Тест с ANON ключом
    console.log('\n--- Testing with ANON key ---')
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('users')
      .select('*')
      .limit(1)

    if (anonError) {
      console.error('ANON key error:', {
        message: anonError.message,
        details: anonError.details,
        hint: anonError.hint,
        code: anonError.code
      })
    } else {
      console.log('ANON key works! Found', anonTest?.length, 'users')
    }

    // Тест с SERVICE ROLE ключом
    console.log('\n--- Testing with SERVICE ROLE key ---')
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: serviceTest, error: serviceError } = await supabaseService
      .from('users')
      .select('*')
      .limit(1)

    if (serviceError) {
      console.error('SERVICE ROLE key error:', {
        message: serviceError.message,
        details: serviceError.details,
        hint: serviceError.hint,
        code: serviceError.code
      })
    } else {
      console.log('SERVICE ROLE key works! Found', serviceTest?.length, 'users')
    }

    return NextResponse.json({
      success: true,
      results: {
        anonKey: {
          works: !anonError,
          error: anonError?.message,
          dataCount: anonTest?.length || 0
        },
        serviceRoleKey: {
          works: !serviceError,
          error: serviceError?.message,
          dataCount: serviceTest?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 