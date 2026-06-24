'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Users, Server, Settings, Shield, Activity, Database } from 'lucide-react'

const mockUsers = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@email.com', role: 'admin', status: 'active', lastLogin: '2 saat önce' },
  { id: '2', name: 'Mehmet Demir', email: 'mehmet@email.com', role: 'user', status: 'active', lastLogin: '5 saat önce' },
  { id: '3', name: 'Ayşe Kaya', email: 'ayse@email.com', role: 'user', status: 'inactive', lastLogin: '3 gün önce' },
  { id: '4', name: 'Fatma Öz', email: 'fatma@email.com', role: 'moderator', status: 'active', lastLogin: '1 saat önce' },
]

const systemStats = [
  { label: 'Aktif Kullanıcılar', value: '124', icon: Users, color: 'text-blue-500' },
  { label: 'Toplam Proje', value: '1,248', icon: Database, color: 'text-violet-500' },
  { label: 'Sunucu Yükü', value: '45%', icon: Server, color: 'text-green-500' },
  { label: 'Uptime', value: '99.9%', icon: Activity, color: 'text-orange-500' },
]

export default function AdminPage() {
  const [users, setUsers] = useState(mockUsers)

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map((u) => u.id === userId ? { ...u, role: newRole } : u))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
        <p className="text-muted-foreground mt-1">
          Sistem yönetimi ve kullanıcı ayarları
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Server className="h-4 w-4" />
            Sistem
          </TabsTrigger>
          <TabsTrigger value="providers" className="gap-2">
            <Settings className="h-4 w-4" />
            Sağlayıcılar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Input placeholder="Kullanıcı ara..." />
            </div>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Aktif' : 'Pasif'}
                      </Badge>
                      <span className="text-sm text-muted-foreground w-24">
                        {user.lastLogin}
                      </span>
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderatör</SelectItem>
                          <SelectItem value="user">Kullanıcı</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon">
                        <Shield className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Durumu</CardTitle>
              <CardDescription>Sistem bileşenlerinin durumu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Veritabanı', status: 'healthy', latency: '12ms' },
                { name: 'Redis', status: 'healthy', latency: '3ms' },
                { name: 'API Sunucusu', status: 'healthy', latency: '45ms' },
                { name: 'Dosya Depolama', status: 'healthy', latency: '89ms' },
                { name: 'AI Servisleri', status: 'healthy', latency: '234ms' },
              ].map((component) => (
                <div key={component.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${component.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{component.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Gecikme: {component.latency}</span>
                    <Badge variant={component.status === 'healthy' ? 'default' : 'destructive'}>
                      {component.status === 'healthy' ? 'Sağlıklı' : 'Hatalı'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sağlayıcı Yapılandırmaları</CardTitle>
              <CardDescription>AI model sağlayıcı ayarlarını yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'OpenAI', status: 'active', models: 3, usage: '85%' },
                { name: 'Anthropic', status: 'active', models: 3, usage: '12%' },
                { name: 'Google', status: 'inactive', models: 2, usage: '3%' },
              ].map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${provider.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{provider.models} model</span>
                    <span className="text-sm text-muted-foreground">Kullanım: {provider.usage}</span>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Yapılandır
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
