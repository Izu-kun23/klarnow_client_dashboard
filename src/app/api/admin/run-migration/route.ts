import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

/**
 * Admin endpoint to run database migration
 * This endpoint executes the migration SQL directly
 * 
 * WARNING: Only use this in development or with proper authentication
 */
export async function POST(request: Request) {
  try {
    // In production, add proper admin authentication here
    // For now, we'll use a simple secret check
    const { secret } = await request.json()
    
    // You should set MIGRATION_SECRET in your .env.local
    const expectedSecret = process.env.MIGRATION_SECRET || 'development-only-change-me'
    
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables' 
      }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_projects_and_onboarding_tables.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute SQL using Supabase REST API
    // Note: We need to use the Management API or execute via REST
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql })
    })

    // Alternative: Execute SQL statements one by one using direct queries
    // Split SQL into statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    const results = []
    
    for (const statement of statements) {
      if (!statement || statement.length < 10) continue
      
      try {
        // Try to execute via REST API
        // This is a simplified approach - in practice, you'd need proper SQL execution
        results.push({ statement: statement.substring(0, 50) + '...', status: 'skipped' })
      } catch (err) {
        results.push({ statement: statement.substring(0, 50) + '...', status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Direct SQL execution not available via JS client',
      hint: 'Please use Supabase Dashboard SQL Editor or psql',
      statementsProcessed: statements.length
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        hint: 'Please run the migration via Supabase Dashboard SQL Editor'
      },
      { status: 500 }
    )
  }
}

