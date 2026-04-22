import { useState, useEffect, useCallback } from 'react'
import { gruposMuscularesService } from '@/services/gruposMusculares.service'
import type { GrupoMuscular } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

export default function GruposMuscularesPage() {
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<GrupoMuscular | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<GrupoMuscular | null>(null)
  const { toasts, toast, dismiss } = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<{ nombre: string }>()

  const fetchGrupos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await gruposMuscularesService.getAll()
      setGrupos(res)
    } catch {
      toast('Error al cargar grupos musculares', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGrupos() }, [fetchGrupos])

  const openModal = (grupo?: GrupoMuscular) => {
    setEditando(grupo ?? null)
    reset({ nombre: grupo?.nombre ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: { nombre: string }) => {
    try {
      if (editando) {
        await gruposMuscularesService.update(editando.grupoMuscularId, data.nombre)
        toast('Grupo muscular actualizado', 'success')
      } else {
        await gruposMuscularesService.create(data.nombre)
        toast('Grupo muscular creado', 'success')
      }
      setModalOpen(false)
      fetchGrupos()
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await gruposMuscularesService.delete(confirmDelete.grupoMuscularId)
      toast('Grupo muscular eliminado', 'success')
      setConfirmDelete(null)
      fetchGrupos()
    } catch {
      toast('Error al eliminar — puede tener ejercicios asociados', 'error')
      setConfirmDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Grupos Musculares"
        subtitle={`${grupos.length} grupos cargados`}
        action={
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4" /> Nuevo grupo
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>#</TableTh>
              <TableTh>Nombre</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.map((g) => (
              <TableRow key={g.grupoMuscularId}>
                <TableTd className="text-muted-foreground">{g.grupoMuscularId}</TableTd>
                <TableTd className="font-medium">{g.nombre}</TableTd>
                <TableTd>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openModal(g)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(g)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar grupo muscular' : 'Nuevo grupo muscular'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            id="nombre"
            label="Nombre"
            placeholder="Ej: Pecho, Espalda, Piernas..."
            error={errors.nombre?.message}
            {...register('nombre', { required: 'Requerido' })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear grupo'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar el grupo muscular <strong>{confirmDelete?.nombre}</strong>?
          Solo se puede eliminar si no tiene ejercicios asociados.
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
