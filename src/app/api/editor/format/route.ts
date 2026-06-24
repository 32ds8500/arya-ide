import { NextRequest, NextResponse } from 'next/server'

function formatCode(content: string, language: string): string {
  const lines = content.split('\n')
  const formatted: string[] = []
  let indent = 0
  const indentStr = '  '

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      continue
    }

    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indent = Math.max(0, indent - 1)
    }

    formatted.push(indentStr.repeat(indent) + trimmed)

    if (
      trimmed.endsWith('{') ||
      trimmed.endsWith('[') ||
      trimmed.endsWith('(') ||
      trimmed.endsWith(':')
    ) {
      if (!trimmed.startsWith('}') && !trimmed.startsWith(']') && !trimmed.startsWith(')')) {
        indent++
      }
    }
  }

  return formatted.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, language } = body

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content gerekli' }, { status: 400 })
    }

    const formatted = formatCode(content, language || 'plaintext')

    return NextResponse.json({ content: formatted })
  } catch {
    return NextResponse.json({ error: 'Formatlama hatası' }, { status: 500 })
  }
}
