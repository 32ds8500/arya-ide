'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Separator } from '@/components/ui/Separator'
import { Upload, Camera, Shield, Laptop, Smartphone, Globe } from 'lucide-react'

export default function ProfilePage() {
  const [avatar, setAvatar] = useState('/avatars/default.png')

  const handleAvatarUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files[0]) {
        const url = URL.createObjectURL(target.files[0])
        setAvatar(url)
      }
    }
    input.click()
  }

  const sessions = [
    { id: '1', device: 'Chrome - Windows', location: 'İstanbul, Türkiye', lastActive: 'Şimdi', current: true },
    { id: '2', device: 'Safari - macOS', location: 'İstanbul, Türkiye', lastActive: '2 saat önce', current: false },
    { id: '3', device: 'Firefox - Ubuntu', location: 'Ankara, Türkiye', lastActive: '3 gün önce', current: false },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground mt-1">
          Profil bilgilerinizi ve oturumlarınızı yönetin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Fotoğrafı</CardTitle>
          <CardDescription>Profil fotoğrafınızı güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatar} />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" onClick={handleAvatarUpload}>
                <Camera className="mr-2 h-4 w-4" />
                Fotoğraf Yükle
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, PNG veya GIF. Maksimum 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kişisel Bilgiler</CardTitle>
          <CardDescription>Temel profil bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>İsim</Label>
              <Input defaultValue="Kullanıcı" />
            </div>
            <div className="space-y-2">
              <Label>Soyisim</Label>
              <Input defaultValue="Adı" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>E-posta</Label>
            <Input type="email" defaultValue="kullanici@email.com" disabled />
          </div>
          <div className="space-y-2">
            <Label>Kullanıcı Adı</Label>
            <Input defaultValue="kullanici" />
          </div>
          <div className="space-y-2">
            <Label>Biyografi</Label>
            <textarea
              className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
              defaultValue="Yazılım geliştirici ve teknoloji meraklısı"
            />
          </div>
          <Button>Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
          <CardDescription>Hesabınızın güvenliğini koruyun</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mevcut Şifre</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Yeni Şifre</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Yeni Şifre Tekrar</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button>Şifreyi Güncelle</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oturumlar</CardTitle>
          <CardDescription>Aktif oturumlarınızı görüntüleyin ve yönetin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {session.device.includes('Chrome') || session.device.includes('Firefox') ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : session.device.includes('Safari') ? (
                  <Laptop className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">{session.device}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.current ? (
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <Shield className="h-4 w-4" />
                    Bu oturum
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" className="text-destructive">
                    Sonlandır
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
