'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const templates = [
  { id: 'blank', name: 'Boş', description: 'Sıfırdan başlayın' },
  { id: 'react', name: 'React', description: 'React uygulaması' },
  { id: 'next', name: 'Next.js', description: 'Next.js projesi' },
  { id: 'node', name: 'Node.js', description: 'Node.js backend' },
  { id: 'python', name: 'Python', description: 'Python projesi' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState('blank')
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Proje adı gerekli')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Proje oluşturulamadı')
      }

      const project = await response.json()
      toast.success('Proje oluşturuldu!')
      router.push(`/editor/${project.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Proje</h1>
          <p className="text-muted-foreground mt-1">
            Yeni bir proje oluşturun
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Proje Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Proje Adı *</label>
              <Input
                id="name"
                placeholder="Proje adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Açıklama</label>
              <textarea
                id="description"
                placeholder="Proje açıklaması (isteğe bağlı)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Şablon</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      template === t.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm font-medium">
                Herkese Açık
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Proje Oluştur
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
