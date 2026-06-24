import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chats, messages } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const chat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .limit(1)

    if (chat.length === 0) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(desc(messages.createdAt))

    return NextResponse.json({
      ...chat[0],
      messages: chatMessages,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sohbet alınırken hata oluştu' }, { status: 500 })
  }
}
