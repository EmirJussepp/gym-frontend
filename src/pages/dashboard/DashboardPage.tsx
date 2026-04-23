import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { sociosService } from '@/services/socios.service'
import { planesService } from '@/services/planes.service'
import { rutinasService } from '@/services/rutinas.service'
import { cuotasService } from '@/services/cuotas.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, CreditCard, Dumbbell, AlertCircle, ChevronRight, TrendingUp } from 'lucide-react'
import type { Cuota, Socio } from '@/types'

export default function DashboardPage() {
  const usuario  = useAuthStore(s => s.usuario)
  const navigate = useNavigate()

  const [loading, setLoading]       = useState(true)
  const [stats, setStats]           = useState({ socios: 0, planes: 0, rutinas: 0, deudores: 0 })
  const [deudores, setDeudores]     = useState<Cuota[]>([])
  const [sociosRecientes, setSociosRecientes] = useState<Socio[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const now = new Date()
        const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [socios, planes, rutinas, cuotasPeriodo, sociosData] = await Promise.all([
          sociosService.getAll(1, 1),
          planesService.getAll(1, 1),
          rutinasService.getAll(1, 1),
          cuotasService.getByPeriodo(periodo),
          sociosService.getAll(1, 5),
        ])

        const pendientes = cuotasPeriodo.filter(c => c.estado !== 'PAGADA')

        setStats({
          socios:   socios.total,
          planes:   planes.total,
          rutinas:  rutinas.total,
          deudores: pendientes.length,
        })
        setDeudores(pendientes.slice(0, 5))
        setSociosRecientes(sociosData.data)
      } catch {
        setStats({ socios: 0, planes: 0, rutinas: 0, deudores: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const CARDS = [
    {
      title: 'Socios activos', value: stats.socios,
      icon: Users, color: 'text-blue-500 bg-blue-50',
      action: () => navigate('/socios'),
    },
    {
      title: 'Planes activos', value: stats.planes,
      icon: CreditCard, color: 'text-emerald-500 bg-emerald-50',
      action: () => navigate('/planes'),
    },
    {
      title: 'Rutinas', value: stats.rutinas,
      icon: Dumbbell, color: 'text-violet-500 bg-violet-50',
      action: () => navigate('/rutinas'),
    },
    {
      title: 'Cuotas pendientes', value: stats.deudores,
      icon: AlertCircle,
      color: stats.deudores > 0 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50',
      action: () => navigate('/cuotas'),
    },
  ]

  return (
    <div className="space-y-8">

      {/* Bienvenida */}
      <div>
        <h1 className="font-display text-3xl font-bold">
          {saludo}, {usuario?.nombre} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Resumen del gimnasio al día de hoy</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CARDS.map(({ title, value, icon: Icon, color, action }) => (
              <Card
                key={title}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={action}
              >
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{title}</p>
                      <p className="text-3xl font-display font-bold mt-1">{value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Cuotas pendientes */}
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <p className="font-semibold text-sm">Cuotas pendientes del mes</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/cuotas')}>
                    Ver todas <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {deudores.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-emerald-600">Todo al día 🎉</p>
                    <p className="text-xs text-muted-foreground mt-1">No hay cuotas pendientes este mes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deudores.map(c => (
                      <div
                        key={c.cuotaId}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">Socio #{c.socioId}</p>
                          <p className="text-xs text-muted-foreground">Vence {formatDate(c.fechaVencimiento)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{formatCurrency(c.monto)}</span>
                          <Badge variant={c.estado === 'VENCIDA' ? 'danger' : 'warning'}>
                            {c.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Socios recientes */}
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <p className="font-semibold text-sm">Socios</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/socios')}>
                    Ver todos <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {sociosRecientes.map(s => (
                    <div
                      key={s.socioId}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/socios/${s.socioId}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                        {s.nombre.charAt(0)}{s.apellido.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.nombre} {s.apellido}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.ultimaAsistenciaFecha
                            ? `Última visita ${formatDate(s.ultimaAsistenciaFecha)}`
                            : 'Sin asistencias'}
                        </p>
                      </div>
                      <Badge variant={s.estado === 'ACTIVO' ? 'success' : 'danger'}>
                        {s.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </>
      )}
    </div>
  )
}