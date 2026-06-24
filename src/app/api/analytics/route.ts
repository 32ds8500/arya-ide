import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'
import { db } from '@/lib/db'
import { messages, projects, chats } from '@/db/schema'
import { eq, and, gte, lte, count, sum } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
    }

    // Get message count
    const messageCount = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(chats, eq(messages.chatId, chats.id))
      .where(
        and(
          eq(chats.userId, session.user.id),
          gte(messages.createdAt, startDate.toISOString())
        )
      )

    // Get project count
    const projectCount = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, session.user.id))

    // Get token usage (mock data for demo)
    const tokenUsage = {
      totalTokens: 12500000,
      inputTokens: 8000000,
      outputTokens: 4500000,
      totalCost: 48.50,
    }

    // Get model usage breakdown (mock data)
    const modelUsage = [
      { name: 'GPT-4o', tokens: 8500000, cost: 32.50, percentage: 68 },
      { name: 'Claude 3 Opus', tokens: 2800000, cost: 12.00, percentage: 22 },
      { name: 'Gemini Pro', tokens: 1200000, cost: 4.00, percentage: 10 },
    ]

    // Daily usage (mock data)
    const dailyUsage = [
      { date: 'Pzt', tokens: 1800000, messages: 3200 },
      { date: 'Sal', tokens: 2100000, messages: 3800 },
      { date: 'Çar', tokens: 1950000, messages: 3500 },
      { date: 'Per', tokens: 2400000, messages: 4200 },
      { date: 'Cum', tokens: 2200000, messages: 4000 },
      { date: 'Cmt', tokens: 1500000, messages: 2800 },
      { date: 'Paz', tokens: 1200000, messages: 2200 },
    ]

    return NextResponse.json({
      period,
      summary: {
        totalMessages: messageCount[0]?.count || 0,
        totalProjects: projectCount[0]?.count || 0,
        ...tokenUsage,
      },
      modelUsage,
      dailyUsage,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Analitik verileri alınırken hata oluştu' }, { status: 500 })
  }
}
