import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { sociosService } from '@/services/socios.service'
import { planesService } from '@/services/planes.service'
import { rutinasService } from '@/services/rutinas.service'
import { cuotasService } from '@/services/cuotas.service'
import { Users, CreditCard, Dumbbell, AlertCircle } from 'lucide-react'

interface Stats {
  socios: number
  planes: number
  rutinas: number
  deudores: number
}

export default function DashboardPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [socios, planes, rutinas, deudores] = await Promise.all([
          sociosService.getAll(1, 1),
          planesService.getAll(1, 1),
          rutinasService.getAll(1, 1),
          cuotasService.getDeudores(),
        ])
        setStats({
          socios: socios.total,
          planes: planes.total,
          rutinas: rutinas.total,
          deudores: deudores.length,
        })
      } catch {
        setStats({ socios: 0, planes: 0, rutinas: 0, deudores: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const CARDS = [
    { title: 'Socios activos', value: stats?.socios, icon: Users, color: 'text-blue-500 bg-blue-50' },
    { title: 'Planes disponibles', value: stats?.planes, icon: CreditCard, color: 'text-emerald-500 bg-emerald-50' },
    { title: 'Rutinas', value: stats?.rutinas, icon: Dumbbell, color: 'text-violet-500 bg-violet-50' },
    { title: 'Cuotas pendientes', value: stats?.deudores, icon: AlertCircle, color: 'text-amber-500 bg-amber-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Bienvenido, {usuario?.nombre} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Resumen general del gimnasio</p>
      </div>

      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map(({ title, value, icon: Icon, color }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-display font-bold mt-1">{value ?? '—'}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
