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
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useIsAdmin } from '@/hooks/useRole'

const TODAS_ACTIVIDADES = ['LIBRE', 'PILATES', 'FUNCIONAL', 'MUSCULACION']

export default function PlanesPage() {
  const esAdmin                           = useIsAdmin()
  const [planes, setPlanes]               = useState<Plan[]>([])
  const [totalPaginas, setTotalPaginas]   = useState(1)
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [editando, setEditando]           = useState<Plan | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)
  // actividades
  const [planActividades, setPlanActividades]         = useState<Plan | null>(null)
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState<string[]>([])
  const [loadingActividades, setLoadingActividades]   = useState(false)
  const [savingActividades, setSavingActividades]     = useState(false)

  const { pagina, setPagina, porPagina } = usePagination(10)
  const { toasts, toast, dismiss }       = useToast()

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

  // ── Gestión de actividades ──
  const abrirActividades = async (plan: Plan) => {
    setPlanActividades(plan)
    setLoadingActividades(true)
    try {
      const acts = await planesService.getActividades(plan.planId)
      setActividadesSeleccionadas(acts)
    } catch {
      setActividadesSeleccionadas([])
    } finally {
      setLoadingActividades(false)
    }
  }

  const toggleActividad = (act: string) => {
    setActividadesSeleccionadas(prev =>
      prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]
    )
  }

  const guardarActividades = async () => {
    if (!planActividades) return
    setSavingActividades(true)
    try {
      await planesService.setActividades(planActividades.planId, actividadesSeleccionadas)
      toast('Actividades actualizadas', 'success')
      setPlanActividades(null)
    } catch {
      toast('Error al guardar actividades', 'error')
    } finally {
      setSavingActividades(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Planes"
        action={
          esAdmin ? (
            <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
              <Plus className="h-4 w-4" /> Nuevo plan
            </Button>
          ) : undefined
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
                      {esAdmin && (
                        <Button variant="ghost" size="icon" title="Actividades" onClick={() => abrirActividades(p)}>
                          <ListChecks className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {esAdmin && (
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditando(p); setModalOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {esAdmin && (
                        <Button variant="ghost" size="icon" title="Desactivar" onClick={() => setConfirmDelete(p)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableTd>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            onPrev={() => setPagina(p => p - 1)}
            onNext={() => setPagina(p => p + 1)}
          />
        </>
      )}

      {/* Modal crear / editar plan */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditando(null) }} title={editando ? 'Editar plan' : 'Nuevo plan'}>
        <PlanForm
          plan={editando}
          onSaved={() => {
            setModalOpen(false)
            setEditando(null)
            toast(editando ? 'Plan actualizado' : 'Plan creado', 'success')
            fetchPlanes()
          }}
          onCancel={() => { setModalOpen(false); setEditando(null) }}
        />
      </Modal>

      {/* Modal gestión de actividades */}
      <Modal
        open={!!planActividades}
        onClose={() => setPlanActividades(null)}
        title={`Actividades — ${planActividades?.nombre ?? ''}`}
      >
        {loadingActividades ? (
          <div className="py-6 flex justify-center"><Spinner /></div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seleccioná las actividades incluidas en este plan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TODAS_ACTIVIDADES.map(act => {
                const activo = actividadesSeleccionadas.includes(act)
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleActividad(act)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                      ${activo
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    <span className={`h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors
                      ${activo ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                    >
                      {activo && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    {act}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPlanActividades(null)}>Cancelar</Button>
              <Button onClick={guardarActividades} disabled={savingActividades}>
                {savingActividades ? 'Guardando...' : 'Guardar actividades'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal confirmar desactivar */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Desactivar el plan <strong>{confirmDelete?.nombre}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Desactivar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
