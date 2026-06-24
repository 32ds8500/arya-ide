'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { emailSignUp } from '@/lib/auth-client'

const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

type RegisterInput = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true)
    try {
      const result = await emailSignUp(data.email, data.password, data.name)
      if (result.error) {
        toast.error(result.error.message || 'Kayıt başarısız')
      } else {
        toast.success('Kayıt başarılı! Giriş yapabilirsiniz.')
        router.push('/login')
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
        <h1 className="text-2xl font-bold">Hesap Oluşturun</h1>
        <p className="text-muted-foreground">
          Arya IDE'ye başlamak için bir hesap oluşturun
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">İsim</label>
          <Input
            id="name"
            placeholder="Adınız"
            disabled={isLoading}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
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
            autoComplete="new-password"
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Şifre Tekrar</label>
          <Input
            id="confirmPassword"
            placeholder="••••••••"
            type="password"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Kayıt Ol
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Giriş Yapın
        </Link>
      </div>
    </div>
  )
}
