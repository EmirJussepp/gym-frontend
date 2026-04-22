import { useState, useEffect, useCallback } from 'react'
import { sociosService } from '@/services/socios.service'
import { planesService } from '@/services/planes.service'
import type { Socio, Plan } from '@/types'
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
import SocioForm from './SocioForm'
import SocioRutinaModal from './SocioRutinaModal'
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ESTADO_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  ACTIVO: 'success',
  INACTIVO: 'danger',
  SUSPENDIDO: 'warning',
}

export default function SociosPage() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Socio | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Socio | null>(null)
  const [rutinaModal, setRutinaModal] = useState<Socio | null>(null)
  const { pagina, setPagina, porPagina } = usePagination(10)
  const { toasts, toast, dismiss } = useToast()

  const fetchSocios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await sociosService.getAll(pagina, porPagina)
      setSocios(res.data)
      setTotalPaginas(res.totalPaginas)
    } catch {
      toast('Error al cargar socios', 'error')
    } finally {
      setLoading(false)
    }
  }, [pagina, porPagina])

  useEffect(() => { fetchSocios() }, [fetchSocios])
  useEffect(() => {
    planesService.getAll().then(r => setPlanes(r.data)).catch(() => {})
  }, [])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await sociosService.delete(confirmDelete.socioId)
      toast('Socio desactivado correctamente', 'success')
      setConfirmDelete(null)
      fetchSocios()
    } catch {
      toast('Error al eliminar socio', 'error')
    }
  }

  const planNombre = (planId: number) =>
    planes.find(p => p.planId === planId)?.nombre ?? `Plan #${planId}`

  return (
    <div>
      <PageHeader
        title="Socios"
        subtitle={`${socios.length} socios cargados`}
        action={
          <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nuevo socio
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Nombre</TableTh>
                <TableTh>DNI</TableTh>
                <TableTh>Plan</TableTh>
                <TableTh>Estado</TableTh>
                <TableTh>Última asistencia</TableTh>
                <TableTh />
              </TableRow>
            </TableHead>
            <TableBody>
              {socios.map(s => (
                <TableRow key={s.socioId}>
                  <TableTd>
                    <div className="font-medium">{s.apellido}, {s.nombre}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </TableTd>
                  <TableTd>{s.dni}</TableTd>
                  <TableTd>{planNombre(s.planId)}</TableTd>
                  <TableTd>
                    <Badge variant={ESTADO_VARIANT[s.estado] ?? 'secondary'}>{s.estado}</Badge>
                  </TableTd>
                  <TableTd>{s.ultimaAsistenciaFecha ? formatDate(s.ultimaAsistenciaFecha) : '—'}</TableTd>
                  <TableTd>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" title="Rutinas" onClick={() => setRutinaModal(s)}>
                        <ListChecks className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditando(s); setModalOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(s)}>
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

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar socio' : 'Nuevo socio'} className="max-w-2xl">
        <SocioForm
          planes={planes}
          socio={editando}
          onSaved={() => { setModalOpen(false); setEditando(null); toast(editando ? 'Socio actualizado' : 'Socio creado', 'success'); fetchSocios() }}
          onCancel={() => { setModalOpen(false); setEditando(null) }}
        />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Desactivar a <strong>{confirmDelete?.nombre} {confirmDelete?.apellido}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
        </div>
      </Modal>

      {rutinaModal && (
        <SocioRutinaModal
          open={!!rutinaModal}
          onClose={() => setRutinaModal(null)}
          socioId={rutinaModal.socioId}
          socioNombre={`${rutinaModal.nombre} ${rutinaModal.apellido}`}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
