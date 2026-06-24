'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Plus, Search, Grid, List, Folder, MoreVertical, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Project {
  id: string
  name: string
  description: string | null
  template: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function ProjectsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('updated')
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Projeler alınamadı')
        const data = await response.json()
        setProjects(data)
      } catch {
        toast.error('Projeler yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filteredProjects = projects
    .filter((project) => {
      if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (filter === 'public' && !project.isPublic) return false
      if (filter === 'private' && project.isPublic) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projeler</h1>
          <p className="text-muted-foreground mt-1">
            Tüm projelerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Proje
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Proje ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="public">Herkese Açık</SelectItem>
            <SelectItem value="private">Özel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sırala" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Son Güncellenen</SelectItem>
            <SelectItem value="name">İsim</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Folder className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Proje bulunamadı</h3>
          <p className="text-muted-foreground mt-1">
            {search ? 'Arama kriterlerinize uygun proje yok' : 'Henüz bir projeniz yok'}
          </p>
          {!search && (
            <Link href="/projects/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                İlk Projenizi Oluşturun
              </Button>
            </Link>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:border-violet-500/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-violet-500" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || 'Açıklama yok'}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{project.template}</Badge>
                    <Badge variant={project.isPublic ? 'default' : 'outline'}>
                      {project.isPublic ? 'Herkese Açık' : 'Özel'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(project.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-all hover:border-violet-500/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.description || 'Açıklama yok'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{project.template}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
