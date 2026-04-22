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
import { CheckCircle, Clock, Plus } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  socioId: number
  socioNombre: string
}

export default function SocioRutinaModal({ open, onClose, socioId, socioNombre }: Props) {
  const [rutinaActiva, setRutinaActiva] = useState<RutinaSocioResponse | null>(null)
  const [historial, setHistorial] = useState<RutinaSocioResponse[]>([])
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState('')
  const [loading, setLoading] = useState(true)
  const [asignando, setAsignando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const { toasts, toast, dismiss } = useToast()
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
    if (open) fetchData()
  }, [open, fetchData])

  const handleAsignar = async () => {
    if (!rutinaSeleccionada) return
    setGuardando(true)
    try {
      await rutinaSocioService.asignar(socioId, Number(rutinaSeleccionada), usuario?.userId)
      toast('Rutina asignada correctamente', 'success')
      setAsignando(false)
      setRutinaSeleccionada('')
      fetchData()
    } catch {
      toast('Error al asignar rutina', 'error')
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

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Rutinas — ${socioNombre}`} className="max-w-2xl">
        <div className="flex flex-col gap-5">
          {loading ? <Spinner /> : (
            <>
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
                        <Button variant="outline" size="sm" onClick={handleFinalizar} loading={guardando}>
                          Finalizar
                        </Button>
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
