import { useState, useEffect, useCallback } from 'react'
import { rolesService } from '@/services/roles.service'
import type { Rol } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre:      z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
})
type RolForm = z.infer<typeof schema>

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Rol | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Rol | null>(null)
  const { toasts, toast, dismiss } = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<RolForm>({
    resolver: zodResolver(schema),
  })

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await rolesService.getAll()
      setRoles(res)
    } catch {
      toast('Error al cargar roles', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const abrirEditar = (rol: Rol) => {
    setEditando(rol)
    reset({ nombre: rol.nombre, descripcion: rol.descripcion ?? '' })
    setModalOpen(true)
  }

  const onSubmit = async (data: RolForm) => {
    try {
      if (editando) {
        await rolesService.update(editando.roleId, data.nombre, data.descripcion)
        toast('Rol actualizado', 'success')
      } else {
        await rolesService.create(data.nombre, data.descripcion)
        toast('Rol creado', 'success')
      }
      setModalOpen(false)
      setEditando(null)
      reset()
      fetchRoles()
    } catch {
      toast(editando ? 'Error al actualizar rol' : 'Error al crear rol', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await rolesService.delete(confirmDelete.roleId)
      toast('Rol eliminado', 'success')
      setConfirmDelete(null)
      fetchRoles()
    } catch {
      toast('Error al eliminar — puede tener usuarios asociados', 'error')
      setConfirmDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        subtitle={`${roles.length} roles cargados`}
        action={
          <Button onClick={() => { setEditando(null); reset({ nombre: '', descripcion: '' }); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nuevo rol
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>#</TableTh>
              <TableTh>Nombre</TableTh>
              <TableTh>Descripción</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.roleId}>
                <TableTd className="text-muted-foreground">{r.roleId}</TableTd>
                <TableTd className="font-medium">{r.nombre}</TableTd>
                <TableTd className="text-muted-foreground">{r.descripcion ?? '—'}</TableTd>
                <TableTd>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => abrirEditar(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar rol' : 'Nuevo rol'}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            id="nombre"
            label="Nombre"
            placeholder="Ej: Admin, Recepcionista..."
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input id="descripcion" label="Descripción" {...register('descripcion')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditando(null) }}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editando ? 'Guardar cambios' : 'Crear rol'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar el rol <strong>{confirmDelete?.nombre}</strong>?
          Solo se puede eliminar si no tiene usuarios asociados.
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
