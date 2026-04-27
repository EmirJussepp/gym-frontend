import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate  = useNavigate()
  const login     = useAuthStore((s) => s.login)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      const res = await authService.login(data.email, data.password)
      login(res.token, res.usuario)
      navigate('/dashboard')
    } catch {
      setError('Email o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl shadow-md px-8 py-5 mb-5 flex items-center justify-center">
            <img
              src="/logoaerogym.jpg"
              alt="Aero Gym"
              className="h-16 w-auto object-contain"
            />
          </div>
          <p className="text-muted-foreground text-sm">Ingresá a tu cuenta</p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="admin@gym.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Aero Gym · Since 2014
        </p>
      </div>
    </div>
  )
}
