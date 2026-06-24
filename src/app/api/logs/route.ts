import { NextRequest, NextResponse } from 'next/server'
import { getDefaultUserId } from '@/lib/auth-helper'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
  details?: string
}

// Mock logs for demo
const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '2026-06-20 14:32:15', level: 'info', message: 'Kullanıcı giriş yaptı', source: 'auth', details: 'kullanici@email.com' },
  { id: '2', timestamp: '2026-06-20 14:30:42', level: 'error', message: 'API isteği başarısız oldu', source: 'api', details: '401 Unauthorized' },
  { id: '3', timestamp: '2026-06-20 14:28:18', level: 'warn', message: 'Yüksek token kullanımı tespit edildi', source: 'analytics', details: '12,500 token' },
  { id: '4', timestamp: '2026-06-20 14:25:33', level: 'info', message: 'Yeni proje oluşturuldu', source: 'projects', details: 'E-Ticaret API' },
  { id: '5', timestamp: '2026-06-20 14:22:07', level: 'debug', message: 'WebSocket bağlantısı kuruldu', source: 'websocket', details: 'ws://localhost:3000' },
  { id: '6', timestamp: '2026-06-20 14:18:55', level: 'info', message: 'Dosya yüklendi', source: 'files', details: 'Button.tsx (2.3 KB)' },
  { id: '7', timestamp: '2026-06-20 14:15:22', level: 'error', message: 'Veritabanı bağlantısı kesildi', source: 'database', details: 'Connection timeout' },
  { id: '8', timestamp: '2026-06-20 14:12:41', level: 'info', message: 'AI modeli değiştirildi', source: 'settings', details: 'GPT-4o → Claude 3 Opus' },
]

export async function GET(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredLogs = [...mockLogs]

    // Apply filters
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.level === level)
    }

    if (source && source !== 'all') {
      filteredLogs = filteredLogs.filter((log) => log.source === source)
    }

    if (search) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(search.toLowerCase()) ||
          log.details?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return NextResponse.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Kayıtlar alınırken hata oluştu' }, { status: 500 })
  }
}
