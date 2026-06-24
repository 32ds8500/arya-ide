import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { files } from '@/db/schema'
import { getDefaultUserId } from '@/lib/auth-helper'
import { eq } from 'drizzle-orm'

interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
}

function buildTree(dbFiles: Array<{ id: string; name: string; path: string; type: 'file' | 'folder'; parentId: string | null }>): FileTreeNode {
  const map = new Map<string, FileTreeNode>()
  const roots: FileTreeNode[] = []

  for (const f of dbFiles) {
    map.set(f.id, { id: f.id, name: f.name, path: f.path, type: f.type, children: [] })
  }

  for (const f of dbFiles) {
    const node = map.get(f.id)!
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  const clean = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes.map((n) => ({
      ...n,
      children: n.children && n.children.length > 0 ? clean(n.children) : undefined,
    }))

  return { id: 'root', name: '/', path: '/', type: 'folder', children: clean(roots) }
}

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

    const tree = buildTree(
      projectFiles.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        type: f.type as 'file' | 'folder',
        parentId: f.parentId,
      }))
    )

    return NextResponse.json(tree)
  } catch {
    return NextResponse.json({ error: 'Dosya ağacı alınırken hata oluştu' }, { status: 500 })
  }
}
