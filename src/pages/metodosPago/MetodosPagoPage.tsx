import { useState, useEffect, useCallback } from 'react'
import { metodosPagoService, type MetodoPago } from '@/services/metodosPago.service'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, AlertCircle, Wallet, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
})
type FormData = z.infer<typeof schema>

export default function MetodosPagoPage() {
  const [metodos, setMetodos]             = useState<MetodoPago[]>([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editando, setEditando]           = useState<MetodoPago | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MetodoPago | null>(null)
  const { toasts, toast, dismiss }        = useToast()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const fetchMetodos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await metodosPagoService.getAll()
      setMetodos(data)
    } catch {
      toast('Error al cargar métodos de pago', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMetodos() }, [fetchMetodos])

  const abrirEditar = (m: MetodoPago) => {
    setEditando(m)
    reset({ nombre: m.nombre })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editando) {
        await metodosPagoService.update(editando.id, data.nombre)
        toast('Método de pago actualizado', 'success')
      } else {
        await metodosPagoService.create(data.nombre)
        toast('Método de pago creado', 'success')
      }
      setModalOpen(false)
      setEditando(null)
      reset()
      fetchMetodos()
    } catch {
      toast(editando ? 'Error al actualizar' : 'Error al crear método de pago', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await metodosPagoService.desactivar(confirmDelete.id)
      toast('Método de pago eliminado', 'success')
      setConfirmDelete(null)
      fetchMetodos()
    } catch {
      toast('Error al eliminar — puede estar en uso', 'error')
      setConfirmDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Métodos de pago"
        subtitle={`${metodos.length} métodos configurados`}
        action={
          <Button onClick={() => { setEditando(null); reset({ nombre: '' }); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nuevo método
          </Button>
        }
      />

      {loading ? <Spinner /> : metodos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin métodos de pago</p>
          <p className="text-sm mt-1">Creá al menos uno para poder registrar pagos de cuotas.</p>
          <Button className="mt-4" onClick={() => { reset(); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Crear primer método
          </Button>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>#</TableTh>
              <TableTh>Nombre</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {metodos.map(m => (
              <TableRow key={m.id}>
                <TableTd className="text-muted-foreground w-12">{m.id}</TableTd>
                <TableTd>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{m.nombre}</span>
                  </div>
                </TableTd>
                <TableTd>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEditar(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setConfirmDelete(m)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal crear / editar */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar método de pago' : 'Nuevo método de pago'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="nombre"
            label="Nombre"
            placeholder="Ej: Efectivo, Transferencia, Tarjeta débito..."
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); setEditando(null) }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear método'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar método de pago">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{confirmDelete?.nombre}</strong>?
            Si tiene pagos registrados, la operación fallará.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}