'use client'

import Link from 'next/link'
import { useProjects } from '@/hooks/use-projects'
import { useChats } from '@/hooks/use-chat'
import { useChatStore } from '@/store/chat-store'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Folder, MessageSquare, Cpu, HardDrive, Plus, ArrowUpRight, Loader2, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects({})
  const { data: chatsData, isLoading: chatsLoading } = useChats()
  const chats = useChatStore((s) => s.chats)

  const stats = [
    {
      title: 'Projeler',
      value: projectsLoading ? '...' : String(projectsData?.pagination?.total || 0),
      change: `${projectsData?.data?.length || 0} görünür`,
      icon: Folder,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Sohbetler',
      value: chatsLoading ? '...' : String(chats.length || 0),
      change: 'Aktif sohbetler',
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Durum',
      value: 'Aktif',
      change: 'Sistem çalışıyor',
      icon: Cpu,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Depolama',
      value: 'Veritabanı',
      change: 'PostgreSQL',
      icon: HardDrive,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ]

  const recentProjects = projectsData?.data?.slice(0, 5) || []
  const recentChats = chats.slice(0, 5)

  const quickActions = [
    { title: 'Yeni Proje', href: '/projects/new', icon: Plus },
    { title: 'AI ile Sohbet', href: '/chat', icon: MessageSquare },
    { title: 'Dosya Yöneticisi', href: '/files', icon: Folder },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hoş Geldiniz</h1>
        <p className="text-muted-foreground mt-1">
          Arya IDE'ye hoş geldiniz. İşte bugün için bir özet.
        </p>
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
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Son Projeler</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  Tümünü Gör
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz proje yok</p>
                <Link href="/projects/new">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni Proje Oluştur
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.templateId || 'Genel'}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Son Sohbetler</CardTitle>
                <Link href="/chat">
                  <Button variant="ghost" size="sm">
                    Tümünü Gör
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {chatsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentChats.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz sohbet yok</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChats.map((chat) => (
                    <Link
                      key={chat.id}
                      href="/chat"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">{chat.messageCount} mesaj</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Button variant="outline" className="w-full justify-start">
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.title}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
