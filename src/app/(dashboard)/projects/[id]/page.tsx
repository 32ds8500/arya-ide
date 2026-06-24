'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ArrowLeft, Settings, ExternalLink, Folder, File, Clock, GitBranch } from 'lucide-react'

const mockProject = {
  id: '1',
  name: 'E-Ticaret API',
  description: 'Node.js ve Express ile RESTful API geliştirme projesi',
  language: 'TypeScript',
  framework: 'Express.js',
  stars: 12,
  forks: 3,
  isPublic: true,
  createdAt: '2026-01-15',
  updatedAt: '2 saat önce',
  repository: 'https://github.com/user/ecommerce-api',
}

const fileTree = [
  {
    name: 'src',
    type: 'folder',
    children: [
      { name: 'controllers', type: 'folder', children: [
        { name: 'product.controller.ts', type: 'file' },
        { name: 'order.controller.ts', type: 'file' },
        { name: 'user.controller.ts', type: 'file' },
      ]},
      { name: 'models', type: 'folder', children: [
        { name: 'product.model.ts', type: 'file' },
        { name: 'order.model.ts', type: 'file' },
        { name: 'user.model.ts', type: 'file' },
      ]},
      { name: 'routes', type: 'folder', children: [
        { name: 'product.routes.ts', type: 'file' },
        { name: 'order.routes.ts', type: 'file' },
        { name: 'user.routes.ts', type: 'file' },
      ]},
      { name: 'middleware', type: 'folder', children: [
        { name: 'auth.middleware.ts', type: 'file' },
        { name: 'error.middleware.ts', type: 'file' },
      ]},
      { name: 'app.ts', type: 'file' },
      { name: 'server.ts', type: 'file' },
    ],
  },
  { name: 'tests', type: 'folder', children: [
    { name: 'product.test.ts', type: 'file' },
    { name: 'order.test.ts', type: 'file' },
  ]},
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: '.env', type: 'file' },
  { name: 'README.md', type: 'file' },
]

function FileTreeItem({ item, depth = 0 }: { item: any; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {item.type === 'folder' ? (
          <Folder className="h-4 w-4 text-yellow-500" />
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>
      {item.children?.map((child: any) => (
        <FileTreeItem key={child.name} item={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function ProjectDetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{mockProject.name}</h1>
            <Badge variant={mockProject.isPublic ? 'default' : 'outline'}>
              {mockProject.isPublic ? 'Herkese Açık' : 'Özel'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{mockProject.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/editor/${mockProject.id}`}>
            <Button>
              <ExternalLink className="mr-2 h-4 w-4" />
              Düzenleyicide Aç
            </Button>
          </Link>
          <Link href={`/projects/${mockProject.id}/settings`}>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Badge variant="secondary">{mockProject.language}</Badge>
        <Badge variant="secondary">{mockProject.framework}</Badge>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          ⭐ {mockProject.stars}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4" /> {mockProject.forks} fork
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {mockProject.updatedAt}
        </span>
      </div>

      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">Dosyalar</TabsTrigger>
          <TabsTrigger value="recent">Son Dosyalar</TabsTrigger>
          <TabsTrigger value="settings">Proje Ayarları</TabsTrigger>
        </TabsList>
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Dosya Yapısı</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {fileTree.map((item) => (
                  <FileTreeItem key={item.name} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Son Düzenlenen Dosyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['src/controllers/product.controller.ts', 'src/routes/product.routes.ts', 'src/models/product.model.ts'].map(
                  (file) => (
                    <div
                      key={file}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">2 saat önce</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Proje Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proje Adı</label>
                <input
                  type="text"
                  defaultValue={mockProject.name}
                  className="w-full px-3 py-2 rounded-md border bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Açıklama</label>
                <textarea
                  defaultValue={mockProject.description}
                  className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
                />
              </div>
              <Button>Kaydet</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
