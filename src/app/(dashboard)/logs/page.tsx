'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Search, Download, RefreshCw, AlertCircle, Info, AlertTriangle, Bug } from 'lucide-react'

const mockLogs = [
  { id: '1', timestamp: '2026-06-20 14:32:15', level: 'info', message: 'Kullanıcı giriş yaptı', source: 'auth', details: 'kullanici@email.com' },
  { id: '2', timestamp: '2026-06-20 14:30:42', level: 'error', message: 'API isteği başarısız oldu', source: 'api', details: '401 Unauthorized' },
  { id: '3', timestamp: '2026-06-20 14:28:18', level: 'warn', message: 'Yüksek token kullanımı tespit edildi', source: 'analytics', details: '12,500 token' },
  { id: '4', timestamp: '2026-06-20 14:25:33', level: 'info', message: 'Yeni proje oluşturuldu', source: 'projects', details: 'E-Ticaret API' },
  { id: '5', timestamp: '2026-06-20 14:22:07', level: 'debug', message: 'WebSocket bağlantısı kuruldu', source: 'websocket', details: 'ws://localhost:3000' },
  { id: '6', timestamp: '2026-06-20 14:18:55', level: 'info', message: 'Dosya yüklendi', source: 'files', details: 'Button.tsx (2.3 KB)' },
  { id: '7', timestamp: '2026-06-20 14:15:22', level: 'error', message: 'Veritabanı bağlantısı kesildi', source: 'database', details: 'Connection timeout' },
  { id: '8', timestamp: '2026-06-20 14:12:41', level: 'info', message: 'AI modeli değiştirildi', source: 'settings', details: 'GPT-4o → Claude 3 Opus' },
]

const levelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug,
}

const levelColors = {
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
  debug: 'text-gray-500',
}

const levelBadgeColors = {
  info: 'bg-blue-500/10 text-blue-500',
  warn: 'bg-yellow-500/10 text-yellow-500',
  error: 'bg-red-500/10 text-red-500',
  debug: 'bg-gray-500/10 text-gray-500',
}

export default function LogsPage() {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const filteredLogs = mockLogs.filter((log) => {
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false
    return true
  })

  const handleExport = () => {
    const csv = filteredLogs.map((log) => 
      `${log.timestamp},${log.level},${log.source},${log.message},${log.details}`
    ).join('\n')
    const header = 'timestamp,level,source,message,details\n'
    const blob = new Blob([header + csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logs.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kayıtlar</h1>
          <p className="text-muted-foreground mt-1">
            Sistem kayıtlarını görüntüleyin ve filtreleyin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kayıt ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Düzey" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Düzeyler</SelectItem>
            <SelectItem value="info">Bilgi</SelectItem>
            <SelectItem value="warn">Uyarı</SelectItem>
            <SelectItem value="error">Hata</SelectItem>
            <SelectItem value="debug">Hata Ayıklama</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Kaynak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kaynaklar</SelectItem>
            <SelectItem value="auth">Kimlik Doğrulama</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="database">Veritabanı</SelectItem>
            <SelectItem value="files">Dosyalar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const Icon = levelIcons[log.level as keyof typeof levelIcons]
                return (
                  <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-muted/50">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${levelColors[log.level as keyof typeof levelColors]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${levelBadgeColors[log.level as keyof typeof levelBadgeColors]} border-0`}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{log.source}</Badge>
                        <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <p className="mt-1">{log.message}</p>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">{log.details}</p>
                    </div>
                  </div>
                )
              })}
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Kayıt bulunamadı
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
