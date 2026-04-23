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
import { Plus, Trash2, AlertCircle, UserCog } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roleId:   z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function UsuariosPage() {
  const [usuarios, setUsuarios]         = useState<UsuarioConRol[]>([])
  const [roles, setRoles]               = useState<Rol[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UsuarioConRol | null>(null)
  const { toasts, toast, dismiss }      = useToast()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

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

  const onSubmit = async (data: FormData) => {
    try {
      await usuariosService.crear({
        nombre:   data.nombre,
        email:    data.email,
        password: data.password,
        roleId:   data.roleId ? Number(data.roleId) : undefined,
      })
      toast('Usuario creado correctamente', 'success')
      setModalOpen(false)
      reset()
      fetchUsuarios()
    } catch {
      toast('Error al crear usuario', 'error')
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

  const rolNombre = (roleId: number | null) =>
    roles.find(r => r.roleId === roleId)?.nombre ?? '—'

  return (
    <div>
      <PageHeader
        title="Usuarios del sistema"
        subtitle="Administradores y operadores"
        action={
          <Button onClick={() => { reset(); setModalOpen(true) }}>
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
                      {u.activo && (
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(u)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Modal crear */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo usuario">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="nombre"
            label="Nombre completo"
            placeholder="Juan Pérez"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="juan@gym.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select id="roleId" label="Rol" {...register('roleId')}>
            <option value="">Sin rol asignado</option>
            {roles.map(r => (
              <option key={r.roleId} value={r.roleId}>{r.nombre}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear usuario'}
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