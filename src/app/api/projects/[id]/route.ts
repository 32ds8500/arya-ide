import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)

    if (project.length === 0) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(project[0])
  } catch (error) {
    return NextResponse.json({ error: 'Proje alınırken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const body = await request.json()
    const { name, description, isPublic } = body

    const updatedProject = await db
      .update(projects)
      .set({
        name,
        description,
        isPublic,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .returning()

    if (updatedProject.length === 0) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(updatedProject[0])
  } catch (error) {
    return NextResponse.json({ error: 'Proje güncellenirken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning()

    if (deletedProject.length === 0) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Proje başarıyla silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Proje silinirken hata oluştu' }, { status: 500 })
  }
}
