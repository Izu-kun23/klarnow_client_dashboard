const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
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
    console.log('🔐 Creating user account...')
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)
    
    let userId
    
    if (existingUser) {
      console.log('⚠️  User already exists, using existing user...')
      userId = existingUser.id
    } else {
      // Create the user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true // Auto-confirm email
      })

      if (authError) {
        console.error('❌ Error creating user:', authError.message)
        process.exit(1)
      }

      if (!authData.user) {
        console.error('❌ User creation failed - no user data returned')
        process.exit(1)
      }

      console.log('✅ User created successfully:', authData.user.email)
      userId = authData.user.id
    }

    console.log('User ID:', userId)

    // Check if projects table exists
    const { error: tableCheckError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.error('\n❌ Database schema not set up!')
      console.error('Please run the SQL schema in your Supabase dashboard:')
      console.error('1. Go to your Supabase project')
      console.error('2. Open SQL Editor')
      console.error('3. Copy and paste the contents of supabase/schema.sql')
      console.error('4. Run the SQL script')
      console.error('\nAfter running the schema, you can:')
      console.error('- Log in at http://localhost:3000')
      console.error('- The project will be created automatically when you log in')
      process.exit(1)
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if project already exists
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('kit_type', kitType)
      .single()

    if (existingProject) {
      console.log('⚠️  Project already exists for this user and kit type')
      console.log('Project ID:', existingProject.id)
    } else {
      // Initialize the project
      console.log('\n📦 Initializing Growth Kit project...')
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          kit_type: kitType,
          onboarding_percent: 0
        })
        .select()
        .single()

      if (projectError) {
        console.error('❌ Error creating project:', projectError.message)
        process.exit(1)
      }

      console.log('✅ Project created successfully')
      console.log('Project ID:', project.id)

      // Initialize the Growth Kit steps and phases
      console.log('🔧 Initializing Growth Kit steps and phases...')
      
      const { error: initError } = await supabase.rpc('initialize_growth_kit_project', {
        p_project_id: project.id
      })

      if (initError) {
        console.error('❌ Error initializing project:', initError.message)
        console.error('Make sure the initialize_growth_kit_project function exists in your database')
        process.exit(1)
      }

      console.log('✅ Growth Kit project initialized successfully!')
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ SETUP COMPLETE!')
    console.log('='.repeat(50))
    console.log('\n📋 Login Details:')
    console.log('   Email:    ', email)
    console.log('   Password: ', password)
    console.log('   Kit Type: ', kitType)
    console.log('\n🌐 You can now log in at: http://localhost:3000')
    console.log('\n')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

createUser()

