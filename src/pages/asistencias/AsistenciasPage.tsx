import { useState, useCallback } from 'react'
import { asistenciasService } from '@/services/asistencias.service'
import type { Asistencia } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Trash2, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'

const ACTIVIDAD_VARIANT: Record<string, 'default' | 'secondary' | 'warning' | 'success'> = {
  PILATES: 'default',
  FUNCIONAL: 'warning',
  MUSCULACION: 'success',
  LIBRE: 'secondary',
}

interface RegistroForm {
  socioId: string
  fecha: string
  tipoActividad: string
}

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(false)
  const [socioIdBusqueda, setSocioIdBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Asistencia | null>(null)
  const { toasts, toast, dismiss } = useToast()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RegistroForm>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      tipoActividad: 'LIBRE',
    }
  })

  const fetchAsistencias = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const now = new Date()
      const res = await asistenciasService.getBySocio(Number(id), now.getFullYear(), now.getMonth() + 1)
      setAsistencias(res)
    } catch {
      toast('Error al cargar asistencias', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBuscar = () => {
    if (socioIdBusqueda) fetchAsistencias(socioIdBusqueda)
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioIdBusqueda) return
    try {
      await asistenciasService.delete(Number(socioIdBusqueda), confirmDelete.asistenciaId)
      toast('Asistencia eliminada', 'success')
      setConfirmDelete(null)
      fetchAsistencias(socioIdBusqueda)
    } catch {
      toast('Error al eliminar asistencia', 'error')
    }
  }

  const onRegistrar = async (data: RegistroForm) => {
    try {
      await asistenciasService.registrar(Number(data.socioId), data.fecha, 'NORMAL', data.tipoActividad || undefined)
      toast('Asistencia registrada', 'success')
      setModalOpen(false)
      reset()
      if (data.socioId === socioIdBusqueda) fetchAsistencias(data.socioId)
    } catch {
      toast('Error al registrar asistencia', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Asistencias"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar asistencia
          </Button>
        }
      />

      {/* Búsqueda por socio */}
      <div className="flex items-end gap-3 mb-6">
        <Input
          id="socioId"
          label="ID del socio"
          type="number"
          value={socioIdBusqueda}
          onChange={(e) => setSocioIdBusqueda(e.target.value)}
          placeholder="Ej: 5"
          className="w-40"
        />
        <Button onClick={handleBuscar} variant="outline">Ver asistencias del mes</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : asistencias.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Fecha</TableTh>
              <TableTh>Tipo</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {asistencias.map((a) => (
              <TableRow key={a.asistenciaId}>
                <TableTd className="font-medium">{formatDate(a.fecha)}</TableTd>
                <TableTd>
                  <Badge variant={a.tipoAsistencia === 'RECUPERACION' ? 'warning' : 'default'}>
                    {a.tipoAsistencia}
                  </Badge>
                </TableTd>
                <TableTd>
                  {a.tipoActividad ? (
                    <Badge variant={ACTIVIDAD_VARIANT[a.tipoActividad] ?? 'secondary'}>
                      {a.tipoActividad}
                    </Badge>
                  ) : '—'}
                </TableTd>
                <TableTd>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(a)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : socioIdBusqueda ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin asistencias este mes</p>
      ) : null}

      {/* Modal registrar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar asistencia">
        <form onSubmit={handleSubmit(onRegistrar)} className="flex flex-col gap-4">
          <Input id="regSocioId" label="ID del socio" type="number" {...register('socioId', { required: true })} />
          <Input id="fecha" label="Fecha" type="date" {...register('fecha', { required: true })} />
          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad')}>
            <option value="LIBRE">Libre</option>
            <option value="PILATES">Pilates</option>
            <option value="FUNCIONAL">Funcional</option>
            <option value="MUSCULACION">Musculación</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Registrar</Button>
          </div>
        </form>
      </Modal>

      {/* Confirmar delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar asistencia">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar la asistencia del <strong>{confirmDelete ? formatDate(confirmDelete.fecha) : ''}</strong>?
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
