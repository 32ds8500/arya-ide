'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Switch } from '@/components/ui/Switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    language: 'tr',
    fontSize: '14',
    theme: 'dark',
    autoSave: true,
    minimap: false,
    wordWrap: 'on',
    tabSize: '2',
    formatOnSave: true,
    bracketPairColorization: true,
  })

  const handleSave = () => {
    // Save settings
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Uygulama ve hesap ayarlarınızı yönetin
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto gap-2">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="shortcuts">Kısayollar</TabsTrigger>
          <TabsTrigger value="models">AI Modelleri</TabsTrigger>
          <TabsTrigger value="account">Hesap</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Uygulama genel ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Dil</Label>
                <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">İngilizce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Otomatik Kaydetme</Label>
                  <p className="text-sm text-muted-foreground">Dosyaları otomatik olarak kaydet</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(v) => setSettings({ ...settings, autoSave: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bildirimler</Label>
                  <p className="text-sm text-muted-foreground">E-posta bildirimleri al</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor Ayarları</CardTitle>
              <CardDescription>Kod düzenleyici ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yazı Tipi Boyutu</Label>
                  <Select value={settings.fontSize} onValueChange={(v) => setSettings({ ...settings, fontSize: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tab Boyutu</Label>
                  <Select value={settings.tabSize} onValueChange={(v) => setSettings({ ...settings, tabSize: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 boşluk</SelectItem>
                      <SelectItem value="4">4 boşluk</SelectItem>
                      <SelectItem value="tab">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mini Harita</Label>
                  <p className="text-sm text-muted-foreground">Kod mini haritasını göster</p>
                </div>
                <Switch
                  checked={settings.minimap}
                  onCheckedChange={(v) => setSettings({ ...settings, minimap: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sözcük Kaydırma</Label>
                  <p className="text-sm text-muted-foreground">Uzun satırları kaydır</p>
                </div>
                <Switch
                  checked={settings.wordWrap === 'on'}
                  onCheckedChange={(v) => setSettings({ ...settings, wordWrap: v ? 'on' : 'off' })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Kaydette Biçimlendir</Label>
                  <p className="text-sm text-muted-foreground">Kaydettiğinde otomatik biçimlendir</p>
                </div>
                <Switch
                  checked={settings.formatOnSave}
                  onCheckedChange={(v) => setSettings({ ...settings, formatOnSave: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Parantez Çifti Renklendirme</Label>
                  <p className="text-sm text-muted-foreground">Parantez çiftlerini renklendir</p>
                </div>
                <Switch
                  checked={settings.bracketPairColorization}
                  onCheckedChange={(v) => setSettings({ ...settings, bracketPairColorization: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema Ayarları</CardTitle>
              <CardDescription>Uygulama temasını özelleştirin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select value={settings.theme} onValueChange={(v) => setSettings({ ...settings, theme: v })}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Açık</SelectItem>
                    <SelectItem value="dark">Koyu</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Renk Şeması</Label>
                <div className="grid grid-cols-5 gap-2">
                  {['violet', 'blue', 'green', 'orange', 'red'].map((color) => (
                    <button
                      key={color}
                      className={`h-12 rounded-lg border-2 ${
                        settings.theme === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: `var(--${color}-500)` }}
                      onClick={() => setSettings({ ...settings, theme: color })}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kısayol Tuşları</CardTitle>
              <CardDescription>Klavye kısayollarını özelleştirin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Kaydet', shortcut: 'Ctrl+S' },
                  { action: 'Geri Al', shortcut: 'Ctrl+Z' },
                  { action: 'İleri Al', shortcut: 'Ctrl+Y' },
                  { action: 'Bul', shortcut: 'Ctrl+F' },
                  { action: 'Değiştir', shortcut: 'Ctrl+H' },
                  { action: 'Terminal Aç', shortcut: 'Ctrl+`' },
                  { action: 'Dosya Aç', shortcut: 'Ctrl+O' },
                ].map((item) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <span>{item.action}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Ayarları</CardTitle>
              <CardDescription>Yapay zeka modeli tercihlerini yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Varsayılan Model</Label>
                <Select defaultValue="gpt-4">
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo (OpenAI)</SelectItem>
                    <SelectItem value="claude-3">Claude 3 Opus (Anthropic)</SelectItem>
                    <SelectItem value="gemini">Gemini Pro (Google)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input type="number" defaultValue="0.7" min="0" max="2" step="0.1" />
                <p className="text-sm text-muted-foreground">
                  Daha düşük değerler daha tutarlı, daha yüksek değerler daha yaratıcı sonuçlar verir
                </p>
              </div>
              <div className="space-y-2">
                <Label>Maksimum Token</Label>
                <Input type="number" defaultValue="4096" min="256" max="128000" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hesap Ayarları</CardTitle>
              <CardDescription>Hesap bilgilerinizi yönetin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" defaultValue="kullanici@email.com" disabled />
              </div>
              <div className="space-y-2">
                <Label>Kullanıcı Adı</Label>
                <Input defaultValue="kullanici" />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Tema Tercihi</Label>
                <div className="flex items-center gap-4">
                  <Button variant="outline">Şifre Değiştir</Button>
                  <Button variant="destructive">Hesabı Sil</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Kaydet</Button>
      </div>
    </div>
  )
}
