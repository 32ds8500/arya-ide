'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/Resizable'
import {
  Folder,
  File,
  X,
  Plus,
  Terminal,
  PanelLeft,
  PanelBottom,
  Save,
  Undo,
  Redo,
  Search,
  Settings,
} from 'lucide-react'

const mockFiles = [
  { id: '1', name: 'index.tsx', content: 'export default function Home() {\n  return (\n    <div>\n      <h1>Arya IDE</h1>\n    </div>\n  )\n}' },
  { id: '2', name: 'App.tsx', content: 'import { Home } from "./index"\n\nexport function App() {\n  return <Home />\n}' },
  { id: '3', name: 'styles.css', content: 'body {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}' },
]

const fileTree = [
  { name: 'src', type: 'folder', children: [
    { name: 'components', type: 'folder', children: [
      { name: 'Button.tsx', type: 'file' },
      { name: 'Card.tsx', type: 'file' },
    ]},
    { name: 'pages', type: 'folder', children: [
      { name: 'index.tsx', type: 'file' },
      { name: 'about.tsx', type: 'file' },
    ]},
    { name: 'styles', type: 'folder', children: [
      { name: 'globals.css', type: 'file' },
    ]},
  ]},
  { name: 'public', type: 'folder', children: [
    { name: 'logo.svg', type: 'file' },
  ]},
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
]

function FileTreeItem({ item, depth = 0, onOpenFile }: { item: any; depth?: number; onOpenFile: (name: string) => void }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => item.type === 'file' && onOpenFile(item.name)}
      >
        {item.type === 'folder' ? (
          <Folder className="h-4 w-4 text-yellow-500 shrink-0" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {item.children?.map((child: any) => (
        <FileTreeItem key={child.name} item={child} depth={depth + 1} onOpenFile={onOpenFile} />
      ))}
    </div>
  )
}

export default function EditorPage() {
  const [openFiles, setOpenFiles] = useState(mockFiles)
  const [activeFile, setActiveFile] = useState(mockFiles[0])
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTerminal, setShowTerminal] = useState(true)

  const handleOpenFile = (fileName: string) => {
    const existing = openFiles.find((f) => f.name === fileName)
    if (existing) {
      setActiveFile(existing)
    } else {
      const newFile = { id: String(Date.now()), name: fileName, content: '' }
      setOpenFiles([...openFiles, newFile])
      setActiveFile(newFile)
    }
  }

  const handleCloseFile = (fileId: string) => {
    const newFiles = openFiles.filter((f) => f.id !== fileId)
    setOpenFiles(newFiles)
    if (activeFile.id === fileId && newFiles.length > 0) {
      setActiveFile(newFiles[0])
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
            <PanelLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowTerminal(!showTerminal)}>
            <Terminal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={showTerminal ? 60 : 100}>
          <ResizablePanelGroup direction="horizontal">
            {showSidebar && (
              <>
                <ResizablePanel defaultSize={20} minSize={15}>
                  <div className="h-full border-r">
                    <div className="p-2 border-b font-medium text-sm">Dosyalar</div>
                    <ScrollArea className="h-[calc(100%-2.5rem)]">
                      {fileTree.map((item) => (
                        <FileTreeItem key={item.name} item={item} onOpenFile={handleOpenFile} />
                      ))}
                    </ScrollArea>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            <ResizablePanel defaultSize={80}>
              <div className="h-full flex flex-col">
                <div className="flex items-center border-b">
                  <div className="flex overflow-x-auto">
                    {openFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 px-4 py-2 border-r cursor-pointer whitespace-nowrap text-sm ${
                          activeFile.id === file.id ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveFile(file)}
                      >
                        <File className="h-3 w-3" />
                        {file.name}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCloseFile(file.id)
                          }}
                          className="ml-1 hover:bg-muted rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="px-3 py-2 hover:bg-muted/50"
                      onClick={() => handleOpenFile('new-file.tsx')}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                  <pre className="whitespace-pre-wrap">{activeFile.content}</pre>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {showTerminal && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full flex flex-col bg-zinc-950 text-green-400">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                  <span className="text-sm font-medium">Terminal</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                    onClick={() => setShowTerminal(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                  <div className="text-zinc-500">~/aryide $</div>
                  <div className="mt-2 text-green-400">Proje başarıyla yüklendi.</div>
                  <div className="mt-4 text-zinc-500">~/aryide $</div>
                </div>
                <div className="border-t border-zinc-800 p-2">
                  <input
                    type="text"
                    placeholder="Komut girin..."
                    className="w-full bg-transparent border-none outline-none font-mono text-sm text-green-400 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
