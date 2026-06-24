import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, search, replace, caseSensitive = false, useRegex = false, replaceAll = false } = body

    if (typeof content !== 'string' || typeof search !== 'string' || typeof replace !== 'string') {
      return NextResponse.json({ error: 'Content, search ve replace gerekli' }, { status: 400 })
    }

    if (!search) {
      return NextResponse.json({ content, count: 0 })
    }

    try {
      const flags = (replaceAll ? 'g' : '') + (caseSensitive ? '' : 'i')
      const regex = useRegex ? new RegExp(search, flags) : new RegExp(escapeRegex(search), flags)

      const newContent = content.replace(regex, replace)
      const count = content.split(regex).length - 1

      return NextResponse.json({ content: newContent, count })
    } catch {
      return NextResponse.json({ error: 'Geçersiz regex' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Değiştirme hatası' }, { status: 500 })
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
