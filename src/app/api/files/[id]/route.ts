import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1)

    if (file.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(file[0])
  } catch (error) {
    return NextResponse.json({ error: 'Dosya alınırken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const body = await request.json()
    const { name, content } = body

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (content !== undefined) updateData.content = content

    const updatedFile = await db
      .update(files)
      .set(updateData)
      .where(eq(files.id, id))
      .returning()

    if (updatedFile.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(updatedFile[0])
  } catch (error) {
    return NextResponse.json({ error: 'Dosya güncellenirken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = getDefaultUserId()

    const deletedFile = await db
      .delete(files)
      .where(eq(files.id, id))
      .returning()

    if (deletedFile.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Dosya başarıyla silindi' })
  } catch (error) {
    return NextResponse.json({ error: 'Dosya silinirken hata oluştu' }, { status: 500 })
  }
}
