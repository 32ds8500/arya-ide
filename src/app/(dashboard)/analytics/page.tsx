'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { BarChart3, TrendingUp, DollarSign, Cpu, MessageSquare, Code } from 'lucide-react'

const stats = [
  { title: 'Toplam Token', value: '12.5M', change: '+18%', icon: Cpu, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  { title: 'Toplam Mesaj', value: '24.8K', change: '+12%', icon: MessageSquare, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { title: 'Kod Üretimi', value: '1.2K', change: '+25%', icon: Code, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { title: 'Toplam Maliyet', value: '$48.50', change: '+8%', icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
]

const modelUsage = [
  { name: 'GPT-4o', tokens: 8500000, cost: 32.50, percentage: 68 },
  { name: 'Claude 3 Opus', tokens: 2800000, cost: 12.00, percentage: 22 },
  { name: 'Gemini Pro', tokens: 1200000, cost: 4.00, percentage: 10 },
]

const dailyUsage = [
  { date: 'Pzt', tokens: 1800000, messages: 3200 },
  { date: 'Sal', tokens: 2100000, messages: 3800 },
  { date: 'Çar', tokens: 1950000, messages: 3500 },
  { date: 'Per', tokens: 2400000, messages: 4200 },
  { date: 'Cum', tokens: 2200000, messages: 4000 },
  { date: 'Cmt', tokens: 1500000, messages: 2800 },
  { date: 'Paz', tokens: 1200000, messages: 2200 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analitik</h1>
          <p className="text-muted-foreground mt-1">
            Kullanım istatistiklerinizi ve maliyetlerinizi görüntüleyin
          </p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Zaman aralığı" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Son 24 saat</SelectItem>
            <SelectItem value="7d">Son 7 gün</SelectItem>
            <SelectItem value="30d">Son 30 gün</SelectItem>
            <SelectItem value="90d">Son 90 gün</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} geçen aya göre
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Kullanım
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-2">
            <Cpu className="h-4 w-4" />
            Model Kullanımı
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Maliyetler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Kullanım</CardTitle>
              <CardDescription>Son 7 günün token ve mesaj kullanımı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyUsage.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="w-8 text-sm text-muted-foreground">{day.date}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{(day.tokens / 1000000).toFixed(1)}M token</span>
                        <span className="text-muted-foreground">{day.messages} mesaj</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${(day.tokens / 2500000) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Kullanım Dağılımı</CardTitle>
              <CardDescription>Her modelin kullanım oranı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modelUsage.map((model) => (
                  <div key={model.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(model.tokens / 1000000).toFixed(1)}M token • ${model.cost.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      %{model.percentage}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maliyet Özeti</CardTitle>
              <CardDescription>Son 30 günün maliyet dağılımı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Toplam Maliyet</p>
                  <p className="text-3xl font-bold mt-1">$48.50</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Ortalama Günlük</p>
                  <p className="text-3xl font-bold mt-1">$1.62</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">En Yüksek Günlük</p>
                  <p className="text-3xl font-bold mt-1">$3.20</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">Tahmini Aylık</p>
                  <p className="text-3xl font-bold mt-1">$145.50</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
