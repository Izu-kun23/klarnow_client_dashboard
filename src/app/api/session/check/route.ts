import { NextResponse } from 'next/server'

// This endpoint returns a server session ID that changes on server restart
// We generate a new ID on each server start by using a timestamp
// In production, you might want to use an environment variable that changes on deploy
let SERVER_SESSION_ID: string | null = null

function getServerSessionId(): string {
  if (!SERVER_SESSION_ID) {
    // Generate a new session ID on first call (server start)
    SERVER_SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
  return SERVER_SESSION_ID
}

export async function GET() {
  return NextResponse.json({ 
    sessionId: getServerSessionId(),
    timestamp: Date.now()
  })
}
