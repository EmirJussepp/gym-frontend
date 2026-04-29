import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Building2, Palette, Save } from 'lucide-react'

const schema = z.object({
  nombreGimnasio: z.string().min(2, 'Mínimo 2 caracteres'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  instagram: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const COLORES_PRIMARIOS = [
  { label: 'Violeta',  value: '262 83% 58%' },
  { label: 'Azul',    value: '221 83% 53%' },
  { label: 'Verde',   value: '142 71% 45%' },
  { label: 'Naranja', value: '25 95% 53%' },
  { label: 'Rosa',    value: '330 81% 60%' },
  { label: 'Gris',    value: '215 14% 34%' },
]

export default function ConfiguracionPage() {
  const { toasts, toast, dismiss } = useToast()

  const savedColor = localStorage.getItem('gym_color') ?? COLORES_PRIMARIOS[0].value
  const [colorSeleccionado, setColorSeleccionado] = useState(savedColor)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombreGimnasio: localStorage.getItem('gym_nombre') ?? '',
      direccion:      localStorage.getItem('gym_direccion') ?? '',
      telefono:       localStorage.getItem('gym_telefono') ?? '',
      email:          localStorage.getItem('gym_email') ?? '',
      instagram:      localStorage.getItem('gym_instagram') ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    await new Promise(r => setTimeout(r, 300))
    localStorage.setItem('gym_nombre',    data.nombreGimnasio)
    localStorage.setItem('gym_direccion', data.direccion ?? '')
    localStorage.setItem('gym_telefono',  data.telefono ?? '')
    localStorage.setItem('gym_email',     data.email ?? '')
    localStorage.setItem('gym_instagram', data.instagram ?? '')
    localStorage.setItem('gym_color',     colorSeleccionado)
    // Notificar al Sidebar en la misma pestaña
    window.dispatchEvent(new StorageEvent('storage', { key: 'gym_nombre', newValue: data.nombreGimnasio }))
    document.documentElement.style.setProperty('--primary', colorSeleccionado)
    toast('Configuración guardada correctamente', 'success')
  }

  const aplicarColor = (value: string) => {
    setColorSeleccionado(value)
    document.documentElement.style.setProperty('--primary', value)
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Datos generales del gimnasio"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">

        {/* Datos del gimnasio */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold">Datos del gimnasio</p>
            </div>

            <div className="space-y-4">
              <Input
                id="nombreGimnasio"
                label="Nombre del gimnasio"
                placeholder="Mi Gimnasio"
                error={errors.nombreGimnasio?.message}
                {...register('nombreGimnasio')}
              />
              <Input
                id="direccion"
                label="Dirección"
                placeholder="Av. Corrientes 1234, Buenos Aires"
                error={errors.direccion?.message}
                {...register('direccion')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="telefono"
                  label="Teléfono"
                  placeholder="+54 11 1234-5678"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
                <Input
                  id="email"
                  label="Email de contacto"
                  type="email"
                  placeholder="info@migimnasio.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              <Input
                id="instagram"
                label="Instagram"
                placeholder="@migimnasio"
                error={errors.instagram?.message}
                {...register('instagram')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Color de la app */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm font-semibold">Color del sistema</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {COLORES_PRIMARIOS.map(({ label, value }) => {
                const isSelected = colorSeleccionado === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => aplicarColor(value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                    {label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              El color se aplica de inmediato y se guarda al hacer clic en Guardar.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting}>
            <Save className="h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </form>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
