'use client'

import { useEffect } from 'react'
import FileManager from '@/components/files/FileManager'
import { useFileStore } from '@/store/file-store'

const mockFiles = [
  {
    id: '1',
    name: 'src',
    path: '/src',
    type: 'directory' as const,
    size: 0,
    depth: 0,
    children: [
      {
        id: '1-1',
        name: 'components',
        path: '/src/components',
        type: 'directory' as const,
        size: 0,
        depth: 1,
        children: [
          { id: '1-1-1', name: 'Button.tsx', path: '/src/components/Button.tsx', type: 'file' as const, size: 1024, depth: 2 },
          { id: '1-1-2', name: 'Header.tsx', path: '/src/components/Header.tsx', type: 'file' as const, size: 2048, depth: 2 },
        ],
      },
      {
        id: '1-2',
        name: 'utils',
        path: '/src/utils',
        type: 'directory' as const,
        size: 0,
        depth: 1,
        children: [
          { id: '1-2-1', name: 'helpers.ts', path: '/src/utils/helpers.ts', type: 'file' as const, size: 512, depth: 2 },
        ],
      },
      { id: '1-3', name: 'index.ts', path: '/src/index.ts', type: 'file' as const, size: 256, depth: 1 },
    ],
  },
  {
    id: '2',
    name: 'public',
    path: '/public',
    type: 'directory' as const,
    size: 0,
    depth: 0,
    children: [
      { id: '2-1', name: 'favicon.ico', path: '/public/favicon.ico', type: 'file' as const, size: 4096, depth: 1 },
    ],
  },
  { id: '3', name: 'package.json', path: '/package.json', type: 'file' as const, size: 1024, depth: 0 },
  { id: '4', name: 'tsconfig.json', path: '/tsconfig.json', type: 'file' as const, size: 512, depth: 0 },
  { id: '5', name: 'README.md', path: '/README.md', type: 'file' as const, size: 2048, depth: 0 },
]

export default function FilesPage() {
  const { setFileTree, setFiles } = useFileStore()

  useEffect(() => {
    setFiles(mockFiles as any)
    const tree = {
      id: 'root',
      name: 'Proje',
      path: '/',
      type: 'directory' as const,
      size: 0,
      children: mockFiles,
      depth: 0,
    }
    setFileTree(tree)
  }, [setFileTree, setFiles])

  return (
    <div className="h-[calc(100vh-64px)]">
      <FileManager
        projectId="default"
        initialFiles={mockFiles}
      />
    </div>
  )
}
