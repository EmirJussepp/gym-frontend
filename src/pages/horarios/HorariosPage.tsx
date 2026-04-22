import { useState, useCallback } from 'react'
import { horariosService, getDiaNombre, type Horario } from '@/services/horarios.service'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface HorarioForm {
  diaSemana: number
  horaInicio: string
  tipoActividad: string
}

const ACTIVIDAD_VARIANT: Record<string, 'default' | 'secondary' | 'warning' | 'success'> = {
  PILATES: 'default', FUNCIONAL: 'warning', MUSCULACION: 'success', LIBRE: 'secondary',
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [socioId, setSocioId] = useState('')
  const [socioIdBusqueda, setSocioIdBusqueda] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Horario | null>(null)
  const { toasts, toast, dismiss } = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<HorarioForm>({
    defaultValues: { diaSemana: 1, tipoActividad: 'LIBRE' }
  })

  const fetchHorarios = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const res = await horariosService.getBySocio(id)
      setHorarios(res)
      setSocioIdBusqueda(id)
    } catch {
      toast('Error al cargar horarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const onSubmit = async (data: HorarioForm) => {
    if (!socioIdBusqueda) return
    try {
      await horariosService.create(socioIdBusqueda, Number(data.diaSemana), data.horaInicio, data.tipoActividad)
      toast('Horario creado', 'success')
      setModalOpen(false)
      reset()
      fetchHorarios(socioIdBusqueda)
    } catch {
      toast('Error al crear horario', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioIdBusqueda) return
    try {
      await horariosService.delete(socioIdBusqueda, confirmDelete.horarioId)
      toast('Horario eliminado', 'success')
      setConfirmDelete(null)
      fetchHorarios(socioIdBusqueda)
    } catch {
      toast('Error al eliminar horario', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Horarios" subtitle="Horarios por socio" />

      <div className="flex items-end gap-3 mb-6">
        <Input
          id="socioId"
          label="ID del socio"
          type="number"
          value={socioId}
          onChange={(e) => setSocioId(e.target.value)}
          placeholder="Ej: 5"
          className="w-40"
        />
        <Button onClick={() => socioId && fetchHorarios(Number(socioId))} variant="outline">
          <Search className="h-4 w-4" /> Buscar
        </Button>
        {socioIdBusqueda && (
          <Button onClick={() => { reset(); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Agregar horario
          </Button>
        )}
      </div>

      {loading ? <Spinner /> : horarios.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Día</TableTh>
              <TableTh>Hora</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {horarios.map((h) => (
              <TableRow key={h.horarioId}>
                <TableTd className="font-medium">{getDiaNombre(h.diaSemana)}</TableTd>
                <TableTd>{h.horaInicio}</TableTd>
                <TableTd>
                  <Badge variant={ACTIVIDAD_VARIANT[h.tipoActividad] ?? 'secondary'}>
                    {h.tipoActividad}
                  </Badge>
                </TableTd>
                <TableTd>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(h)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : socioIdBusqueda ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin horarios registrados</p>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar horario">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select id="diaSemana" label="Día de la semana" {...register('diaSemana')}>
            {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d, i) => (
              <option key={i+1} value={i+1}>{d}</option>
            ))}
          </Select>
          <Input id="horaInicio" label="Hora de inicio" placeholder="Ej: 08:00" {...register('horaInicio', { required: true })} />
          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad')}>
            <option value="LIBRE">Libre</option>
            <option value="PILATES">Pilates</option>
            <option value="FUNCIONAL">Funcional</option>
            <option value="MUSCULACION">Musculación</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Agregar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar horario">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar el horario del <strong>{confirmDelete ? getDiaNombre(confirmDelete.diaSemana) : ''}</strong> a las <strong>{confirmDelete?.horaInicio}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
