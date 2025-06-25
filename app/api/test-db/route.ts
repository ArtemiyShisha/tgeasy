import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    
    console.log('Environment check:', envCheck)
    
    if (!envCheck.supabaseUrl || !envCheck.serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck
      }, { status: 500 })
    }
    
    // Create client
    const supabase = createAdminClient()
    
    // Test simple query
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersError) {
      console.error('Users query error:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query users table',
        details: usersError
      }, { status: 500 })
    }
    
    // Test posts query
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title')
      .limit(1)
    
    if (postsError) {
      console.error('Posts query error:', postsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query posts table',
        details: postsError
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        usersCount: users?.length || 0,
        postsCount: posts?.length || 0,
        envCheck
      }
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 