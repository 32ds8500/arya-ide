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
      .select({
        id: files.id,
        name: files.name,
        type: files.type,
        content: files.content,
        size: files.size,
      })
      .from(files)
      .where(eq(files.id, id))
      .limit(1)

    if (file.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      id: file[0].id,
      name: file[0].name,
      type: file[0].type,
      content: file[0].content || '',
      size: file[0].size,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Dosya içeriği alınırken hata oluştu' }, { status: 500 })
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
    const { content } = body

    if (content === undefined) {
      return NextResponse.json({ error: 'İçerik gerekli' }, { status: 400 })
    }

    const size = new TextEncoder().encode(content).length

    const updatedFile = await db
      .update(files)
      .set({
        content,
        size,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(files.id, id))
      .returning()

    if (updatedFile.length === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      size,
      updatedAt: updatedFile[0].updatedAt,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Dosya içeriği güncellenirken hata oluştu' }, { status: 500 })
  }
}
