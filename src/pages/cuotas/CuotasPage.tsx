import { useState, useEffect, useCallback } from 'react'
import { cuotasService } from '@/services/cuotas.service'
import type { Cuota } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '@/components/ui/Table'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { Trash2, AlertCircle } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

const ESTADO_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  PAGADA: 'success',
  PENDIENTE: 'warning',
  VENCIDA: 'danger',
}

export default function CuotasPage() {
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoInput, setPeriodoInput] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [periodo, setPeriodo] = useState(periodoInput)
  const [confirmDelete, setConfirmDelete] = useState<Cuota | null>(null)
  const { toasts, toast, dismiss } = useToast()

  const fetchCuotas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cuotasService.getByPeriodo(periodo)
      setCuotas(res)
    } catch {
      toast('Error al cargar cuotas', 'error')
    } finally {
      setLoading(false)
    }
  }, [periodo])

  useEffect(() => { fetchCuotas() }, [fetchCuotas])

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await cuotasService.delete(confirmDelete.cuotaId!)
      toast('Cuota anulada correctamente', 'success')
      setConfirmDelete(null)
      fetchCuotas()
    } catch {
      toast('No se puede anular esta cuota', 'error')
    }
  }

  const totales = {
    total: cuotas.length,
    pagadas: cuotas.filter(c => c.estado === 'PAGADA').length,
    pendientes: cuotas.filter(c => c.estado === 'PENDIENTE').length,
    vencidas: cuotas.filter(c => c.estado === 'VENCIDA').length,
  }

  return (
    <div>
      <PageHeader title="Cuotas" subtitle={`Período ${periodo}`} />

      {/* Filtro período */}
      <div className="flex items-end gap-3 mb-6">
        <Input
          id="periodo"
          label="Período (YYYY-MM)"
          value={periodoInput}
          onChange={(e) => setPeriodoInput(e.target.value)}
          placeholder="2026-04"
          className="w-48"
        />
        <Button onClick={() => setPeriodo(periodoInput)}>Buscar</Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: totales.total, color: 'bg-muted' },
          { label: 'Pagadas', value: totales.pagadas, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pendientes', value: totales.pendientes, color: 'bg-amber-50 text-amber-700' },
          { label: 'Vencidas', value: totales.vencidas, color: 'bg-red-50 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-display font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableTh>Socio ID</TableTh>
              <TableTh>Período</TableTh>
              <TableTh>Monto</TableTh>
              <TableTh>Vencimiento</TableTh>
              <TableTh>Estado</TableTh>
              <TableTh>Fecha pago</TableTh>
              <TableTh />
            </TableRow>
          </TableHead>
          <TableBody>
            {cuotas.map((c) => (
              <TableRow key={c.cuotaId}>
                <TableTd className="font-medium">#{c.socioId}</TableTd>
                <TableTd>{c.periodo}</TableTd>
                <TableTd>{formatCurrency(c.monto)}</TableTd>
                <TableTd>{formatDate(c.fechaVencimiento)}</TableTd>
                <TableTd>
                  <Badge variant={ESTADO_VARIANT[c.estado] ?? 'secondary'}>{c.estado}</Badge>
                </TableTd>
                <TableTd>{c.fechaPago ? formatDate(c.fechaPago) : '—'}</TableTd>
                <TableTd>
                  {c.estado !== 'PAGADA' && (
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </TableTd>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Anular cuota">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            ¿Anular la cuota <strong>{confirmDelete?.periodo}</strong> por{' '}
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
