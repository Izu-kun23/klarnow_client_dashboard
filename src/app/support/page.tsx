import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="mt-2 text-gray-600">Messages, Looms and updates from the Klarnow team.</p>
        <p className="mt-4 text-gray-500">Support features coming soon...</p>
      </div>
    </div>
  )
}

