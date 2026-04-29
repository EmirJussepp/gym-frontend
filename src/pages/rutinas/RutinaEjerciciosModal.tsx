import { useState, useEffect, useCallback } from 'react'
import { rutinaEjercicioService, type RutinaEjercicioDetalle } from '@/services/rutinaEjercicio.service'
import { ejerciciosService } from '@/services/ejercicios.service'
import type { Ejercicio } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface Props {
  open: boolean
  onClose: () => void
  rutinaId: number
  rutinaNombre: string
}

interface AgregarForm {
  ejercicioId: string
  series: number
  repeticiones: string
  descansoSeg: number
  orden: number
}

interface EditForm {
  series: number
  repeticiones: string
  descansoSeg: number
  orden: number
}

export default function RutinaEjerciciosModal({ open, onClose, rutinaId, rutinaNombre }: Props) {
  const [ejerciciosRutina, setEjerciciosRutina] = useState<RutinaEjercicioDetalle[]>([])
  const [ejercicios, setEjercicios]             = useState<Ejercicio[]>([])
  const [loading, setLoading]                   = useState(true)
  const [agregando, setAgregando]               = useState(false)
  const [editandoId, setEditandoId]             = useState<number | null>(null)
  const [guardandoEdit, setGuardandoEdit]       = useState(false)
  const { toasts, toast, dismiss }              = useToast()

  const formAgregar = useForm<AgregarForm>({
    defaultValues: { series: 3, repeticiones: '10', descansoSeg: 60, orden: 1 },
  })
  const formEdit = useForm<EditForm>()

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

  // ── Agregar ──
  const onSubmitAgregar = async (data: AgregarForm) => {
    const ejercicio = ejercicios.find(e => e.ejercicioId === Number(data.ejercicioId))
    if (!ejercicio) return
    try {
      await rutinaEjercicioService.agregar(rutinaId, {
        ejercicioId:     Number(data.ejercicioId),
        grupoMuscularId: ejercicio.grupoMuscularId,
        series:          Number(data.series),
        repeticiones:    data.repeticiones,
        descansoSeg:     Number(data.descansoSeg),
        orden:           Number(data.orden),
      })
      toast('Ejercicio agregado', 'success')
      formAgregar.reset({ series: 3, repeticiones: '10', descansoSeg: 60, orden: ejerciciosRutina.length + 2 })
      setAgregando(false)
      fetchEjercicios()
    } catch {
      toast('Error al agregar ejercicio', 'error')
    }
  }

  // ── Editar inline ──
  const abrirEditar = (e: RutinaEjercicioDetalle) => {
    setEditandoId(e.id)
    formEdit.reset({
      series:       e.series ?? 3,
      repeticiones: e.repeticiones ?? '10',
      descansoSeg:  e.descansoSeg ?? 60,
      orden:        e.orden ?? 1,
    })
  }

  const confirmarEditar = async (id: number) => {
    const data = formEdit.getValues()
    setGuardandoEdit(true)
    try {
      await rutinaEjercicioService.update(rutinaId, id, {
        series:       Number(data.series),
        repeticiones: data.repeticiones,
        descansoSeg:  Number(data.descansoSeg),
        orden:        Number(data.orden),
      })
      toast('Ejercicio actualizado', 'success')
      setEditandoId(null)
      fetchEjercicios()
    } catch {
      toast('Error al actualizar ejercicio', 'error')
    } finally {
      setGuardandoEdit(false)
    }
  }

  // ── Eliminar ──
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
                    {ejerciciosRutina.map(e => (
                      <TableRow key={e.id}>
                        {editandoId === e.id ? (
                          // ── Fila en modo edición ──
                          <>
                            <TableTd>
                              <input
                                type="number"
                                min={1}
                                className="w-12 h-8 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                {...formEdit.register('orden')}
                              />
                            </TableTd>
                            <TableTd className="font-medium text-muted-foreground">{e.ejercicioNombre}</TableTd>
                            <TableTd><Badge variant="secondary">{e.grupoMuscularNombre}</Badge></TableTd>
                            <TableTd>
                              <input
                                type="number"
                                min={1}
                                className="w-14 h-8 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                {...formEdit.register('series')}
                              />
                            </TableTd>
                            <TableTd>
                              <input
                                type="text"
                                placeholder="10 o 8-12"
                                className="w-20 h-8 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                {...formEdit.register('repeticiones')}
                              />
                            </TableTd>
                            <TableTd>
                              <input
                                type="number"
                                min={0}
                                className="w-16 h-8 rounded border border-input bg-card px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                {...formEdit.register('descansoSeg')}
                              />
                            </TableTd>
                            <TableTd>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" title="Guardar" onClick={() => confirmarEditar(e.id)} disabled={guardandoEdit}>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Cancelar" onClick={() => setEditandoId(null)}>
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            </TableTd>
                          </>
                        ) : (
                          // ── Fila normal ──
                          <>
                            <TableTd className="text-muted-foreground">{e.orden}</TableTd>
                            <TableTd className="font-medium">{e.ejercicioNombre}</TableTd>
                            <TableTd><Badge variant="secondary">{e.grupoMuscularNombre}</Badge></TableTd>
                            <TableTd>{e.series ?? '—'}</TableTd>
                            <TableTd>{e.repeticiones ?? '—'}</TableTd>
                            <TableTd>{e.descansoSeg ? `${e.descansoSeg}s` : '—'}</TableTd>
                            <TableTd>
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEditar(e)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Eliminar" onClick={() => handleDelete(e.id)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableTd>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin ejercicios agregados</p>
              )}

              {/* Formulario agregar */}
              {agregando ? (
                <form onSubmit={formAgregar.handleSubmit(onSubmitAgregar)} className="border border-border rounded-lg p-4 flex flex-col gap-3">
                  <p className="text-sm font-medium">Agregar ejercicio</p>
                  <Select id="ejercicioId" label="Ejercicio" {...formAgregar.register('ejercicioId', { required: true })}>
                    <option value="">Seleccionar...</option>
                    {ejercicios.map(e => (
                      <option key={e.ejercicioId} value={e.ejercicioId}>
                        {e.nombre} {e.grupoMuscularNombre ? `(${e.grupoMuscularNombre})` : ''}
                      </option>
                    ))}
                  </Select>
                  <div className="grid grid-cols-4 gap-3">
                    <Input id="series"      label="Series"        type="number" min={1} {...formAgregar.register('series')} />
                    <Input id="repeticiones" label="Reps"         placeholder="10 o 8-12" {...formAgregar.register('repeticiones')} />
                    <Input id="descansoSeg" label="Descanso (s)"  type="number" {...formAgregar.register('descansoSeg')} />
                    <Input id="orden"       label="Orden"         type="number" min={1} {...formAgregar.register('orden')} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAgregando(false)}>Cancelar</Button>
                    <Button type="submit" size="sm" loading={formAgregar.formState.isSubmitting}>Agregar</Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    formAgregar.reset({ series: 3, repeticiones: '10', descansoSeg: 60, orden: ejerciciosRutina.length + 1 })
                    setAgregando(true)
                  }}
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
