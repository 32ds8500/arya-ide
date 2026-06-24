import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/db/schema'
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

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.updatedAt))

    return NextResponse.json(userProjects)
  } catch (error) {
    return NextResponse.json({ error: 'Projeler alınırken hata oluştu' }, { status: 500 })
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
    const { name, description, isPublic } = body

    if (!name) {
      return NextResponse.json({ error: 'Proje adı gerekli' }, { status: 400 })
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description,
        isPublic: isPublic ?? false,
        userId: session.user.id,
      })
      .returning()

    return NextResponse.json(newProject[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Proje oluşturulurken hata oluştu' }, { status: 500 })
  }
}
