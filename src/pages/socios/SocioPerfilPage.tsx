import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sociosService } from '@/services/socios.service'
import { cuotasService } from '@/services/cuotas.service'
import { asistenciasService } from '@/services/asistencias.service'
import { rutinaSocioService } from '@/services/rutinaSocio.service'
import { rutinasService } from '@/services/rutinas.service'
import { rutinaEjercicioService } from '@/services/rutinaEjercicio.service'
import { planesService } from '@/services/planes.service'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import type { Socio, Cuota, Asistencia, Plan } from '@/types'
import type { RutinaSocioResponse } from '@/services/rutinaSocio.service'
import type { RutinaEjercicioDetalle } from '@/services/rutinaEjercicio.service'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  ArrowLeft, User, Phone, Mail, Calendar, CreditCard,
  Dumbbell, CheckCircle, Clock, AlertCircle, Activity,
  ChevronRight, StickyNote, Trash2, Send, History,
} from 'lucide-react'
import SocioRutinaModal from './SocioRutinaModal'
import SocioForm from './SocioForm'

interface SocioNota {
  notaId: number
  socioId: number
  userId: number
  texto: string
  createdAt: string | null
}

interface HistorialPlan {
  id: number
  socioId: number
  planId: number
  planNombre?: string
  fechaDesde: string
  fechaHasta: string | null
}

const ESTADO_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  ACTIVO: 'success', INACTIVO: 'danger', SUSPENDIDO: 'warning',
}
const CUOTA_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  PAGADA: 'success', PENDIENTE: 'warning', VENCIDA: 'danger',
}

export default function SocioPerfilPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const usuario = useAuthStore(s => s.usuario)
  const socioId = Number(id)
  const { toasts, toast, dismiss } = useToast()

  const [socio, setSocio]                     = useState<Socio | null>(null)
  const [cuotas, setCuotas]                   = useState<Cuota[]>([])
  const [asistencias, setAsistencias]         = useState<Asistencia[]>([])
  const [rutinaActiva, setRutinaActiva]       = useState<RutinaSocioResponse | null>(null)
  const [ejercicios, setEjercicios]           = useState<RutinaEjercicioDetalle[]>([])
  const [planes, setPlanes]                   = useState<Plan[]>([])
  const [notas, setNotas]                     = useState<SocioNota[]>([])
  const [historialPlanes, setHistorialPlanes] = useState<HistorialPlan[]>([])
  const [loading, setLoading]                 = useState(true)
  const [rutinaModal, setRutinaModal]         = useState(false)
  const [editarModal, setEditarModal]         = useState(false)
  const [notaTexto, setNotaTexto]             = useState('')
  const [guardandoNota, setGuardandoNota]     = useState(false)
  const notaInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [socioData, cuotasData, asistData, rutina, planesData, notasData, historialData] =
          await Promise.all([
            sociosService.getById(socioId),
            cuotasService.getBySocio(socioId),
            asistenciasService.getBySocio(socioId),
            rutinaSocioService.getActiva(socioId),
            planesService.getAll(),
            api.get(`/socios/${socioId}/notas`).then(r => r.data).catch(() => []),
            sociosService.getHistorial(socioId).catch(() => []),
          ])
        setSocio(socioData)
        setCuotas(cuotasData.slice(0, 6))
        setAsistencias(asistData.slice(0, 10))
        setRutinaActiva(rutina)
        setPlanes(planesData.data)
        setNotas(notasData)
        setHistorialPlanes(historialData)
        if (rutina) {
          const ejs = await rutinaEjercicioService.getByRutina(rutina.rutinaId)
          setEjercicios(ejs)
        }
     } catch (e) {
  console.error('Error cargando perfil:', e)
  // No redirigir si igual cargó el socio
} finally {
        setLoading(false)
      }
    }
    load()
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

  function buildRutinaText(socioNombre: string, rutinaNombre: string, ejs: RutinaEjercicioDetalle[]): string {
    const lineas = [`🏋️ *Rutina: ${rutinaNombre}*`, `Alumno: ${socioNombre}`, ``]
    const porGrupo = ejs.reduce<Record<string, RutinaEjercicioDetalle[]>>((acc, ej) => {
      const g = ej.grupoMuscularNombre || 'Sin grupo'
      if (!acc[g]) acc[g] = []
      acc[g].push(ej)
      return acc
    }, {})
    for (const [grupo, items] of Object.entries(porGrupo)) {
      lineas.push(`*${grupo}*`)
      for (const ej of items) {
        const detalle = ej.series && ej.repeticiones ? `${ej.series} series x ${ej.repeticiones} reps` : ''
        const descanso = ej.descansoSeg ? ` | Descanso: ${ej.descansoSeg}s` : ''
        lineas.push(`* ${ej.ejercicioNombre}${detalle ? ` - ${detalle}` : ''}${descanso}`)
      }
      lineas.push(``)
    }
    return lineas.join('\n')
  }

  function compartirWhatsApp() {
    if (!rutinaActiva || !socio) return
    const baseUrl = import.meta.env.VITE_API_URL
    if (!baseUrl) { alert('Falta configurar VITE_API_URL'); return }
    const urlPdf = `${baseUrl}/socios/${socioId}/rutina/pdf`
    const texto = `Rutina: ${rutinaActiva.rutinaNombre}\n\nAlumno: ${socio.nombre} ${socio.apellido}\n\nVer rutina:\n${urlPdf}\n`
    const tel = socio.telefono?.replace(/\D/g, '')
    window.open(tel ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function compartirGmail() {
    if (!rutinaActiva || !socio) return
    const texto = buildRutinaText(`${socio.nombre} ${socio.apellido}`, rutinaActiva.rutinaNombre, ejercicios)
    const asunto = encodeURIComponent(`Tu rutina: ${rutinaActiva.rutinaNombre}`)
    const cuerpo = encodeURIComponent(texto)
    window.open(`mailto:${socio.email ?? ''}?subject=${asunto}&body=${cuerpo}`, '_blank')
  }

  async function descargarPDF() {
    try {
      const blob = await rutinasService.descargarPdf(socioId)
      if (!blob || blob.size === 0) throw new Error('PDF vacio')
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rutina-${socio?.apellido}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch {
      toast('No se pudo descargar el PDF', 'error')
    }
  }

  const agregarNota = async () => {
    if (!notaTexto.trim() || !usuario) return
    setGuardandoNota(true)
    try {
      const res = await api.post(`/socios/${socioId}/notas`, {
        userId: usuario.userId,
        texto: notaTexto.trim(),
      })
      setNotas(prev => [res.data, ...prev])
      setNotaTexto('')
      toast('Nota guardada', 'success')
    } catch {
      toast('Error al guardar la nota', 'error')
    } finally {
      setGuardandoNota(false)
    }
  }

  const eliminarNota = async (notaId: number) => {
    try {
      await api.delete(`/socios/${socioId}/notas/${notaId}`)
      setNotas(prev => prev.filter(n => n.notaId !== notaId))
      toast('Nota eliminada', 'success')
    } catch {
      toast('Error al eliminar la nota', 'error')
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

  const porGrupo = ejercicios.reduce<Record<string, RutinaEjercicioDetalle[]>>((acc, ej) => {
    const g = ej.grupoMuscularNombre || 'Sin grupo'
    if (!acc[g]) acc[g] = []
    acc[g].push(ej)
    return acc
  }, {})

  const planNombre = (planId: number) =>
    planes.find(p => p.planId === planId)?.nombre ?? `Plan #${planId}`

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
        <Button variant="outline" onClick={() => setEditarModal(true)}>
          Editar socio
        </Button>
      </div>

      {/* Stats rapidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Plan actual',          value: socio.planNombre ?? planNombre(socio.planId), icon: CreditCard,  color: 'text-blue-500 bg-blue-50' },
          { label: 'Cuotas pendientes',    value: String(cuotasPendientes), icon: AlertCircle, color: cuotasPendientes > 0 ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50' },
          { label: 'Asistencias este mes', value: String(asistEstesMes),    icon: Activity,    color: 'text-violet-500 bg-violet-50' },
          { label: 'Rutina activa',        value: rutinaActiva ? rutinaActiva.rutinaNombre : 'Sin asignar', icon: Dumbbell, color: rutinaActiva ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 bg-gray-50' },
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

        {/* Columna izquierda */}
        <div className="space-y-4">

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Datos personales</p>
              <div className="space-y-3">
                {[
                  { icon: User,     label: 'DNI',           value: socio.dni },
                  { icon: Phone,    label: 'Telefono',      value: socio.telefono || '-' },
                  { icon: Mail,     label: 'Email',         value: socio.email || '-' },
                  { icon: Calendar, label: 'Nacimiento',    value: socio.fechaNacimiento ? formatDate(socio.fechaNacimiento) : '-' },
                  { icon: Calendar, label: 'Miembro desde', value: socio.fechaInicio ? formatDate(socio.fechaInicio) : '-' },
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

          {historialPlanes.length > 0 && (
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historial de planes</p>
                </div>
                <div className="space-y-2">
                  {historialPlanes.map((h, i) => (
                    <div key={h.id ?? i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{planNombre(h.planId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(h.fechaDesde)} - {h.fechaHasta ? formatDate(h.fechaHasta) : 'hoy'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Ultimas asistencias</p>
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
                      <Badge variant="secondary" className="text-xs">{a.tipoAsistencia}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notas internas</p>
              </div>
              <div className="mb-3">
                <textarea
                  ref={notaInputRef}
                  value={notaTexto}
                  onChange={e => setNotaTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) agregarNota() }}
                  placeholder="Agregar nota... (Ctrl+Enter para guardar)"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-end mt-1.5">
                  <Button size="sm" onClick={agregarNota} disabled={!notaTexto.trim() || guardandoNota} loading={guardandoNota}>
                    <Send className="h-3.5 w-3.5" /> Guardar
                  </Button>
                </div>
              </div>
              {notas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Sin notas</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notas.map(n => (
                    <div key={n.notaId} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed flex-1">{n.texto}</p>
                        <button
                          onClick={() => eliminarNota(n.notaId)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {n.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-4">

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rutina activa</p>
                <Button variant="outline" size="sm" onClick={() => setRutinaModal(true)}>
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
                      <p className="text-xs text-muted-foreground">Asignada el {formatDate(rutinaActiva.fechaAsignacion)}</p>
                    </div>
                  </div>
                  {ejercicios.length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(porGrupo).map(([grupo, items]) => (
                        <div key={grupo}>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">{grupo}</p>
                          <div className="space-y-1.5">
                            {items.map(ej => (
                              <div key={ej.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                                <span className="text-sm font-medium">{ej.ejercicioNombre}</span>
                                <span className="text-xs text-muted-foreground">
                                  {ej.series && ej.repeticiones ? `${ej.series} x ${ej.repeticiones}` : '-'}
                                  {ej.descansoSeg ? ` * ${ej.descansoSeg}s` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-3">Esta rutina no tiene ejercicios cargados aun.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">Sin rutina activa</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setRutinaModal(true)}>
                    Asignar rutina
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {rutinaActiva && ejercicios.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={compartirWhatsApp}>
                <Phone className="h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={compartirGmail}>
                <Mail className="h-3.5 w-3.5" /> Gmail
              </Button>
              <Button variant="outline" size="sm" onClick={descargarPDF}>
                Descargar PDF
              </Button>
            </div>
          )}

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cuotas recientes</p>
                <Button variant="ghost" size="sm" onClick={() => navigate('/cuotas')}>
                  Ver todas <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              {cuotas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas generadas</p>
              ) : (
                <div className="space-y-2">
                  {cuotas.map(c => (
                    <div key={c.cuotaId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        {c.estado === 'PAGADA' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-amber-500" />}
                        <div>
                          <p className="text-sm font-medium">{c.periodo}</p>
                          <p className="text-xs text-muted-foreground">Vence {formatDate(c.fechaVencimiento)}</p>
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

      <SocioRutinaModal
        open={rutinaModal}
        onClose={() => { setRutinaModal(false); refrescarRutina() }}
        socioId={socioId}
        socioNombre={`${socio.nombre} ${socio.apellido}`}
      />

      <Modal open={editarModal} onClose={() => setEditarModal(false)} title="Editar socio" className="max-w-2xl">
        <SocioForm
          planes={planes}
          socio={socio}
          onSaved={async () => {
            setEditarModal(false)
            toast('Socio actualizado correctamente', 'success')
            const updated = await sociosService.getById(socioId)
            setSocio(updated)
          }}
          onCancel={() => setEditarModal(false)}
        />
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
