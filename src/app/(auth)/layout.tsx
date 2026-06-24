export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-2xl">Arya IDE</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-lg">
          {children}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Arya IDE. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  )
}
