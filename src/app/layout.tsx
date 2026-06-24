import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arya IDE',
  description: 'Yapay zeka destekli entegre geliştirme ortamı',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="font-sans antialiased" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
