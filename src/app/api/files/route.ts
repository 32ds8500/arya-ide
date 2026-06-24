import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function GET(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const parentId = searchParams.get('parentId')

    const conditions = []
    if (projectId) conditions.push(eq(files.projectId, projectId))
    if (parentId) conditions.push(eq(files.parentId, parentId))

    let userFiles
    if (conditions.length > 0) {
      userFiles = await db.select().from(files).where(and(...conditions))
    } else {
      userFiles = await db.select().from(files)
    }

    return NextResponse.json(userFiles)
  } catch (error) {
    return NextResponse.json({ error: 'Dosyalar alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const body = await request.json()
    const { name, type, projectId, parentId, content } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Dosya adı ve türü gerekli' }, { status: 400 })
    }

    const newFile = await db
      .insert(files)
      .values({
        name,
        type,
        projectId,
        parentId,
        content,
        path: name,
      })
      .returning()

    return NextResponse.json(newFile[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Dosya oluşturulurken hata oluştu' }, { status: 500 })
  }
}
