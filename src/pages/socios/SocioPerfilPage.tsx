import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sociosService } from '@/services/socios.service'
import { cuotasService } from '@/services/cuotas.service'
import { asistenciasService } from '@/services/asistencias.service'
import { rutinaSocioService } from '@/services/rutinaSocio.service'
import { rutinaEjercicioService } from '@/services/rutinaEjercicio.service'
import type { Socio, Cuota, Asistencia } from '@/types'
import type { RutinaSocioResponse } from '@/services/rutinaSocio.service'
import type { RutinaEjercicioDetalle } from '@/services/rutinaEjercicio.service'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, User, Phone, Mail, Calendar, CreditCard,
  Dumbbell, CheckCircle, Clock, AlertCircle, Activity,
  ChevronRight
} from 'lucide-react'
import SocioRutinaModal from './SocioRutinaModal'

const ESTADO_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  ACTIVO: 'success', INACTIVO: 'danger', SUSPENDIDO: 'warning',
}
const CUOTA_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  PAGADA: 'success', PENDIENTE: 'warning', VENCIDA: 'danger',
}

export default function SocioPerfilPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const socioId = Number(id)

  const [socio, setSocio]           = useState<Socio | null>(null)
  const [cuotas, setCuotas]         = useState<Cuota[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [rutinaActiva, setRutinaActiva] = useState<RutinaSocioResponse | null>(null)
  const [ejercicios, setEjercicios] = useState<RutinaEjercicioDetalle[]>([])
  const [loading, setLoading]       = useState(true)
  const [rutinaModal, setRutinaModal] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [socioData, cuotasData, asistData, rutina] = await Promise.all([
          sociosService.getById(socioId),
          cuotasService.getBySocio(socioId),
          asistenciasService.getBySocio(socioId),
          rutinaSocioService.getActiva(socioId),
        ])
        setSocio(socioData)
        setCuotas(cuotasData.slice(0, 6))
        setAsistencias(asistData.slice(0, 10))
        setRutinaActiva(rutina)
        if (rutina) {
          const ejs = await rutinaEjercicioService.getByRutina(rutina.rutinaId)
          setEjercicios(ejs)
        }
      } catch {
        navigate('/socios')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [socioId])

  const refrescarRutina = async () => {
    const rutina = await rutinaSocioService.getActiva(socioId)
    setRutinaActiva(rutina)
    if (rutina) {
      const ejs = await rutinaEjercicioService.getByRutina(rutina.rutinaId)
      setEjercicios(ejs)
    } else {
      setEjercicios([])
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!socio) return null

  const cuotasPendientes = cuotas.filter(c => c.estado !== 'PAGADA').length
  const asistEstesMes = asistencias.filter(a => {
    const now = new Date()
    const [y, m] = a.fecha.split('-').map(Number)
    return y === now.getFullYear() && m === now.getMonth() + 1
  }).length

  // Agrupar ejercicios por grupo muscular
  const porGrupo = ejercicios.reduce<Record<string, RutinaEjercicioDetalle[]>>((acc, ej) => {
    const g = ej.grupoMuscularNombre || 'Sin grupo'
    if (!acc[g]) acc[g] = []
    acc[g].push(ej)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/socios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary text-xl font-bold flex items-center justify-center">
            {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">
              {socio.nombre} {socio.apellido}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={ESTADO_VARIANT[socio.estado]}>{socio.estado}</Badge>
              <span className="text-sm text-muted-foreground">DNI {socio.dni}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/socios')}>
          Editar socio
        </Button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Plan actual',
            value: socio.planNombre ?? `Plan #${socio.planId}`,
            icon: CreditCard,
            color: 'text-blue-500 bg-blue-50',
          },
          {
            label: 'Cuotas pendientes',
            value: String(cuotasPendientes),
            icon: AlertCircle,
            color: cuotasPendientes > 0 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50',
          },
          {
            label: 'Asistencias este mes',
            value: String(asistEstesMes),
            icon: Activity,
            color: 'text-violet-500 bg-violet-50',
          },
          {
            label: 'Rutina activa',
            value: rutinaActiva ? rutinaActiva.rutinaNombre : 'Sin asignar',
            icon: Dumbbell,
            color: rutinaActiva ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 bg-gray-50',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold truncate mt-0.5">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda — datos personales */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Datos personales
              </p>
              <div className="space-y-3">
                {[
                  { icon: User,     label: 'DNI',       value: socio.dni },
                  { icon: Phone,    label: 'Teléfono',  value: socio.telefono || '—' },
                  { icon: Mail,     label: 'Email',     value: socio.email || '—' },
                  { icon: Calendar, label: 'Nacimiento', value: socio.fechaNacimiento ? formatDate(socio.fechaNacimiento) : '—' },
                  { icon: Calendar, label: 'Miembro desde', value: socio.fechaInicio ? formatDate(socio.fechaInicio) : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium truncate">{value}</p>
                    </div>
                  </div>
                ))}
                {socio.precioPersonalizado && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                    <p className="text-xs text-amber-700 font-medium">
                      Precio personalizado: {formatCurrency(socio.precioPersonalizado)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Últimas asistencias */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Últimas asistencias
              </p>
              {asistencias.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin registros</p>
              ) : (
                <div className="space-y-2">
                  {asistencias.map(a => (
                    <div key={a.asistenciaId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-sm">{formatDate(a.fecha)}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {a.tipoAsistencia}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha — rutina y cuotas */}
        <div className="lg:col-span-2 space-y-4">

          {/* Rutina activa */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Rutina activa
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRutinaModal(true)}
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  {rutinaActiva ? 'Cambiar rutina' : 'Asignar rutina'}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {rutinaActiva ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{rutinaActiva.rutinaNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Asignada el {formatDate(rutinaActiva.fechaAsignacion)}
                      </p>
                    </div>
                  </div>

                  {ejercicios.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(porGrupo).map(([grupo, items]) => (
                        <div key={grupo}>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">{grupo}</p>
                          <div className="space-y-1.5">
                            {items.map(ej => (
                              <div
                                key={ej.id}
                                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                              >
                                <span className="text-sm font-medium">{ej.ejercicioNombre}</span>
                                <span className="text-xs text-muted-foreground">
                                  {ej.series && ej.repeticiones
                                    ? `${ej.series} × ${ej.repeticiones}`
                                    : '—'}
                                  {ej.descansoSeg ? ` · ${ej.descansoSeg}s` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Esta rutina no tiene ejercicios cargados aún.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">Sin rutina activa</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setRutinaModal(true)}
                  >
                    Asignar rutina
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cuotas recientes */}
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Cuotas recientes
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/cuotas')}
                >
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              {cuotas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas generadas</p>
              ) : (
                <div className="space-y-2">
                  {cuotas.map(c => (
                    <div
                      key={c.cuotaId}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        {c.estado === 'PAGADA'
                          ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                          : <Clock className="h-4 w-4 text-amber-500" />
                        }
                        <div>
                          <p className="text-sm font-medium">{c.periodo}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence {formatDate(c.fechaVencimiento)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{formatCurrency(c.monto)}</span>
                        <Badge variant={CUOTA_VARIANT[c.estado]}>{c.estado}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal rutina */}
      <SocioRutinaModal
        open={rutinaModal}
        onClose={() => {
          setRutinaModal(false)
          refrescarRutina()
        }}
        socioId={socioId}
        socioNombre={`${socio.nombre} ${socio.apellido}`}
      />
    </div>
  )
}