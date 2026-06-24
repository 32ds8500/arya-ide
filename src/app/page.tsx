import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Code2, Sparkles, Terminal, Shield, Zap, Globe } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'Yapay Zeka Entegrasyonu',
    description: 'Gelişmiş AI modelleriyle kod üretimi, hata düzeltme ve optimizasyon.',
  },
  {
    icon: Code2,
    title: 'Akıllı Kod Düzenleyici',
    description: 'Monaco tabanlı düzenleyici, sözdizimi vurgulama ve otomatik tamamlama.',
  },
  {
    icon: Terminal,
    title: 'Entegre Terminal',
    description: 'Dahili terminal ile projelerinizi doğrudan tarayıcınızda yönetin.',
  },
  {
    icon: Shield,
    title: 'Güvenli Altyapı',
    description: 'Veri şifreleme ve güvenli oturum yönetimi ile koruma.',
  },
  {
    icon: Zap,
    title: 'Yüksek Performans',
    description: 'Hızlı yükleme ve akıcı kullanıcı deneyimi.',
  },
  {
    icon: Globe,
    title: 'Bulut Entegrasyonu',
    description: 'Projelerinizi bulutta saklayın ve her yerden erişin.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg">Arya IDE</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container flex flex-col items-center justify-center gap-4 py-24 md:py-32 text-center">
          <div className="inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm font-medium">
            <Sparkles className="mr-2 h-4 w-4 text-violet-500" />
            Yapay Zeka Destekli Geliştirme
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
            Kodlama Deneyimini
            <span className="gradient-text"> Yeniden Tanımlıyoruz</span>
          </h1>
          <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
            Arya IDE, yapay zeka destekli araçlarıyla geliştirme sürecinizi hızlandırır.
            Kod üretimi, hata düzeltme ve optimizasyon hepsi tek bir yerde.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                Hemen Başla
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Neden Arya IDE?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Modern geliştirme ihtiyaçlarınızı karşılayan güçlü özellikler.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-6 hover:shadow-lg transition-all hover:border-violet-500/50"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                  <feature.icon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container py-16 md:py-24">
          <div className="rounded-2xl border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-background p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Yapay zeka destekli geliştirme deneyimini keşfedin.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                Dashboard'a Git
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold">Arya IDE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Arya IDE. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
