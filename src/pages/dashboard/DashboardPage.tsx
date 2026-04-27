import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { sociosService } from '@/services/socios.service'
import { cuotasService } from '@/services/cuotas.service'
import { estadisticasService, type EstadisticasMes } from '@/services/estadisticas.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Users, CreditCard, AlertCircle,
  ChevronRight, TrendingUp, TrendingDown
} from 'lucide-react'
import type { Cuota, Socio } from '@/types'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function DashboardPage() {
  const usuario  = useAuthStore(s => s.usuario)
  const navigate = useNavigate()

  const [loading, setLoading]             = useState(true)
  const [stats, setStats]                 = useState({ socios: 0, rutinas: 0, deudores: 0, cobradoMes: 0 })
  const [deudores, setDeudores]           = useState<Cuota[]>([])
  const [sociosRecientes, setSociosRecientes] = useState<Socio[]>([])
  const [estadisticas, setEstadisticas]   = useState<EstadisticasMes[]>([])
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetch = async () => {
      try {
        const now = new Date()
        const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const [socios, cuotasPeriodo, sociosData, estData] = await Promise.all([
          sociosService.getAll(1, 1),
          cuotasService.getByPeriodo(periodo),
          sociosService.getAll(1, 5),
          estadisticasService.getAnio(anioSeleccionado),
        ])

        const pendientes  = cuotasPeriodo.filter(c => c.estado !== 'PAGADA')
        const cobradoMes  = cuotasPeriodo
          .filter(c => c.estado === 'PAGADA')
          .reduce((acc, c) => acc + c.monto, 0)

        setStats({
          socios:     socios.total,
          rutinas:    0,
          deudores:   pendientes.length,
          cobradoMes,
        })
        setDeudores(pendientes.slice(0, 5))
        setSociosRecientes(sociosData.data)
        setEstadisticas(estData)
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [anioSeleccionado])

  // Datos para los gráficos — solo meses con datos
  const datosGrafico = estadisticas.map((e, i) => ({
    mes:        MESES_CORTOS[i],
    cobrado:    Math.round(e.totalCobrado),
    pendiente:  Math.round(e.totalPendiente),
    asistencias: e.asistencias,
    nuevos:     e.sociosNuevos,
  }))

  // Tendencia vs mes anterior
  const mesActual  = estadisticas[new Date().getMonth()]
  const mesAnterior = estadisticas[new Date().getMonth() - 1]
  const tendencia  = mesActual && mesAnterior
    ? ((mesActual.totalCobrado - mesAnterior.totalCobrado) / (mesAnterior.totalCobrado || 1)) * 100
    : 0

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  const CARDS = [
    {
      title: 'Socios activos',
      value: stats.socios,
      icon: Users,
      color: 'text-blue-500 bg-blue-50',
      action: () => navigate('/socios'),
    },
    {
      title: 'Cobrado este mes',
      value: formatCurrency(stats.cobradoMes),
      icon: CreditCard,
      color: 'text-emerald-500 bg-emerald-50',
      action: () => navigate('/cuotas'),
    },
    {
      title: 'Cuotas pendientes',
      value: stats.deudores,
      icon: AlertCircle,
      color: stats.deudores > 0 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50',
      action: () => navigate('/cuotas'),
    },
    {
      title: 'Tendencia cobros',
      value: `${tendencia >= 0 ? '+' : ''}${tendencia.toFixed(1)}%`,
      icon: tendencia >= 0 ? TrendingUp : TrendingDown,
      color: tendencia >= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50',
      action: () => {},
    },
  ]

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-6">

      {/* Bienvenida */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {saludo}, {usuario?.nombre} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen del gimnasio
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {[anioSeleccionado - 1, anioSeleccionado, anioSeleccionado === new Date().getFullYear() ? null : anioSeleccionado + 1]
            .filter(Boolean)
            .map(anio => (
              <button
                key={anio}
                onClick={() => setAnioSeleccionado(anio!)}
                className={[
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  anio === anioSeleccionado
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                ].join(" ")}
              >
                {anio}
              </button>
            ))}
          {anioSeleccionado < new Date().getFullYear() && (
            <button
              onClick={() => setAnioSeleccionado(new Date().getFullYear())}
              className="px-3 py-1 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              {new Date().getFullYear()}
            </button>
          )}
        </div>
      </div>

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
                  <p className="text-2xl font-display font-bold mt-1">{value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico cobros del año */}
      <Card>
        <CardContent className="pt-5 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">Cobros vs Pendientes — {anioSeleccionado}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Evolución mensual en pesos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={datosGrafico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCobrado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPendiente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value, name) => [
  formatCurrency(Number(value)),
  name === 'cobrado' ? 'Cobrado' : 'Pendiente'
]}
              />
              <Legend formatter={v => v === 'cobrado' ? 'Cobrado' : 'Pendiente'} />
              <Area type="monotone" dataKey="cobrado"   stroke="#10b981" fill="url(#gradCobrado)"   strokeWidth={2} />
              <Area type="monotone" dataKey="pendiente" stroke="#f59e0b" fill="url(#gradPendiente)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico asistencias + socios nuevos */}
        <Card>
          <CardContent className="pt-5 pb-2">
            <p className="font-semibold mb-1">Asistencias y altas — {anioSeleccionado}</p>
            <p className="text-xs text-muted-foreground mb-4">Por mes</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datosGrafico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend formatter={(v: string) => v === 'asistencias' ? 'Asistencias' : 'Socios nuevos'} />
                <Bar dataKey="asistencias" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nuevos"      fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Panel derecho: deudores + socios recientes */}
        <div className="space-y-4">

          {/* Cuotas pendientes */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <p className="font-semibold text-sm">Cuotas pendientes del mes</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/cuotas')}>
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {deudores.length === 0 ? (
                <div className="text-center py-4">
                  <TrendingUp className="h-8 w-8 mx-auto mb-1 text-emerald-500 opacity-60" />
                  <p className="text-sm font-medium text-emerald-600">Todo al día 🎉</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {deudores.map(c => (
                    <div key={c.cuotaId} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Socio #{c.socioId}</p>
                        <p className="text-xs text-muted-foreground">Vence {formatDate(c.fechaVencimiento)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(c.monto)}</span>
                        <Badge variant={c.estado === 'VENCIDA' ? 'danger' : 'warning'}>{c.estado}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Socios recientes */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <p className="font-semibold text-sm">Socios</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/socios')}>
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5">
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
      </div>
    </div>
  )
}