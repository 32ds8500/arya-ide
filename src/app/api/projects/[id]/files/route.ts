import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { getDefaultUserId } from '@/lib/auth-helper'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getDefaultUserId()

    const { id } = await params

    const projectFiles = await db
      .select()
      .from(files)
      .where(eq(files.projectId, id))

    return NextResponse.json(projectFiles)
  } catch {
    return NextResponse.json({ error: 'Dosyalar alınırken hata oluştu' }, { status: 500 })
  }
}
