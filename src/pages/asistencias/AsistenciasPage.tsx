import { useState, useEffect, useCallback } from 'react'
import { asistenciasService } from '@/services/asistencias.service'
import { recuperacionesService, type Recuperacion } from '@/services/recuperaciones.service'
import { sociosService } from '@/services/socios.service'
import type { Asistencia, Socio } from '@/types'
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
import { Trash2, Plus, Search, CalendarCheck, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useForm, useWatch } from 'react-hook-form'

const TIPO_VARIANT: Record<string, 'default' | 'warning'> = {
  NORMAL: 'default',
  RECUPERACION: 'warning',
}
const ACTIVIDADES = ['LIBRE', 'MUSCULACION', 'PILATES', 'FUNCIONAL']

interface RegistroForm {
  socioId: string
  fecha: string
  tipoAsistencia: string
  tipoActividad: string
  recuperacionId: string
}

export default function AsistenciasPage() {
  const [asistencias, setAsistencias]         = useState<Asistencia[]>([])
  const [socios, setSocios]                   = useState<Socio[]>([])
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null)
  const [busqueda, setBusqueda]               = useState('')
  const [sociosFiltrados, setSociosFiltrados] = useState<Socio[]>([])
  const [recuperacionesPendientes, setRecuperacionesPendientes] = useState<Recuperacion[]>([])
  const [loading, setLoading]                 = useState(false)
  const [modalOpen, setModalOpen]             = useState(false)
  const [confirmDelete, setConfirmDelete]     = useState<Asistencia | null>(null)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [mes, setMes]   = useState(new Date().getMonth() + 1)
  const { toasts, toast, dismiss } = useToast()

  const { register, handleSubmit, reset, setValue, control, formState: { isSubmitting } } = useForm<RegistroForm>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      tipoAsistencia: 'NORMAL',
      tipoActividad: 'LIBRE',
      recuperacionId: '',
    }
  })

  // Observar el tipo de asistencia para mostrar/ocultar selector de recuperación
  const tipoAsistencia = useWatch({ control, name: 'tipoAsistencia' })
  const socioIdForm    = useWatch({ control, name: 'socioId' })

  useEffect(() => {
    sociosService.getAll(1, 200).then(r => setSocios(r.data)).catch(() => {})
  }, [])

  // Cuando cambia el socio en el form, cargar sus recuperaciones pendientes
  useEffect(() => {
    if (!socioIdForm) { setRecuperacionesPendientes([]); return }
    recuperacionesService.getBySocio(Number(socioIdForm), 'PENDIENTE')
      .then(setRecuperacionesPendientes)
      .catch(() => setRecuperacionesPendientes([]))
  }, [socioIdForm])

  // Cuando cambia el tipo a RECUPERACION, pre-seleccionar la primera pendiente
  useEffect(() => {
    if (tipoAsistencia === 'RECUPERACION' && recuperacionesPendientes.length > 0) {
      setValue('recuperacionId', String(recuperacionesPendientes[0].recuperacionId))
      setValue('tipoActividad', recuperacionesPendientes[0].tipoActividad)
    } else if (tipoAsistencia === 'NORMAL') {
      setValue('recuperacionId', '')
    }
  }, [tipoAsistencia, recuperacionesPendientes])

  useEffect(() => {
    if (!busqueda.trim()) { setSociosFiltrados([]); return }
    const q = busqueda.toLowerCase()
    setSociosFiltrados(
      socios.filter(s =>
        `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) || s.dni.includes(q)
      ).slice(0, 6)
    )
  }, [busqueda, socios])

  const fetchAsistencias = useCallback(async (socio: Socio, a: number, m: number) => {
    setLoading(true)
    try {
      const res = await asistenciasService.getBySocio(socio.socioId, a, m)
      setAsistencias(res)
    } catch {
      toast('Error al cargar asistencias', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const seleccionarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio)
    setBusqueda(`${socio.nombre} ${socio.apellido}`)
    setSociosFiltrados([])
    fetchAsistencias(socio, anio, mes)
  }

  const cambiarMes = (nuevoAnio: number, nuevoMes: number) => {
    setAnio(nuevoAnio)
    setMes(nuevoMes)
    if (socioSeleccionado) fetchAsistencias(socioSeleccionado, nuevoAnio, nuevoMes)
  }

  const irMesAnterior = () => mes === 1 ? cambiarMes(anio - 1, 12) : cambiarMes(anio, mes - 1)
  const irMesSiguiente = () => mes === 12 ? cambiarMes(anio + 1, 1) : cambiarMes(anio, mes + 1)

  const abrirModalRegistrar = () => {
    reset({
      fecha: new Date().toISOString().split('T')[0],
      tipoAsistencia: 'NORMAL',
      tipoActividad: 'LIBRE',
      recuperacionId: '',
      socioId: socioSeleccionado ? String(socioSeleccionado.socioId) : '',
    })
    setModalOpen(true)
  }

  const onRegistrar = async (data: RegistroForm) => {
    // Validar que si es RECUPERACION tenga recuperacionId
    if (data.tipoAsistencia === 'RECUPERACION' && !data.recuperacionId) {
      toast('Seleccioná una recuperación pendiente', 'error')
      return
    }
    try {
      await asistenciasService.registrar(
        Number(data.socioId),
        data.fecha,
        data.tipoAsistencia,
        data.tipoActividad || undefined,
        data.recuperacionId ? Number(data.recuperacionId) : undefined
      )
      toast('Asistencia registrada', 'success')
      setModalOpen(false)
      reset()
      // Refrescar si el socio registrado es el que estamos viendo
      if (socioSeleccionado && Number(data.socioId) === socioSeleccionado.socioId) {
        fetchAsistencias(socioSeleccionado, anio, mes)
      }
    } catch {
      toast('Error al registrar asistencia', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete || !socioSeleccionado) return
    try {
      await asistenciasService.delete(socioSeleccionado.socioId, confirmDelete.asistenciaId)
      toast('Asistencia eliminada', 'success')
      setConfirmDelete(null)
      fetchAsistencias(socioSeleccionado, anio, mes)
    } catch {
      toast('Error al eliminar asistencia', 'error')
    }
  }

  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  return (
    <div>
      <PageHeader
        title="Asistencias"
        subtitle={socioSeleccionado
          ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido} — ${asistencias.length} este mes`
          : 'Buscá un socio para ver sus asistencias'}
        action={
          <Button onClick={abrirModalRegistrar}>
            <Plus className="h-4 w-4" /> Registrar
          </Button>
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
              if (!e.target.value) { setSocioSeleccionado(null); setAsistencias([]) }
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
                <div>
                  <span className="font-medium">{s.nombre} {s.apellido}</span>
                  <span className="ml-2 text-muted-foreground text-xs">DNI {s.dni}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navegación mes */}
      {socioSeleccionado && (
        <div className="flex items-center gap-3 mb-5">
          <Button variant="outline" size="sm" onClick={irMesAnterior}>←</Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <Button variant="outline" size="sm" onClick={irMesSiguiente}>→</Button>
          <span className="text-xs text-muted-foreground ml-2">
            {asistencias.length} asistencia{asistencias.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Contenido */}
      {!socioSeleccionado ? (
        <div className="text-center py-20 text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Buscá un socio para ver sus asistencias</p>
        </div>
      ) : loading ? <Spinner /> : asistencias.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>Sin asistencias en {MESES[mes - 1]} {anio}</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Fecha</TableTh>
              <TableTh>Tipo</TableTh>
              <TableTh>Actividad</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {asistencias.map(a => (
              <TableRow key={a.asistenciaId}>
                <TableTd className="font-medium">{formatDate(a.fecha)}</TableTd>
                <TableTd>
                  <Badge variant={TIPO_VARIANT[a.tipoAsistencia] ?? 'default'}>
                    {a.tipoAsistencia === 'RECUPERACION'
                      ? <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Recuperación</span>
                      : 'Normal'}
                  </Badge>
                </TableTd>
                <TableTd>
                  {a.tipoActividad
                    ? <Badge variant="secondary">{a.tipoActividad}</Badge>
                    : '—'}
                </TableTd>
                <TableTd>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(a)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal registrar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar asistencia">
        <form onSubmit={handleSubmit(onRegistrar)} className="space-y-4">

          <Select id="regSocioId" label="Socio" {...register('socioId', { required: true })}>
            <option value="">Seleccioná un socio...</option>
            {socios.filter(s => s.estado === 'ACTIVO').map(s => (
              <option key={s.socioId} value={s.socioId}>
                {s.nombre} {s.apellido} — DNI {s.dni}
              </option>
            ))}
          </Select>

          <Input
            id="fecha"
            label="Fecha"
            type="date"
            {...register('fecha', { required: true })}
          />

          <Select id="tipoAsistencia" label="Tipo de asistencia" {...register('tipoAsistencia')}>
            <option value="NORMAL">Normal</option>
            <option value="RECUPERACION">Recuperación</option>
          </Select>

          {/* Si es RECUPERACION, mostrar selector de recuperación pendiente */}
          {tipoAsistencia === 'RECUPERACION' && (
            recuperacionesPendientes.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Este socio no tiene recuperaciones pendientes.
                Creá una primero desde la sección Recuperaciones.
              </div>
            ) : (
              <Select
                id="recuperacionId"
                label="Recuperación a utilizar"
                {...register('recuperacionId')}
              >
                <option value="">Seleccioná...</option>
                {recuperacionesPendientes.map(r => (
                  <option key={r.recuperacionId} value={r.recuperacionId}>
                    {formatDate(r.fechaClaseOriginal)} — {r.tipoActividad} (vence {formatDate(r.fechaVencimiento)})
                  </option>
                ))}
              </Select>
            )
          )}

          <Select id="tipoActividad" label="Actividad" {...register('tipoActividad')}>
            {ACTIVIDADES.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (tipoAsistencia === 'RECUPERACION' && recuperacionesPendientes.length === 0)}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal eliminar */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar asistencia">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar la asistencia del{' '}
          <strong>{confirmDelete ? formatDate(confirmDelete.fecha) : ''}</strong>?
          Esta acción no se puede deshacer.
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