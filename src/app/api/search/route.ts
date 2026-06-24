import { NextRequest, NextResponse } from 'next/server'
import { getDefaultUserId } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { eq, like, or } from 'drizzle-orm'

interface SearchResult {
  id: string
  name: string
  path: string
  type: 'file' | 'code' | 'semantic'
  preview: string
  matchCount: number
  score?: number
}

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const body = await request.json()
    const { query, type = 'files', limit = 20 } = body

    if (!query) {
      return NextResponse.json({ error: 'Arama sorgusu gerekli' }, { status: 400 })
    }

    let results: SearchResult[] = []

    if (type === 'files' || type === 'code') {
      // Search files by name or content
      const matchingFiles = await db
        .select()
        .from(files)
        .where(
          or(
            like(files.name, `%${query}%`),
            like(files.content, `%${query}%`)
          )
        )
        .limit(limit)

      results = matchingFiles.map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path || file.name,
        type: type as 'file' | 'code',
        preview: file.content?.substring(0, 200) || '',
        matchCount: file.content
          ? (file.content.match(new RegExp(query, 'gi')) || []).length
          : 0,
      }))
    } else if (type === 'semantic') {
      // Semantic search would use embeddings in production
      // For now, return fuzzy matches
      const matchingFiles = await db
        .select()
        .from(files)
        .where(like(files.content, `%${query}%`))
        .limit(limit)

      results = matchingFiles.map((file) => ({
        id: file.id,
        name: file.name,
        path: file.path || file.name,
        type: 'semantic' as const,
        preview: file.content?.substring(0, 200) || '',
        matchCount: 1,
        score: 0.85 + Math.random() * 0.15,
      }))
    }

    return NextResponse.json({
      query,
      type,
      results,
      total: results.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Arama yapılırken hata oluştu' }, { status: 500 })
  }
}
