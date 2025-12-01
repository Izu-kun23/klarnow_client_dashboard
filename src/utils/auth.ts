import { createHash } from 'crypto'
import { headers } from 'next/headers'

/**
 * Get user email from request headers
 * In mock auth, email is sent in X-User-Email header or Authorization header
 */
export async function getUserFromRequest(): Promise<{ email: string; userId: string } | null> {
  try {
    const headersList = await headers()
    const email = headersList.get('x-user-email') || headersList.get('authorization')?.replace('Bearer ', '')
    
    if (!email) {
      return null
    }

    const emailLower = email.toLowerCase().trim()
    const userId = createHash('sha256').update(emailLower).digest('hex').substring(0, 32)
    
    return { email: emailLower, userId }
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Generate userId from email (consistent hash)
 */
export function getUserIdFromEmail(email: string): string {
  const emailLower = email.toLowerCase().trim()
  return createHash('sha256').update(emailLower).digest('hex').substring(0, 32)
}

