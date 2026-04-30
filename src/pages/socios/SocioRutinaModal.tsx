import { useState, useEffect, useCallback } from 'react'
import { rutinaSocioService, type RutinaSocioResponse } from '@/services/rutinaSocio.service'
import { rutinasService } from '@/services/rutinas.service'
import type { Rutina } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Card, CardContent } from '@/components/ui/Card'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import { CheckCircle, Clock, Plus, Mail, MessageCircle, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  socioId: number
  socioNombre: string
  socioEmail?: string
  socioTelefono?: string
}

function formatearWhatsApp(telefono: string): string {
  // Elimina espacios, guiones, paréntesis
  let num = telefono.replace(/[\s\-().+]/g, '')
  // Si empieza con 0, se lo saca (Argentina: 0299 → 299)
  if (num.startsWith('0')) num = num.slice(1)
  // Si no empieza con 54, agrega el código de Argentina
  if (!num.startsWith('54')) num = '54' + num
  return num
}

export default function SocioRutinaModal({
  open, onClose, socioId, socioNombre, socioEmail, socioTelefono,
}: Props) {
  const [rutinaActiva, setRutinaActiva]         = useState<RutinaSocioResponse | null>(null)
  const [historial, setHistorial]               = useState<RutinaSocioResponse[]>([])
  const [rutinas, setRutinas]                   = useState<Rutina[]>([])
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState('')
  const [loading, setLoading]                   = useState(true)
  const [asignando, setAsignando]               = useState(false)
  const [guardando, setGuardando]               = useState(false)
  const [enviandoEmail, setEnviandoEmail]       = useState(false)
  const [panelEnvio, setPanelEnvio]             = useState(false)
  const [rutinaRecienAsignada, setRutinaRecienAsignada] = useState<string | null>(null)
  const { toasts, toast, dismiss }              = useToast()
  const usuario = useAuthStore(s => s.usuario)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [activa, hist, todasRutinas] = await Promise.all([
        rutinaSocioService.getActiva(socioId),
        rutinaSocioService.getHistorial(socioId),
        rutinasService.getAll(1, 100),
      ])
      setRutinaActiva(activa)
      setHistorial(hist)
      setRutinas(todasRutinas.data.filter(r => r.activo))
    } catch {
      toast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [socioId])

  useEffect(() => {
    if (open) {
      fetchData()
      setPanelEnvio(false)
      setRutinaRecienAsignada(null)
    }
  }, [open, fetchData])

  const handleAsignar = async () => {
    if (!rutinaSeleccionada) return
    setGuardando(true)
    try {
      await rutinaSocioService.asignar(socioId, Number(rutinaSeleccionada), usuario?.userId)
      const nombreRutina = rutinas.find(r => r.rutinaId === Number(rutinaSeleccionada))?.nombre ?? ''
      setRutinaRecienAsignada(nombreRutina)
      setPanelEnvio(true)
      setAsignando(false)
      setRutinaSeleccionada('')
      fetchData()
      toast('Rutina asignada correctamente', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al asignar rutina'
      toast(msg, 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleFinalizar = async () => {
    if (!rutinaActiva) return
    setGuardando(true)
    try {
      await rutinaSocioService.finalizar(rutinaActiva.id)
      toast('Rutina finalizada', 'success')
      fetchData()
    } catch {
      toast('Error al finalizar rutina', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const handleEnviarEmail = async () => {
    setEnviandoEmail(true)
    try {
      await rutinasService.enviarPorEmail(socioId)
      toast(`PDF enviado a ${socioEmail}`, 'success')
      setPanelEnvio(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al enviar email'
      toast(msg, 'error')
    } finally {
      setEnviandoEmail(false)
    }
  }

  const handleWhatsApp = () => {
    const tel = socioTelefono ? formatearWhatsApp(socioTelefono) : ''
    const texto = encodeURIComponent(
      `¡Hola ${socioNombre.split(' ')[0]}! 💪 Te asignamos tu rutina de entrenamiento "${rutinaRecienAsignada ?? 'nueva rutina'}". Cualquier consulta estamos disponibles.`
    )
    const url = tel ? `https://wa.me/${tel}?text=${texto}` : `https://wa.me/?text=${texto}`
    window.open(url, '_blank')
    setPanelEnvio(false)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Rutinas — ${socioNombre}`} className="max-w-2xl">
        <div className="flex flex-col gap-5">
          {loading ? <Spinner /> : (
            <>
              {/* Panel de envío post-asignación */}
              {panelEnvio && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">¿Enviamos la rutina al socio?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rutina <strong>{rutinaRecienAsignada}</strong> asignada correctamente
                      </p>
                    </div>
                    <button onClick={() => setPanelEnvio(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {socioEmail ? (
                      <Button size="sm" onClick={handleEnviarEmail} loading={enviandoEmail}>
                        <Mail className="h-3.5 w-3.5" /> Enviar PDF por email
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> Sin email registrado
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={handleWhatsApp}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      {socioTelefono ? 'WhatsApp' : 'WhatsApp (sin número)'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rutina activa */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rutina activa</p>
                {rutinaActiva ? (
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{rutinaActiva.rutinaNombre}</p>
                            <p className="text-xs text-muted-foreground">Desde {formatDate(rutinaActiva.fechaAsignacion)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {/* Reenviar desde rutina activa */}
                          {(socioEmail || socioTelefono) && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              setRutinaRecienAsignada(rutinaActiva.rutinaNombre)
                              setPanelEnvio(true)
                            }}>
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={handleFinalizar} loading={guardando}>
                            Finalizar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">Sin rutina activa</p>
                  </div>
                )}
              </div>

              {/* Asignar nueva */}
              {!rutinaActiva && (
                <div>
                  {asignando ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
                      <p className="text-sm font-medium">Asignar rutina</p>
                      <Select
                        id="rutina"
                        label="Seleccioná una rutina"
                        value={rutinaSeleccionada}
                        onChange={e => setRutinaSeleccionada(e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        {rutinas.map(r => (
                          <option key={r.rutinaId} value={r.rutinaId}>{r.nombre}</option>
                        ))}
                      </Select>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAsignando(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleAsignar} loading={guardando} disabled={!rutinaSeleccionada}>
                          Asignar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => setAsignando(true)}>
                      <Plus className="h-4 w-4" /> Asignar rutina
                    </Button>
                  )}
                </div>
              )}

              {/* Historial */}
              {historial.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial</p>
                  <div className="flex flex-col gap-2">
                    {historial.map(h => (
                      <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{h.rutinaNombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(h.fechaAsignacion)} → {h.fechaFin ? formatDate(h.fechaFin) : 'activa'}
                          </p>
                        </div>
                        <Badge variant={h.fechaFin ? 'secondary' : 'success'}>
                          {h.fechaFin ? 'Finalizada' : 'Activa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-border">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  )
}
