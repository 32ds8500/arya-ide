import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chats } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))

    return NextResponse.json(userChats)
  } catch (error) {
    return NextResponse.json({ error: 'Sohbetler alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const body = await request.json()
    const { title, modelId, providerId, projectId, systemPrompt } = body

    const newChat = await db
      .insert(chats)
      .values({
        title: title || 'Yeni Sohbet',
        modelId: modelId || 'gpt-4',
        providerId: providerId || 'openai',
        projectId: projectId || null,
        userId: userId,
      })
      .returning()

    return NextResponse.json(newChat[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Sohbet oluşturulurken hata oluştu' }, { status: 500 })
  }
}
