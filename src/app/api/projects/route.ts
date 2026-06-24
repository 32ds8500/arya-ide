import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt))

    return NextResponse.json({ data: userProjects, total: userProjects.length })
  } catch (error) {
    return NextResponse.json({ error: 'Projeler alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

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
        userId: userId,
      })
      .returning()

    return NextResponse.json(newProject[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Proje oluşturulurken hata oluştu' }, { status: 500 })
  }
}
