import { useState, useEffect, useCallback } from 'react'
import { planesService } from '@/services/planes.service'
import type { Plan } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { usePagination } from '@/hooks/usePagination'
import PlanForm from './PlanForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Plan | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)
  const { pagina, setPagina, porPagina } = usePagination(10)
  const { toasts, toast, dismiss } = useToast()

  const fetchPlanes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await planesService.getAll(pagina, porPagina)
      setPlanes(res.data)
      setTotalPaginas(res.totalPaginas)
    } catch {
      toast('Error al cargar planes', 'error')
    } finally {
      setLoading(false)
    }
  }, [pagina, porPagina])

  useEffect(() => { fetchPlanes() }, [fetchPlanes])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await planesService.delete(confirmDelete.planId)
      toast('Plan desactivado correctamente', 'success')
      setConfirmDelete(null)
      fetchPlanes()
    } catch {
      toast('Error al eliminar plan', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Planes"
        action={
          <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nuevo plan
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Nombre</TableTh>
                <TableTh>Precio</TableTh>
                <TableTh>Días/semana</TableTh>
                <TableTh>Tipo</TableTh>
                <TableTh>Estado</TableTh>
                <TableTh />
              </TableRow>
            </TableHead>
            <TableBody>
              {planes.map((p) => (
                <TableRow key={p.planId}>
                  <TableTd className="font-medium">{p.nombre}</TableTd>
                  <TableTd>{formatCurrency(p.precio)}</TableTd>
                  <TableTd>{p.esLibre ? '—' : p.diasPorSemana}</TableTd>
                  <TableTd>
                    <Badge variant={p.esLibre ? 'default' : 'secondary'}>
                      {p.esLibre ? 'Libre' : 'Fijo'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <Badge variant={p.activo ? 'success' : 'danger'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => { setEditando(p); setModalOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} onPrev={() => setPagina(p => p - 1)} onNext={() => setPagina(p => p + 1)} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar plan' : 'Nuevo plan'}>
        <PlanForm plan={editando} onSaved={() => { setModalOpen(false); setEditando(null); toast(editando ? 'Plan actualizado' : 'Plan creado', 'success'); fetchPlanes() }} onCancel={() => { setModalOpen(false); setEditando(null) }} />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">¿Desactivar el plan <strong>{confirmDelete?.nombre}</strong>?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
