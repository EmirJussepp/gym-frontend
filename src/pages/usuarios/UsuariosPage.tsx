import { useState, useEffect, useCallback } from 'react'
import { usuariosService } from '@/services/usuarios.service'
import { rolesService } from '@/services/roles.service'
import type { Rol } from '@/types'
import type { UsuarioConRol } from '@/services/usuarios.service'
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
import { Plus, Trash2, AlertCircle, UserCog, Pencil, RotateCcw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schemaCrear = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId:   z.string().optional(),
})

const schemaEditar = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  roleId:   z.string().optional(),
  activo:   z.boolean().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
})

type FormCrear  = z.infer<typeof schemaCrear>
type FormEditar = z.infer<typeof schemaEditar>

export default function UsuariosPage() {
  const [usuarios, setUsuarios]           = useState<UsuarioConRol[]>([])
  const [roles, setRoles]                 = useState<Rol[]>([])
  const [loading, setLoading]             = useState(true)
  const [modalCrear, setModalCrear]       = useState(false)
  const [editando, setEditando]           = useState<UsuarioConRol | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UsuarioConRol | null>(null)
  const { toasts, toast, dismiss }        = useToast()

  const formCrear = useForm<FormCrear>({ resolver: zodResolver(schemaCrear) })
  const formEditar = useForm<FormEditar>({ resolver: zodResolver(schemaEditar) })

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const data = await usuariosService.getAll()
      setUsuarios(data)
    } catch {
      toast('Error al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])
  useEffect(() => {
    rolesService.getAll().then(setRoles).catch(() => {})
  }, [])

  const abrirEditar = (u: UsuarioConRol) => {
    setEditando(u)
    formEditar.reset({ nombre: u.nombre, email: u.email, roleId: u.roleId ? String(u.roleId) : '', activo: u.activo })
  }

  const onSubmitCrear = async (data: FormCrear) => {
    try {
      await usuariosService.crear({
        nombre:   data.nombre,
        email:    data.email,
        password: data.password,
        roleId:   data.roleId ? Number(data.roleId) : undefined,
      })
      toast('Usuario creado correctamente', 'success')
      setModalCrear(false)
      formCrear.reset()
      fetchUsuarios()
    } catch {
      toast('Error al crear usuario', 'error')
    }
  }

  const onSubmitEditar = async (data: FormEditar) => {
    if (!editando) return
    try {
      await usuariosService.update(editando.userId!, {
        nombre:   data.nombre,
        email:    data.email,
        roleId:   data.roleId ? Number(data.roleId) : undefined,
        activo:   data.activo ?? editando.activo,
        password: data.password || undefined,
      })
      toast('Usuario actualizado', 'success')
      setEditando(null)
      fetchUsuarios()
    } catch {
      toast('Error al actualizar usuario', 'error')
    }
  }

  const handleDesactivar = async () => {
    if (!confirmDelete) return
    try {
      await usuariosService.desactivar(confirmDelete.userId)
      toast('Usuario desactivado', 'success')
      setConfirmDelete(null)
      fetchUsuarios()
    } catch {
      toast('Error al desactivar usuario', 'error')
    }
  }

  const handleReactivar = async (u: UsuarioConRol) => {
    try {
      await usuariosService.update(u.userId!, {
        nombre: u.nombre,
        email:  u.email,
        roleId: u.roleId ?? undefined,
        activo: true,
      })
      toast(`${u.nombre} reactivado`, 'success')
      fetchUsuarios()
    } catch {
      toast('Error al reactivar usuario', 'error')
    }
  }

  const rolNombre = (roleId: number | null) =>
    roles.find(r => r.roleId === roleId)?.nombre ?? '—'

  return (
    <div>
      <PageHeader
        title="Usuarios del sistema"
        subtitle="Administradores y operadores"
        action={
          <Button onClick={() => { formCrear.reset(); setModalCrear(true) }}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <>
          {usuarios.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserCog className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay usuarios registrados.</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>Nombre</TableTh>
                  <TableTh>Email</TableTh>
                  <TableTh>Rol</TableTh>
                  <TableTh>Estado</TableTh>
                  <TableTh />
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map(u => (
                  <TableRow key={u.userId}>
                    <TableTd className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        {u.nombre}
                      </div>
                    </TableTd>
                    <TableTd className="text-muted-foreground">{u.email}</TableTd>
                    <TableTd>{rolNombre(u.roleId)}</TableTd>
                    <TableTd>
                      <Badge variant={u.activo ? 'success' : 'danger'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableTd>
                    <TableTd>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEditar(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {u.activo ? (
                          <Button variant="ghost" size="icon" title="Desactivar" onClick={() => setConfirmDelete(u)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Reactivar" onClick={() => handleReactivar(u)}>
                            <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        )}
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Modal crear */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo usuario">
        <form onSubmit={formCrear.handleSubmit(onSubmitCrear)} className="space-y-4">
          <Input id="nombre" label="Nombre completo" placeholder="Juan Pérez"
            error={formCrear.formState.errors.nombre?.message} {...formCrear.register('nombre')} />
          <Input id="email" label="Email" type="email" placeholder="juan@gym.com"
            error={formCrear.formState.errors.email?.message} {...formCrear.register('email')} />
          <Input id="password" label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
            error={formCrear.formState.errors.password?.message} {...formCrear.register('password')} />
          <Select id="roleId" label="Rol" {...formCrear.register('roleId')}>
            <option value="">Sin rol asignado</option>
            {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.nombre}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalCrear(false)}>Cancelar</Button>
            <Button type="submit" disabled={formCrear.formState.isSubmitting}>
              {formCrear.formState.isSubmitting ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar usuario">
        <form onSubmit={formEditar.handleSubmit(onSubmitEditar)} className="space-y-4">
          <Input id="edit-nombre" label="Nombre completo"
            error={formEditar.formState.errors.nombre?.message} {...formEditar.register('nombre')} />
          <Input id="edit-email" label="Email" type="email"
            error={formEditar.formState.errors.email?.message} {...formEditar.register('email')} />
          <Select id="edit-roleId" label="Rol" {...formEditar.register('roleId')}>
            <option value="">Sin rol asignado</option>
            {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.nombre}</option>)}
          </Select>
          <Input
            id="edit-password"
            label="Nueva contraseña"
            type="password"
            placeholder="Dejá vacío para no cambiarla"
            error={formEditar.formState.errors.password?.message}
            {...formEditar.register('password')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button type="submit" disabled={formEditar.formState.isSubmitting}>
              {formEditar.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar desactivar */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Desactivar usuario">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            ¿Desactivar al usuario <strong>{confirmDelete?.nombre}</strong>?
            No podrá iniciar sesión hasta que se reactive manualmente.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDesactivar}>Desactivar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}