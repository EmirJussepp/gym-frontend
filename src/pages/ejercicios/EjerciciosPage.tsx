import { useState, useEffect, useCallback, useMemo } from 'react'
import { ejerciciosService } from '@/services/ejercicios.service'
import type { Ejercicio, GrupoMuscular } from '@/types'
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
import EjercicioForm from './EjercicioForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Ejercicio | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Ejercicio | null>(null)
  const { pagina, setPagina, porPagina } = usePagination(10)
  const { toasts, toast, dismiss } = useToast()

  const fetchEjercicios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ejerciciosService.getAll(pagina, porPagina)
      setEjercicios(res.data)
      setTotalPaginas(res.totalPaginas)
    } catch {
      toast('Error al cargar ejercicios', 'error')
    } finally {
      setLoading(false)
    }
  }, [pagina, porPagina])

  useEffect(() => { fetchEjercicios() }, [fetchEjercicios])

  useEffect(() => {
    ejerciciosService.getGruposMusculares()
      .then(setGrupos)
      .catch(() => toast('Error al cargar grupos', 'error'))
  }, [])

  // 🔥 MAP CORRECTO
  const gruposMap = useMemo(() => {
    return Object.fromEntries(grupos.map(g => [g.id, g.nombre]))
  }, [grupos])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await ejerciciosService.delete(confirmDelete.ejercicioId)
      toast('Ejercicio desactivado correctamente', 'success')
      setConfirmDelete(null)
      fetchEjercicios()
    } catch {
      toast('Error al eliminar ejercicio', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Ejercicios"
        action={
          <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nuevo ejercicio
          </Button>
        }
      />

      {loading ? <Spinner /> : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableTh>Nombre</TableTh>
                <TableTh>Grupo muscular</TableTh>
                <TableTh>Descripción</TableTh>
                <TableTh>Estado</TableTh>
                <TableTh />
              </TableRow>
            </TableHead>

            <TableBody>
              {ejercicios.map((e) => (
                <TableRow key={e.ejercicioId}>
                  <TableTd className="font-medium">{e.nombre}</TableTd>

                  {/* ✅ CORREGIDO */}
                  <TableTd>
                    <Badge variant="secondary">
                      {gruposMap[e.grupoMuscularId] || '—'}
                    </Badge>
                  </TableTd>

                  <TableTd className="text-muted-foreground max-w-xs truncate">
                    {e.descripcion ?? '—'}
                  </TableTd>

                  <TableTd>
                    <Badge variant={e.activo ? 'success' : 'danger'}>
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableTd>

                  <TableTd>
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => { setEditando(e); setModalOpen(true) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(e)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
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

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null) }}
        title={editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      >
        <EjercicioForm
          grupos={grupos}
          ejercicio={editando}
          onSaved={() => {
            setModalOpen(false)
            setEditando(null)
            toast(editando ? 'Ejercicio actualizado' : 'Ejercicio creado', 'success')
            fetchEjercicios()
          }}
          onCancel={() => { setModalOpen(false); setEditando(null) }}
        />
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Desactivar el ejercicio <strong>{confirmDelete?.nombre}</strong>?
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