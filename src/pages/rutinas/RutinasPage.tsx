import { useState, useEffect, useCallback } from 'react'
import { rutinasService } from '@/services/rutinas.service'
import type { Rutina } from '@/types'
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
import RutinaForm from './RutinaForm'
import RutinaEjerciciosModal from './RutinaEjerciciosModal'
import { Plus, Pencil, Trash2, Dumbbell } from 'lucide-react'

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Rutina | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Rutina | null>(null)
  const [ejerciciosModal, setEjerciciosModal] = useState<Rutina | null>(null)
  const { pagina, setPagina, porPagina } = usePagination(10)
  const { toasts, toast, dismiss } = useToast()

  const fetchRutinas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await rutinasService.getAll(pagina, porPagina)
      setRutinas(res.data)
      setTotalPaginas(res.totalPaginas)
    } catch {
      toast('Error al cargar rutinas', 'error')
    } finally {
      setLoading(false)
    }
  }, [pagina, porPagina])

  useEffect(() => { fetchRutinas() }, [fetchRutinas])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await rutinasService.delete(confirmDelete.rutinaId)
      toast('Rutina desactivada correctamente', 'success')
      setConfirmDelete(null)
      fetchRutinas()
    } catch {
      toast('Error al eliminar rutina', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Rutinas"
        subtitle={`${rutinas.length} rutinas cargadas`}
        action={
          <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nueva rutina
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Nombre</TableTh>
                <TableTh>Descripción</TableTh>
                <TableTh>Estado</TableTh>
                <TableTh />
              </TableRow>
            </TableHead>
            <TableBody>
              {rutinas.map((r) => (
                <TableRow key={r.rutinaId}>
                  <TableTd className="font-medium">{r.nombre}</TableTd>
                  <TableTd className="text-muted-foreground max-w-xs truncate">{r.descripcion ?? '—'}</TableTd>
                  <TableTd>
                    <Badge variant={r.activo ? 'success' : 'danger'}>
                      {r.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableTd>
                  <TableTd>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" title="Ver ejercicios" onClick={() => setEjerciciosModal(r)}>
                        <Dumbbell className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditando(r); setModalOpen(true) }}>
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
          <Pagination pagina={pagina} totalPaginas={totalPaginas} onPrev={() => setPagina(p => p - 1)} onNext={() => setPagina(p => p + 1)} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar rutina' : 'Nueva rutina'}>
        <RutinaForm
          rutina={editando}
          onSaved={() => { setModalOpen(false); setEditando(null); toast(editando ? 'Rutina actualizada' : 'Rutina creada', 'success'); fetchRutinas() }}
          onCancel={() => { setModalOpen(false); setEditando(null) }}
        />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">¿Desactivar la rutina <strong>{confirmDelete?.nombre}</strong>?</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
        </div>
      </Modal>

      {ejerciciosModal && (
        <RutinaEjerciciosModal
          open={!!ejerciciosModal}
          onClose={() => setEjerciciosModal(null)}
          rutinaId={ejerciciosModal.rutinaId}
          rutinaNombre={ejerciciosModal.nombre}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
