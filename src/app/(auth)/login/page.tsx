'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, Github, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import { emailSignIn, socialSignIn } from '@/lib/auth-client'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})

type LoginInput = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const result = await emailSignIn(data.email, data.password)
      if (result.error) {
        toast.error(result.error.message || 'Giriş başarısız')
      } else {
        toast.success('Giriş başarılı!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Hoş Geldiniz</h1>
        <p className="text-muted-foreground">
          Devam etmek için hesabınıza giriş yapın
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            disabled={isGitHubLoading || isGoogleLoading}
            onClick={async () => {
              setIsGitHubLoading(true)
              try {
                await socialSignIn('github')
              } catch {
                toast.error('GitHub giriş hatası')
              } finally {
                setIsGitHubLoading(false)
              }
            }}
          >
            {isGitHubLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
          <Button
            variant="outline"
            disabled={isGitHubLoading || isGoogleLoading}
            onClick={async () => {
              setIsGoogleLoading(true)
              try {
                await socialSignIn('google')
              } catch {
                toast.error('Google giriş hatası')
              } finally {
                setIsGoogleLoading(false)
              }
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Chrome className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              veya e-posta ile devam edin
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">E-posta</label>
            <Input
              id="email"
              placeholder="ornek@email.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Şifre</label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Şifremi unuttum
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Giriş Yap
          </Button>
        </form>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Hesabınız yok mu? </span>
        <Link href="/register" className="text-primary hover:underline font-medium">
          Kayıt Olun
        </Link>
      </div>
    </div>
  )
}
