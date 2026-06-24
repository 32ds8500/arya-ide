import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'

interface TerminalSession {
  id: string
  projectId: string
  cwd: string
  createdAt: string
  status: 'active' | 'inactive'
}

const activeSessions = new Map<string, TerminalSession>()

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, cwd } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Proje ID gerekli' }, { status: 400 })
    }

    // Create terminal session
    const terminalSession: TerminalSession = {
      id: `term_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      projectId,
      cwd: cwd || '/workspace',
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    activeSessions.set(terminalSession.id, terminalSession)

    // In real app, this would spawn a PTY process
    // using node-pty or similar

    return NextResponse.json({
      success: true,
      session: terminalSession,
      wsUrl: `/ws/terminal/${terminalSession.id}`,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Terminal oturumu oluşturulurken hata oluştu' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const sessions = Array.from(activeSessions.values())

    return NextResponse.json({
      sessions,
      total: sessions.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terminal oturumları alınırken hata oluştu' }, { status: 500 })
  }
}
