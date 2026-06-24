import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chats } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, session.user.id))
      .orderBy(desc(chats.updatedAt))

    return NextResponse.json(userChats)
  } catch (error) {
    return NextResponse.json({ error: 'Sohbetler alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { title, modelId, providerId, projectId, systemPrompt } = body

    const newChat = await db
      .insert(chats)
      .values({
        title: title || 'Yeni Sohbet',
        modelId: modelId || 'gpt-4',
        providerId: providerId || 'openai',
        projectId: projectId || null,
        userId: session.user.id,
      })
      .returning()

    return NextResponse.json(newChat[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Sohbet oluşturulurken hata oluştu' }, { status: 500 })
  }
}
