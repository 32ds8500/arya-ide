import { NextRequest, NextResponse } from 'next/server'

interface SearchMatch {
  line: number
  column: number
  length: number
  text: string
  lineContent: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, query, caseSensitive = false, useRegex = false } = body

    if (typeof content !== 'string' || typeof query !== 'string' || !query) {
      return NextResponse.json({ error: 'Content ve query gerekli' }, { status: 400 })
    }

    const lines = content.split('\n')
    const matches: SearchMatch[] = []

    let regex: RegExp
    try {
      const flags = caseSensitive ? 'g' : 'gi'
      regex = useRegex ? new RegExp(query, flags) : new RegExp(escapeRegex(query), flags)
    } catch {
      return NextResponse.json({ error: 'Geçersiz regex' }, { status: 400 })
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      let match: RegExpExecArray | null

      regex.lastIndex = 0
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          line: i,
          column: match.index,
          length: match[0].length,
          text: match[0],
          lineContent: line,
        })
        if (match[0].length === 0) break
      }
    }

    return NextResponse.json(matches)
  } catch {
    return NextResponse.json({ error: 'Arama hatası' }, { status: 500 })
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
