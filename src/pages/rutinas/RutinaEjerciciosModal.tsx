import { useState, useEffect, useCallback } from 'react'
import { rutinaEjercicioService, type RutinaEjercicioDetalle } from '@/services/rutinaEjercicio.service'
import { ejerciciosService } from '@/services/ejercicios.service'
import type { Ejercicio, GrupoMuscular } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface Props {
  open: boolean
  onClose: () => void
  rutinaId: number
  rutinaNombre: string
}

interface EjercicioForm {
  ejercicioId: string
  series: number
  repeticiones: string
  descansoSeg: number
  orden: number
}

export default function RutinaEjerciciosModal({ open, onClose, rutinaId, rutinaNombre }: Props) {
  const [ejerciciosRutina, setEjerciciosRutina] = useState<RutinaEjercicioDetalle[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const { toasts, toast, dismiss } = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<EjercicioForm>({
    defaultValues: { series: 3, repeticiones: '10', descansoSeg: 60, orden: 1 }
  })

  const fetchEjercicios = useCallback(async () => {
    setLoading(true)
    try {
      const [rutinaEjs, todosEjs] = await Promise.all([
        rutinaEjercicioService.getByRutina(rutinaId),
        ejerciciosService.getAll(1, 100),
      ])
      setEjerciciosRutina(rutinaEjs)
      setEjercicios(todosEjs.data.filter(e => e.activo))
    } catch {
      toast('Error al cargar ejercicios', 'error')
    } finally {
      setLoading(false)
    }
  }, [rutinaId])

  useEffect(() => {
    if (open) fetchEjercicios()
  }, [open, fetchEjercicios])

  const onSubmit = async (data: EjercicioForm) => {
    const ejercicio = ejercicios.find(e => e.ejercicioId === Number(data.ejercicioId))
    if (!ejercicio) return

    try {
      await rutinaEjercicioService.agregar(rutinaId, {
        ejercicioId: Number(data.ejercicioId),
        grupoMuscularId: ejercicio.grupoMuscularId,
        series: Number(data.series),
        repeticiones: data.repeticiones,
        descansoSeg: Number(data.descansoSeg),
        orden: Number(data.orden),
      })
      toast('Ejercicio agregado', 'success')
      reset({ series: 3, repeticiones: '10', descansoSeg: 60, orden: ejerciciosRutina.length + 2 })
      setAgregando(false)
      fetchEjercicios()
    } catch {
      toast('Error al agregar ejercicio', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await rutinaEjercicioService.eliminar(rutinaId, id)
      toast('Ejercicio eliminado', 'success')
      fetchEjercicios()
    } catch {
      toast('Error al eliminar', 'error')
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Ejercicios — ${rutinaNombre}`} className="max-w-3xl">
        <div className="flex flex-col gap-4">
          {loading ? <Spinner /> : (
            <>
              {ejerciciosRutina.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableTh>#</TableTh>
                      <TableTh>Ejercicio</TableTh>
                      <TableTh>Grupo</TableTh>
                      <TableTh>Series</TableTh>
                      <TableTh>Reps</TableTh>
                      <TableTh>Descanso</TableTh>
                      <TableTh />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ejerciciosRutina.map((e) => (
                      <TableRow key={e.id}>
                        <TableTd className="text-muted-foreground">{e.orden}</TableTd>
                        <TableTd className="font-medium">{e.ejercicioNombre}</TableTd>
                        <TableTd><Badge variant="secondary">{e.grupoMuscularNombre}</Badge></TableTd>
                        <TableTd>{e.series ?? '—'}</TableTd>
                        <TableTd>{e.repeticiones ?? '—'}</TableTd>
                        <TableTd>{e.descansoSeg ? `${e.descansoSeg}s` : '—'}</TableTd>
                        <TableTd>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableTd>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin ejercicios agregados</p>
              )}

              {/* Formulario agregar */}
              {agregando ? (
                <form onSubmit={handleSubmit(onSubmit)} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                  <p className="text-sm font-medium">Agregar ejercicio</p>
                  <Select id="ejercicioId" label="Ejercicio" {...register('ejercicioId', { required: true })}>
                    <option value="">Seleccionar...</option>
                    {ejercicios.map(e => (
                      <option key={e.ejercicioId} value={e.ejercicioId}>
                        {e.nombre} {e.grupoMuscularNombre ? `(${e.grupoMuscularNombre})` : ''}
                      </option>
                    ))}
                  </Select>
                  <div className="grid grid-cols-4 gap-3">
                    <Input id="series" label="Series" type="number" min={1} {...register('series')} />
                    <Input id="repeticiones" label="Reps" placeholder="10 o 8-12" {...register('repeticiones')} />
                    <Input id="descansoSeg" label="Descanso (s)" type="number" {...register('descansoSeg')} />
                    <Input id="orden" label="Orden" type="number" min={1} {...register('orden')} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAgregando(false)}>Cancelar</Button>
                    <Button type="submit" size="sm" loading={isSubmitting}>Agregar</Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => { reset({ series: 3, repeticiones: '10', descansoSeg: 60, orden: ejerciciosRutina.length + 1 }); setAgregando(true) }}
                >
                  <Plus className="h-4 w-4" /> Agregar ejercicio
                </Button>
              )}
            </>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </Modal>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  )
}
