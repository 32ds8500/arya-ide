import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'
import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { join } from 'path'

const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  'read_file': async (args) => {
    const { path } = args as { path: string }
    if (!path) throw new Error('path gerekli')
    const content = await readFile(path, 'utf-8')
    return { content, path }
  },

  'write_file': async (args) => {
    const { path, content } = args as { path: string; content: string }
    if (!path || content === undefined) throw new Error('path ve content gerekli')
    await writeFile(path, content, 'utf-8')
    return { success: true, path }
  },

  'list_directory': async (args) => {
    const { path } = args as { path: string }
    if (!path) throw new Error('path gerekli')
    const entries = await readdir(path, { withFileTypes: true })
    return entries.map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
    }))
  },

  'file_info': async (args) => {
    const { path } = args as { path: string }
    if (!path) throw new Error('path gerekli')
    const info = await stat(path)
    return {
      path,
      size: info.size,
      isFile: info.isFile(),
      isDirectory: info.isDirectory(),
      modified: info.mtime.toISOString(),
    }
  },

  'execute_command': async (args) => {
    const { command } = args as { command: string }
    if (!command) throw new Error('command gerekli')
    const { execSync } = await import('child_process')
    const output = execSync(command, { encoding: 'utf-8', timeout: 30000 })
    return { output, command }
  },
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { toolName, arguments: toolArgs } = body

    if (!toolName) {
      return NextResponse.json({ error: 'toolName gerekli' }, { status: 400 })
    }

    const handler = toolHandlers[toolName]
    if (!handler) {
      return NextResponse.json({ error: `Bilinmeyen tool: ${toolName}` }, { status: 400 })
    }

    const result = await handler(toolArgs || {})
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tool çalıştırma hatası' },
      { status: 500 }
    )
  }
}
