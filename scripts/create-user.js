const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  const email = 'test@gmail.com'
  const password = '12345678'
  const kitType = 'GROWTH'

  try {
    console.log('Creating user...')
    
    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    })

    if (authError) {
      console.error('Error creating user:', authError.message)
      process.exit(1)
    }

    if (!authData.user) {
      console.error('User creation failed - no user data returned')
      process.exit(1)
    }

    console.log('✅ User created successfully:', authData.user.email)
    console.log('User ID:', authData.user.id)

    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Initialize the project
    console.log('Initializing Growth Kit project...')
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: authData.user.id,
        kit_type: kitType,
        onboarding_percent: 0
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError.message)
      process.exit(1)
    }

    console.log('✅ Project created successfully')
    console.log('Project ID:', project.id)

    // Initialize the Growth Kit steps and phases
    console.log('Initializing Growth Kit steps and phases...')
    
    const { error: initError } = await supabase.rpc('initialize_growth_kit_project', {
      p_project_id: project.id
    })

    if (initError) {
      console.error('Error initializing project:', initError.message)
      process.exit(1)
    }

    console.log('✅ Growth Kit project initialized successfully!')
    console.log('\n📋 Login Details:')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Kit Type:', kitType)
    console.log('\nYou can now log in at http://localhost:3000')

  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

createUser()

