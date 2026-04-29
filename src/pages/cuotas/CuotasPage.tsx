import { useState, useEffect, useCallback, useRef } from 'react'
import { cuotasService } from '@/services/cuotas.service'
import { metodosPagoService, type MetodoPago } from '@/services/metodosPago.service'
import { sociosService } from '@/services/socios.service'
import { exportarCuotasPDF, exportarDeudoresPDF } from '@/lib/pdf'
import type { Cuota } from '@/types'
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
import { Trash2, AlertCircle, CreditCard, Plus, RefreshCw, FileDown, Pencil } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useNotificacionesStore } from '@/store/notificacionesStore'
import { useIsAdmin } from '@/hooks/useRole'

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  PAGADA: 'success',
  PENDIENTE: 'warning',
  VENCIDA: 'danger',
}

export default function CuotasPage() {
  const esAdmin                         = useIsAdmin()
  const [cuotas, setCuotas]             = useState<Cuota[]>([])
  const [sociosNombres, setSociosNombres] = useState<Record<number, string>>({})
  const sociosCacheRef                  = useRef<Record<number, string>>({})
  const [metodosPago, setMetodosPago]   = useState<MetodoPago[]>([])
  const [loading, setLoading]           = useState(true)
  const [periodoInput, setPeriodoInput] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [periodo, setPeriodo]           = useState(periodoInput)
  const [confirmDelete, setConfirmDelete] = useState<Cuota | null>(null)
  const [editModal, setEditModal]       = useState<Cuota | null>(null)
  const [editMonto, setEditMonto]       = useState('')
  const [editFechaVenc, setEditFechaVenc] = useState('')
  const [editEstado, setEditEstado]     = useState('')
  const [editando, setEditando]         = useState(false)
  const [pagarModal, setPagarModal]     = useState<Cuota | null>(null)
  const [generarModal, setGenerarModal] = useState(false)
  const [metodoPagoId, setMetodoPagoId] = useState('')
  const [montoPago, setMontoPago]       = useState('')
  const [generando, setGenerando]       = useState(false)
  const [pagando, setPagando]           = useState(false)
  const [diaVencimiento, setDiaVencimiento] = useState('10')
  const { toasts, toast, dismiss }      = useToast()

  const fetchCuotas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cuotasService.getByPeriodo(periodo)
      setCuotas(res)
      // Resolver nombres de socios sin duplicar requests
      const idsNuevos = [...new Set(res.map(c => c.socioId))].filter(id => !sociosCacheRef.current[id])
      if (idsNuevos.length > 0) {
        const results = await Promise.all(idsNuevos.map(id => sociosService.getById(id).catch(() => null)))
        const nuevos: Record<number, string> = {}
        results.forEach(s => {
          if (s) nuevos[s.socioId] = `${s.nombre} ${s.apellido}`
        })
        sociosCacheRef.current = { ...sociosCacheRef.current, ...nuevos }
        setSociosNombres(prev => ({ ...prev, ...nuevos }))
      }
    } catch {
      toast('Error al cargar cuotas', 'error')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { fetchCuotas() }, [fetchCuotas])

  useEffect(() => {
    metodosPagoService.getAll().then(setMetodosPago).catch(() => {})
  }, [])

  const nombreSocio = (socioId: number) => sociosNombres[socioId] ?? `#${socioId}`
  const cargarNotificaciones = useNotificacionesStore(s => s.cargar)
  const nombresMap = (): Record<number, string> => ({ ...sociosNombres })

  const abrirEditar = (cuota: Cuota) => {
    setEditModal(cuota)
    setEditMonto(String(cuota.monto))
    setEditFechaVenc(cuota.fechaVencimiento)
    setEditEstado(cuota.estado)
  }

  const handleEditar = async () => {
    if (!editModal) return
    setEditando(true)
    try {
      await cuotasService.update(editModal.cuotaId, {
        monto:            Number(editMonto),
        estado:           editEstado,
        fechaVencimiento: editFechaVenc || undefined,
      })
      toast('Cuota actualizada', 'success')
      setEditModal(null)
      fetchCuotas()
    } catch {
      toast('Error al actualizar la cuota', 'error')
    } finally {
      setEditando(false)
    }
  }

const abrirPago = (cuota: Cuota) => {
  setPagarModal(cuota)
  setMontoPago(String(cuota.monto))
  const primerMetodo = metodosPago[0]
  setMetodoPagoId(primerMetodo?.id ? String(primerMetodo.id) : '')
}
const handlePagar = async () => {

  console.log('metodoPagoId state:', metodoPagoId)
  console.log('metodosPago disponibles:', metodosPago)
  if (!pagarModal || !metodoPagoId) return

  const metodoId = Number(metodoPagoId)
  if (isNaN(metodoId) || metodoId <= 0) {
    return toast('Seleccioná un método de pago', 'error')
  }

  if (!montoPago || Number(montoPago) <= 0) {
    return toast('Monto inválido', 'error')
  }

  setPagando(true)
  try {
    await cuotasService.pagar(pagarModal.cuotaId, metodoId, Number(montoPago))  // ✅ only this line

    toast('Pago registrado correctamente', 'success')
    setPagarModal(null)
    await fetchCuotas()
    cargarNotificaciones()
  } catch (e: any) {
    console.error(e)
    toast(e?.response?.data?.error || 'Error al registrar el pago', 'error')
  } finally {
    setPagando(false)
  }
}

  const handleGenerar = async () => {
    const [anio, mes] = periodoInput.split('-').map(Number)
    if (!anio || !mes) return toast('Período inválido', 'error')
    setGenerando(true)
    try {
      const res = await cuotasService.generar(anio, mes, Number(diaVencimiento))
      toast(`Se generaron ${res.generadas} cuotas para ${res.periodo}`, 'success')
      setGenerarModal(false)
      setPeriodo(periodoInput)
    } catch {
      toast('Error al generar cuotas', 'error')
    } finally {
      setGenerando(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await cuotasService.delete(confirmDelete.cuotaId)
      toast('Cuota anulada correctamente', 'success')
      setConfirmDelete(null)
      fetchCuotas()
      cargarNotificaciones()
    } catch {
      toast('No se puede anular esta cuota', 'error')
    }
  }

  const handleExportarPeriodo = () => {
    const nombreGimnasio = localStorage.getItem('gym_nombre') ?? 'Mi Gimnasio'
    exportarCuotasPDF(cuotas, periodo, nombreGimnasio, nombresMap())
  }

  const handleExportarDeudores = () => {
    const nombreGimnasio = localStorage.getItem('gym_nombre') ?? 'Mi Gimnasio'
    const pendientes = cuotas.filter(c => c.estado !== 'PAGADA')
    exportarDeudoresPDF(pendientes, nombreGimnasio, nombresMap())
  }

  const totales = {
    total:      cuotas.length,
    pagadas:    cuotas.filter(c => c.estado === 'PAGADA').length,
    pendientes: cuotas.filter(c => c.estado === 'PENDIENTE').length,
    vencidas:   cuotas.filter(c => c.estado === 'VENCIDA').length,
  }

  const hayPendientes = cuotas.filter(c => c.estado !== 'PAGADA').length > 0

  return (
    <div>
      <PageHeader
        title="Cuotas"
        subtitle={`Período ${periodo}`}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportarPeriodo}
              disabled={cuotas.length === 0}
            >
              <FileDown className="h-4 w-4" /> Exportar período
            </Button>
            <Button
              variant="outline"
              onClick={handleExportarDeudores}
              disabled={!hayPendientes}
            >
              <FileDown className="h-4 w-4" /> Exportar deudores
            </Button>
            {esAdmin && (
              <Button onClick={() => setGenerarModal(true)}>
                <Plus className="h-4 w-4" /> Generar cuotas
              </Button>
            )}
          </div>
        }
      />

      {/* Filtro período */}
      <div className="flex items-end gap-3 mb-6">
        <Input
          id="periodo"
          label="Período (YYYY-MM)"
          value={periodoInput}
          onChange={e => setPeriodoInput(e.target.value)}
          placeholder="2026-04"
          className="w-48"
        />
        <Button variant="outline" onClick={() => setPeriodo(periodoInput)}>
          <RefreshCw className="h-4 w-4" /> Buscar
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',      value: totales.total,      color: 'bg-muted' },
          { label: 'Pagadas',    value: totales.pagadas,    color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pendientes', value: totales.pendientes, color: 'bg-amber-50 text-amber-700' },
          { label: 'Vencidas',   value: totales.vencidas,   color: 'bg-red-50 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-display font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {cuotas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay cuotas para este período.</p>
              <p className="text-sm mt-1">Usá "Generar cuotas" para crearlas.</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableTh>Socio</TableTh>
                  <TableTh>Período</TableTh>
                  <TableTh>Monto</TableTh>
                  <TableTh>Vencimiento</TableTh>
                  <TableTh>Estado</TableTh>
                  <TableTh>Fecha pago</TableTh>
                  <TableTh />
                </TableRow>
              </TableHead>
              <TableBody>
                {cuotas.map(c => (
                  <TableRow key={c.cuotaId}>
                    <TableTd className="font-medium">{nombreSocio(c.socioId)}</TableTd>
                    <TableTd>{c.periodo}</TableTd>
                    <TableTd>{formatCurrency(c.monto)}</TableTd>
                    <TableTd>{formatDate(c.fechaVencimiento)}</TableTd>
                    <TableTd>
                      <Badge variant={ESTADO_VARIANT[c.estado] ?? 'secondary'}>{c.estado}</Badge>
                    </TableTd>
                    <TableTd>{c.fechaPago ? formatDate(c.fechaPago) : '—'}</TableTd>
                    <TableTd>
                      <div className="flex gap-1 justify-end">
                        {c.estado !== 'PAGADA' && (
                          <>
                            <Button size="sm" onClick={() => abrirPago(c)}>
                              <CreditCard className="h-3.5 w-3.5" /> Pagar
                            </Button>
                            {esAdmin && (
                              <>
                                <Button variant="ghost" size="icon" title="Editar" onClick={() => abrirEditar(c)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Anular" onClick={() => setConfirmDelete(c)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </TableTd>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Modal pagar */}
      <Modal open={!!pagarModal} onClose={() => setPagarModal(null)} title="Registrar pago">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{pagarModal ? nombreSocio(pagarModal.socioId) : ''}</p>
            <p className="text-muted-foreground">Período {pagarModal?.periodo}</p>
          </div>
          {metodosPago.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              No hay métodos de pago configurados. Creá uno en Configuración → Métodos de pago.
            </div>
          ) : (

<Select
  id="metodoPago"
  label="Método de pago"
  value={metodoPagoId}
  onChange={e => setMetodoPagoId(e.target.value)}
>
  <option value="">Seleccioná un método...</option>

 {metodosPago.map((m) => (
  <option key={`metodo-${m.metodoPagoId}`} value={String(m.metodoPagoId)}>
    {m.nombre}
  </option>

))}

</Select>
          )}
          <Input
            id="monto"
            label="Monto"
            type="number"
            value={montoPago}
            onChange={e => setMontoPago(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPagarModal(null)}>Cancelar</Button>
            <Button
              onClick={handlePagar}
              disabled={pagando || !metodoPagoId || metodosPago.length === 0}
            >
              {pagando ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal generar */}
      <Modal open={generarModal} onClose={() => setGenerarModal(false)} title="Generar cuotas del período">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera una cuota por cada socio activo para el período{' '}
            <strong>{periodoInput}</strong>. Si ya existen cuotas para ese período, no se duplican.
          </p>
          <Input
            id="diaVenc"
            label="Día de vencimiento"
            type="number"
            min={1}
            max={28}
            value={diaVencimiento}
            onChange={e => setDiaVencimiento(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setGenerarModal(false)}>Cancelar</Button>
            <Button onClick={handleGenerar} disabled={generando}>
              {generando ? 'Generando...' : 'Generar cuotas'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar cuota */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar cuota">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{editModal ? nombreSocio(editModal.socioId) : ''}</p>
            <p className="text-muted-foreground">Período {editModal?.periodo}</p>
          </div>
          <Input
            id="edit-monto"
            label="Monto"
            type="number"
            value={editMonto}
            onChange={e => setEditMonto(e.target.value)}
          />
          <Input
            id="edit-fecha-venc"
            label="Fecha de vencimiento"
            type="date"
            value={editFechaVenc}
            onChange={e => setEditFechaVenc(e.target.value)}
          />
          <Select
            id="edit-estado"
            label="Estado"
            value={editEstado}
            onChange={e => setEditEstado(e.target.value)}
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="VENCIDA">VENCIDA</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
            <Button onClick={handleEditar} disabled={editando}>
              {editando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal anular */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Anular cuota">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            ¿Anular la cuota <strong>{confirmDelete?.periodo}</strong> de{' '}
            <strong>{confirmDelete ? nombreSocio(confirmDelete.socioId) : ''}</strong> por{' '}
            <strong>{confirmDelete ? formatCurrency(confirmDelete.monto) : ''}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDelete}>Anular cuota</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}