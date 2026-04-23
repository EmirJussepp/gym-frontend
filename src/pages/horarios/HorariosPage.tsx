import { useState, useEffect, useCallback } from 'react'
import { horariosService, getDiaNombre, type Horario } from '@/services/horarios.service'
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
import { Plus, Trash2, Search, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface HorarioForm {
  diaSemana: number
  horaInicio: string
  tipoActividad: string
}

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const ACTIVIDADES = ['LIBRE','PILATES','FUNCIONAL','MUSCULACION']

export default function HorariosPage() {
  const [horarios, setHorarios]               = useState<Horario[]>([])
  const [socios, setSocios]                   = useState<Socio[]>([])
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null)
  const [busqueda, setBusqueda]               = useState('')
  const [sociosFiltrados, setSociosFiltrados] = useState<Socio[]>([])
  const [loading, setLoading]                 = useState(false)
  const [modalOpen, setModalOpen]             = useState(false)
  const [confirmDelete, setConfirmDelete]     = useState<Horario | null>(null)
  const { toasts, toast, dismiss }            = useToast()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<HorarioForm>({
    defaultValues: { diaSemana: 1, tipoActividad: 'LIBRE' }
  })

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

  const fetchHorarios = useCallback(async (socio: Socio) => {
    setLoading(true)
    try {
      const res = await horariosService.getBySocio(socio.socioId)
      setHorarios(res)
    } catch {
      toast('Error al cargar horarios', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const seleccionarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio)
    setBusqueda(`${socio.nombre} ${socio.apellido}`)
    setSociosFiltrados([])
    fetchHorarios(socio)
  }

  const onSubmit = async (data: HorarioForm) => {
    if (!socioSeleccionado) return
    try {
      await horariosService.create(
        socioSeleccionado.socioId,
        Number(data.diaSemana),
        data.horaInicio,
        data.tipoActividad
      )
      toast('Horario creado', 'success')
      setModalOpen(false)
      reset()
      fetchHorarios(socioSeleccionado)
    } catch {
      toast('Error al crear horario', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioSeleccionado) return
    try {
      await horariosService.delete(socioSeleccionado.socioId, confirmDelete.horarioId)
      toast('Horario eliminado', 'success')
      setConfirmDelete(null)
      fetchHorarios(socioSeleccionado)
    } catch {
      toast('Error al eliminar horario', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Horarios"
        subtitle={socioSeleccionado
          ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido} — ${horarios.length} horario${horarios.length !== 1 ? 's' : ''}`
          : 'Horarios habituales por socio'}
        action={
          socioSeleccionado && (
            <Button onClick={() => { reset(); setModalOpen(true) }}>
              <Plus className="h-4 w-4" /> Agregar horario
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
              if (!e.target.value) { setSocioSeleccionado(null); setHorarios([]) }
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

      {/* Contenido */}
      {!socioSeleccionado ? (
        <div className="text-center py-20 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Buscá un socio para ver sus horarios</p>
        </div>
      ) : loading ? <Spinner /> : horarios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Sin horarios registrados</p>
          <Button variant="outline" className="mt-3" onClick={() => { reset(); setModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Agregar primer horario
          </Button>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Día</TableTh>
              <TableTh>Hora</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {[...horarios].sort((a, b) => a.diaSemana - b.diaSemana).map(h => (
              <TableRow key={h.horarioId}>
                <TableTd className="font-medium">{getDiaNombre(h.diaSemana)}</TableTd>
                <TableTd>{h.horaInicio}</TableTd>
                <TableTd>
                  <Badge variant="secondary">{h.tipoActividad}</Badge>
                </TableTd>
                <TableTd>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(h)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar horario">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select id="diaSemana" label="Día de la semana" {...register('diaSemana')}>
            {DIAS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
          </Select>
          <Input
            id="horaInicio"
            label="Hora de inicio"
            type="time"
            {...register('horaInicio', { required: true })}
          />
          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad')}>
            {ACTIVIDADES.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar horario">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar el horario del <strong>{confirmDelete ? getDiaNombre(confirmDelete.diaSemana) : ''}</strong> a las{' '}
          <strong>{confirmDelete?.horaInicio}</strong>?
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