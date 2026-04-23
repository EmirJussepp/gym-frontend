import { useState, useEffect, useCallback } from 'react'
import { recuperacionesService, type Recuperacion } from '@/services/recuperaciones.service'
import { sociosService } from '@/services/socios.service'
import type { Socio } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Plus, Trash2, Search, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'

const ESTADO_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDIENTE: 'warning', UTILIZADA: 'success', VENCIDA: 'danger',
}
const ACTIVIDADES = ['LIBRE','PILATES','FUNCIONAL','MUSCULACION']

interface RecupForm {
  fechaClaseOriginal: string
  tipoActividad: string
  fechaVencimiento: string
}

export default function RecuperacionesPage() {
  const [recuperaciones, setRecuperaciones]     = useState<Recuperacion[]>([])
  const [socios, setSocios]                     = useState<Socio[]>([])
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null)
  const [busqueda, setBusqueda]                 = useState('')
  const [sociosFiltrados, setSociosFiltrados]   = useState<Socio[]>([])
  const [loading, setLoading]                   = useState(false)
  const [modalOpen, setModalOpen]               = useState(false)
  const [confirmDelete, setConfirmDelete]       = useState<Recuperacion | null>(null)
  const { toasts, toast, dismiss }              = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<RecupForm>()

  useEffect(() => {
    sociosService.getAll(1, 200).then(r => setSocios(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!busqueda.trim()) { setSociosFiltrados([]); return }
    const q = busqueda.toLowerCase()
    setSociosFiltrados(
      socios.filter(s =>
        `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) || s.dni.includes(q)
      ).slice(0, 6)
    )
  }, [busqueda, socios])

  const fetchRecuperaciones = useCallback(async (socio: Socio) => {
    setLoading(true)
    try {
      const res = await recuperacionesService.getBySocio(socio.socioId)
      setRecuperaciones(res)
    } catch {
      toast('Error al cargar recuperaciones', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const seleccionarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio)
    setBusqueda(`${socio.nombre} ${socio.apellido}`)
    setSociosFiltrados([])
    fetchRecuperaciones(socio)
  }

  const onSubmit = async (data: RecupForm) => {
    if (!socioSeleccionado) return
    try {
      await recuperacionesService.create(
        socioSeleccionado.socioId,
        data.fechaClaseOriginal,
        data.tipoActividad,
        data.fechaVencimiento
      )
      toast('Recuperación creada', 'success')
      setModalOpen(false)
      reset()
      fetchRecuperaciones(socioSeleccionado)
    } catch {
      toast('Error al crear recuperación', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioSeleccionado) return
    try {
      await recuperacionesService.delete(socioSeleccionado.socioId, confirmDelete.recuperacionId)
      toast('Recuperación eliminada', 'success')
      setConfirmDelete(null)
      fetchRecuperaciones(socioSeleccionado)
    } catch {
      toast('Error al eliminar', 'error')
    }
  }

  // Fecha vencimiento default = 30 días desde hoy
  const fechaVencimientoDefault = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  return (
    <div>
      <PageHeader
        title="Recuperaciones"
        subtitle={socioSeleccionado
          ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido} — ${recuperaciones.filter(r => r.estado === 'PENDIENTE').length} pendiente${recuperaciones.filter(r => r.estado === 'PENDIENTE').length !== 1 ? 's' : ''}`
          : 'Clases de recuperación por socio'}
        action={
          socioSeleccionado && (
            <Button onClick={() => {
              reset({ fechaVencimiento: fechaVencimientoDefault(), tipoActividad: 'LIBRE' })
              setModalOpen(true)
            }}>
              <Plus className="h-4 w-4" /> Nueva recuperación
            </Button>
          )
        }
      />

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Buscar socio por nombre o DNI..."
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value)
              if (!e.target.value) { setSocioSeleccionado(null); setRecuperaciones([]) }
            }}
          />
        </div>
        {sociosFiltrados.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
            {sociosFiltrados.map(s => (
              <button
                key={s.socioId}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() => seleccionarSocio(s)}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {s.nombre.charAt(0)}{s.apellido.charAt(0)}
                </div>
                <span className="font-medium">{s.nombre} {s.apellido}</span>
                <span className="ml-auto text-muted-foreground text-xs">DNI {s.dni}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!socioSeleccionado ? (
        <div className="text-center py-20 text-muted-foreground">
          <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Buscá un socio para ver sus recuperaciones</p>
        </div>
      ) : loading ? <Spinner /> : recuperaciones.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Sin recuperaciones registradas</p>
          <Button variant="outline" className="mt-3" onClick={() => {
            reset({ fechaVencimiento: fechaVencimientoDefault(), tipoActividad: 'LIBRE' })
            setModalOpen(true)
          }}>
            <Plus className="h-4 w-4" /> Crear primera recuperación
          </Button>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Clase original</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh>Estado</TableTh>
              <TableTh>Vence</TableTh>
              <TableTh>Recuperada</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {recuperaciones.map(r => (
              <TableRow key={r.recuperacionId}>
                <TableTd className="font-medium">{formatDate(r.fechaClaseOriginal)}</TableTd>
                <TableTd><Badge variant="secondary">{r.tipoActividad}</Badge></TableTd>
                <TableTd>
                  <Badge variant={ESTADO_VARIANT[r.estado] ?? 'secondary'}>{r.estado}</Badge>
                </TableTd>
                <TableTd>{formatDate(r.fechaVencimiento)}</TableTd>
                <TableTd>{r.fechaRecuperacion ? formatDate(r.fechaRecuperacion) : '—'}</TableTd>
                <TableTd>
                  {r.estado === 'PENDIENTE' && (
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva recuperación">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="fechaClaseOriginal"
            label="Fecha de la clase que faltó"
            type="date"
            {...register('fechaClaseOriginal', { required: true })}
          />
          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad', { required: true })}>
            {ACTIVIDADES.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Input
            id="fechaVencimiento"
            label="Recuperar antes del"
            type="date"
            {...register('fechaVencimiento', { required: true })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear recuperación'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar recuperación">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar la recuperación del{' '}
          <strong>{confirmDelete ? formatDate(confirmDelete.fechaClaseOriginal) : ''}</strong>?
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