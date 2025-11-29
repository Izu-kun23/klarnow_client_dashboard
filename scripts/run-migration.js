#!/usr/bin/env node

/**
 * Script to run database migrations via Supabase Management API
 * Usage: node scripts/run-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const projectRef = process.env.SUPABASE_PROJECT_REF || supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', 'create_projects_and_onboarding_tables.sql')

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`)
  process.exit(1)
}

console.log('📄 Reading migration file...')
const sql = fs.readFileSync(migrationFile, 'utf8')

console.log('')
console.log('⚠️  Supabase JS client cannot execute raw SQL directly.')
console.log('')
console.log('📋 To run the migration, you have two options:')
console.log('')
console.log('Option 1: Use Supabase Dashboard (Recommended)')
console.log('─────────────────────────────────────────────')
console.log('1. Open: https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Go to: SQL Editor (left sidebar)')
console.log('4. Click: New query')
console.log('5. Copy the entire contents of the migration file:')
console.log(`   ${migrationFile}`)
console.log('6. Paste into the SQL Editor')
console.log('7. Click: Run (or press Cmd+Enter)')
console.log('')
console.log('Option 2: Use psql (if you have PostgreSQL client)')
console.log('──────────────────────────────────────────────────')
console.log('1. Get your database connection string from Supabase Dashboard')
console.log('2. Go to: Settings > Database > Connection string')
console.log('3. Use the "URI" connection string with psql:')
console.log('')
console.log('   psql "your-connection-string" -f supabase/migrations/create_projects_and_onboarding_tables.sql')
console.log('')
console.log('📄 Migration file location:')
console.log(`   ${migrationFile}`)
console.log('')

// Offer to open the file
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Would you like me to open the migration file for you? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    const { exec } = require('child_process')
    exec(`open "${migrationFile}"`, (error) => {
      if (error) {
        console.log(`\n⚠️  Could not open file automatically. Please open it manually: ${migrationFile}`)
      } else {
        console.log('\n✅ Migration file opened! Copy all contents and paste into Supabase SQL Editor.')
      }
      rl.close()
    })
  } else {
    rl.close()
  }
})
