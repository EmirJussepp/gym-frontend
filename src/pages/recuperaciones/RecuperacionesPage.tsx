import { useState, useCallback } from 'react'
import { recuperacionesService, type Recuperacion } from '@/services/recuperaciones.service'
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
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'

const ESTADO_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDIENTE: 'warning', UTILIZADA: 'success', VENCIDA: 'danger',
}

interface RecupForm {
  fechaClaseOriginal: string
  tipoActividad: string
  fechaVencimiento: string
}

export default function RecuperacionesPage() {
  const [recuperaciones, setRecuperaciones] = useState<Recuperacion[]>([])
  const [socioId, setSocioId] = useState('')
  const [socioIdBusqueda, setSocioIdBusqueda] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Recuperacion | null>(null)
  const { toasts, toast, dismiss } = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RecupForm>()

  const fetchRecuperaciones = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const res = await recuperacionesService.getBySocio(id)
      setRecuperaciones(res)
      setSocioIdBusqueda(id)
    } catch {
      toast('Error al cargar recuperaciones', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const onSubmit = async (data: RecupForm) => {
    if (!socioIdBusqueda) return
    try {
      await recuperacionesService.create(socioIdBusqueda, data.fechaClaseOriginal, data.tipoActividad, data.fechaVencimiento)
      toast('Recuperación creada', 'success')
      setModalOpen(false)
      reset()
      fetchRecuperaciones(socioIdBusqueda)
    } catch {
      toast('Error al crear recuperación', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioIdBusqueda) return
    try {
      await recuperacionesService.delete(socioIdBusqueda, confirmDelete.recuperacionId)
      toast('Recuperación eliminada', 'success')
      setConfirmDelete(null)
      fetchRecuperaciones(socioIdBusqueda)
    } catch {
      toast('Error al eliminar', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Recuperaciones" subtitle="Recuperaciones por socio" />

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
        <Button onClick={() => socioId && fetchRecuperaciones(Number(socioId))} variant="outline">
          <Search className="h-4 w-4" /> Buscar
        </Button>
        {socioIdBusqueda && (
          <Button onClick={() => { reset(); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nueva recuperación
          </Button>
        )}
      </div>

      {loading ? <Spinner /> : recuperaciones.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Fecha clase original</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh>Estado</TableTh>
              <TableTh>Vencimiento</TableTh>
              <TableTh>Fecha recuperación</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {recuperaciones.map((r) => (
              <TableRow key={r.recuperacionId}>
                <TableTd className="font-medium">{formatDate(r.fechaClaseOriginal)}</TableTd>
                <TableTd><Badge variant="secondary">{r.tipoActividad}</Badge></TableTd>
                <TableTd><Badge variant={ESTADO_VARIANT[r.estado] ?? 'secondary'}>{r.estado}</Badge></TableTd>
                <TableTd>{formatDate(r.fechaVencimiento)}</TableTd>
                <TableTd>{r.fechaRecuperacion ? formatDate(r.fechaRecuperacion) : '—'}</TableTd>
                <TableTd>
                  {r.estado === 'PENDIENTE' && (
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : socioIdBusqueda ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin recuperaciones registradas</p>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva recuperación">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input id="fechaClaseOriginal" label="Fecha clase original" type="date" {...register('fechaClaseOriginal', { required: true })} />
          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad', { required: true })}>
            <option value="LIBRE">Libre</option>
            <option value="PILATES">Pilates</option>
            <option value="FUNCIONAL">Funcional</option>
            <option value="MUSCULACION">Musculación</option>
          </Select>
          <Input id="fechaVencimiento" label="Fecha de vencimiento" type="date" {...register('fechaVencimiento', { required: true })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Crear</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar recuperación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar la recuperación del <strong>{confirmDelete ? formatDate(confirmDelete.fechaClaseOriginal) : ''}</strong>?
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
