import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { messages, chats } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, id))
      .orderBy(messages.createdAt)

    return NextResponse.json(chatMessages)
  } catch (error) {
    return NextResponse.json({ error: 'Mesajlar alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { content, role } = body

    if (!content) {
      return NextResponse.json({ error: 'Mesaj içeriği gerekli' }, { status: 400 })
    }

    // Verify chat exists and belongs to user
    const chat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id))
      .limit(1)

    if (chat.length === 0) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    // Create user message
    const newMessage = await db
      .insert(messages)
      .values({
        chatId: id,
        content,
        role: role || 'user',
      })
      .returning()

    // Update chat timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(chats.id, id))

    // Generate AI response (simplified)
    const aiResponse = await db
      .insert(messages)
      .values({
        chatId: id,
        content: 'Bu bir örnek AI yanıtıdır. Gerçek uygulamada AI SDK kullanılacaktır.',
        role: 'assistant',
      })
      .returning()

    return NextResponse.json({
      userMessage: newMessage[0],
      assistantMessage: aiResponse[0],
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Mesaj gönderilirken hata oluştu' }, { status: 500 })
  }
}
