'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import { Switch as Checkbox } from '@/components/ui/Switch'
import { Plus, Eye, EyeOff, Copy, Trash2, Key } from 'lucide-react'
import { toast } from 'sonner'

const mockApiKeys = [
  {
    id: '1',
    name: 'Geliştirme Ortamı',
    key: 'sk-••••••••••••••••',
    fullKey: 'sk-abcdefghijklmnopqrstuvwxyz123456',
    permissions: ['read', 'write'],
    createdAt: '2026-01-15',
    lastUsed: '2 saat önce',
    active: true,
  },
  {
    id: '2',
    name: 'CI/CD Pipeline',
    key: 'sk-••••••••••••••••',
    fullKey: 'sk-zyxwvutsrqponmlkjihgfedcba654321',
    permissions: ['read'],
    createdAt: '2026-02-20',
    lastUsed: '1 hafta önce',
    active: true,
  },
  {
    id: '3',
    name: 'Test Ortamı',
    key: 'sk-••••••••••••••••',
    fullKey: 'sk-test1234567890abcdefghijklmnop',
    permissions: ['read', 'write', 'delete'],
    createdAt: '2026-03-10',
    lastUsed: '3 gün önce',
    active: false,
  },
]

export default function ApiKeysPage() {
  // toast already imported
  const [apiKeys, setApiKeys] = useState(mockApiKeys)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])
  const [showFullKey, setShowFullKey] = useState<string | null>(null)

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return

    const newKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: 'sk-••••••••••••••••',
      fullKey: `sk-${Math.random().toString(36).substring(2)}`,
      permissions: newKeyPermissions,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Hiçbir zaman',
      active: true,
    }

    setApiKeys([...apiKeys, newKey])
    setShowNewKeyDialog(false)
    setNewKeyName('')
    setNewKeyPermissions(['read'])

    toast('API Anahtarı Oluşturuldu - Yeni API anahtarınız başarıyla oluşturuldu.')
  }

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== keyId))
    toast('API Anahtarı Silindi - API anahtarı başarıyla silindi.')
  }

  const handleToggleKey = (keyId: string) => {
    setApiKeys(apiKeys.map((k) => k.id === keyId ? { ...k, active: !k.active } : k))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('Kopyalandı - API anahtarı panoya kopyalandı.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">API Anahtarları</h1>
          <p className="text-muted-foreground mt-1">
            API anahtarlarınızı yönetin ve izinleri yapılandırın
          </p>
        </div>
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Anahtar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni API Anahtarı Oluştur</DialogTitle>
              <DialogDescription>
                Yeni bir API anahtarı için ad ve izinler belirleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Anahtar Adı</Label>
                <Input
                  placeholder="Örn: Geliştirme Ortamı"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>İzinler</Label>
                <div className="space-y-2">
                  {[
                    { id: 'read', label: 'Okuma' },
                    { id: 'write', label: 'Yazma' },
                    { id: 'delete', label: 'Silme' },
                  ].map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        id={perm.id}
                        checked={newKeyPermissions.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewKeyPermissions([...newKeyPermissions, perm.id])
                          } else {
                            setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm.id))
                          }
                        }}
                      />
                      <label htmlFor={perm.id} className="text-sm">
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateKey}>Oluştur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">{apiKey.name}</span>
                    <Badge variant={apiKey.active ? 'default' : 'secondary'}>
                      {apiKey.active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {showFullKey === apiKey.id ? apiKey.fullKey : apiKey.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowFullKey(showFullKey === apiKey.id ? null : apiKey.id)}
                    >
                      {showFullKey === apiKey.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(apiKey.fullKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {apiKey.permissions.map((perm) => (
                      <Badge key={perm} variant="outline">
                        {perm === 'read' ? 'Okuma' : perm === 'write' ? 'Yazma' : 'Silme'}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Oluşturulma: {apiKey.createdAt} • Son kullanım: {apiKey.lastUsed}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleKey(apiKey.id)}
                  >
                    {apiKey.active ? 'Devre dışı bırak' : 'Etkinleştir'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteKey(apiKey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
