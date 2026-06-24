'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2, ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
})

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSuccess(true)
      toast.success('Şifre sıfırlama bağlantısı gönderildi!')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">E-posta Gönderildi</h1>
          <p className="text-muted-foreground">
            Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Giriş sayfasına dön
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Şifremi Unuttum</h1>
        <p className="text-muted-foreground">
          E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
        </p>
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Bağlantı Gönder
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  )
}
