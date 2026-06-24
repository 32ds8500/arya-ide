import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)

    return NextResponse.json(allUsers)
  } catch (error) {
    return NextResponse.json({ error: 'Kullanıcılar alınırken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'Kullanıcı ID ve rol gerekli' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'moderator', 'user']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }

    const updatedUser = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning()

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Kullanıcı güncellenirken hata oluştu' }, { status: 500 })
  }
}
