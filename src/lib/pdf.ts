import type { Socio, Cuota } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

// ─── helpers internos ────────────────────────────────────────────────────────

function estilosBase(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; }
      h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .subtitulo { font-size: 12px; color: #666; margin-bottom: 24px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
      .gym-nombre { font-size: 13px; font-weight: 600; color: #444; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #f4f4f4; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; }
      td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
      .badge-success { background: #dcfce7; color: #166534; }
      .badge-warning { background: #fef9c3; color: #854d0e; }
      .badge-danger  { background: #fee2e2; color: #991b1b; }
      .badge-default { background: #f1f5f9; color: #475569; }
      .totales { margin-top: 20px; display: flex; gap: 24px; }
      .total-box { background: #f8f8f8; border-radius: 6px; padding: 10px 16px; }
      .total-box .num { font-size: 22px; font-weight: 700; }
      .total-box .lbl { font-size: 11px; color: #666; }
      .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: right; }
    </style>
  `
}

function abrirVentanaImpresion(html: string) {
  const ventana = window.open('', '_blank', 'width=900,height=700')
  if (!ventana) { alert('Habilitá las ventanas emergentes para exportar PDF'); return }
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => { ventana.print() }, 600)
}

function fechaHoy(): string {
  return new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── exportar lista de socios ─────────────────────────────────────────────────

export function exportarSociosPDF(socios: Socio[], nombreGimnasio = 'Gimnasio') {
  const filas = socios.map(s => {
    const estadoClass = s.estado === 'ACTIVO' ? 'success' : s.estado === 'SUSPENDIDO' ? 'warning' : 'danger'
    return `
      <tr>
        <td>${s.apellido}, ${s.nombre}</td>
        <td>${s.dni}</td>
        <td>${s.telefono ?? '—'}</td>
        <td>${s.email ?? '—'}</td>
        <td>${s.planNombre ?? `Plan #${s.planId}`}</td>
        <td>${s.fechaInicio ? formatDate(s.fechaInicio) : '—'}</td>
        <td>${s.ultimaAsistenciaFecha ? formatDate(s.ultimaAsistenciaFecha) : '—'}</td>
        <td><span class="badge badge-${estadoClass}">${s.estado}</span></td>
      </tr>
    `
  }).join('')

  const activos    = socios.filter(s => s.estado === 'ACTIVO').length
  const inactivos  = socios.filter(s => s.estado === 'INACTIVO').length
  const suspendidos = socios.filter(s => s.estado === 'SUSPENDIDO').length

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Listado de Socios</title>${estilosBase()}</head><body>
    <div class="header">
      <div>
        <h1>Listado de Socios</h1>
        <p class="subtitulo">Generado el ${fechaHoy()} · ${socios.length} socios</p>
      </div>
      <div class="gym-nombre">${nombreGimnasio}</div>
    </div>

    <div class="totales">
      <div class="total-box"><div class="num">${socios.length}</div><div class="lbl">Total</div></div>
      <div class="total-box"><div class="num" style="color:#166534">${activos}</div><div class="lbl">Activos</div></div>
      <div class="total-box"><div class="num" style="color:#854d0e">${suspendidos}</div><div class="lbl">Suspendidos</div></div>
      <div class="total-box"><div class="num" style="color:#991b1b">${inactivos}</div><div class="lbl">Inactivos</div></div>
    </div>

    <table style="margin-top:20px">
      <thead>
        <tr>
          <th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Email</th>
          <th>Plan</th><th>Ingresó</th><th>Última visita</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="footer">${nombreGimnasio} · Listado de socios · ${fechaHoy()}</div>
  </body></html>`

  abrirVentanaImpresion(html)
}

// ─── exportar cuotas del período ──────────────────────────────────────────────

export function exportarCuotasPDF(
  cuotas: Cuota[],
  periodo: string,
  nombreGimnasio = 'Gimnasio',
  nombresSocios: Record<number, string> = {}
) {
  const filas = cuotas.map(c => {
    const estadoClass = c.estado === 'PAGADA' ? 'success' : c.estado === 'VENCIDA' ? 'danger' : 'warning'
    return `
      <tr>
        <td>${nombresSocios[c.socioId] ?? `Socio #${c.socioId}`}</td>
        <td>${c.periodo}</td>
        <td>${formatCurrency(c.monto)}</td>
        <td>${formatDate(c.fechaVencimiento)}</td>
        <td>${c.fechaPago ? formatDate(c.fechaPago) : '—'}</td>
        <td><span class="badge badge-${estadoClass}">${c.estado}</span></td>
      </tr>
    `
  }).join('')

  const pagadas   = cuotas.filter(c => c.estado === 'PAGADA')
  const pendientes = cuotas.filter(c => c.estado === 'PENDIENTE')
  const vencidas  = cuotas.filter(c => c.estado === 'VENCIDA')
  const totalCobrado = pagadas.reduce((acc, c) => acc + c.monto, 0)
  const totalPendiente = [...pendientes, ...vencidas].reduce((acc, c) => acc + c.monto, 0)

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cuotas ${periodo}</title>${estilosBase()}</head><body>
    <div class="header">
      <div>
        <h1>Cuotas — ${periodo}</h1>
        <p class="subtitulo">Generado el ${fechaHoy()} · ${cuotas.length} cuotas</p>
      </div>
      <div class="gym-nombre">${nombreGimnasio}</div>
    </div>

    <div class="totales">
      <div class="total-box"><div class="num">${cuotas.length}</div><div class="lbl">Total cuotas</div></div>
      <div class="total-box"><div class="num" style="color:#166534">${pagadas.length}</div><div class="lbl">Pagadas</div></div>
      <div class="total-box"><div class="num" style="color:#854d0e">${pendientes.length}</div><div class="lbl">Pendientes</div></div>
      <div class="total-box"><div class="num" style="color:#991b1b">${vencidas.length}</div><div class="lbl">Vencidas</div></div>
    </div>

    <div class="totales" style="margin-top:12px">
      <div class="total-box"><div class="num" style="color:#166534">${formatCurrency(totalCobrado)}</div><div class="lbl">Cobrado</div></div>
      <div class="total-box"><div class="num" style="color:#991b1b">${formatCurrency(totalPendiente)}</div><div class="lbl">Por cobrar</div></div>
    </div>

    <table style="margin-top:20px">
      <thead>
        <tr>
          <th>Socio</th><th>Período</th><th>Monto</th>
          <th>Vencimiento</th><th>Fecha pago</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="footer">${nombreGimnasio} · Cuotas ${periodo} · ${fechaHoy()}</div>
  </body></html>`

  abrirVentanaImpresion(html)
}

// ─── exportar socios con cuotas vencidas ──────────────────────────────────────

export function exportarDeudoresPDF(cuotas: Cuota[], nombreGimnasio = 'Gimnasio', nombresSocios: Record<number, string> = {}) {
  const filas = cuotas.map(c => `
    <tr>
      <td>${nombresSocios[c.socioId] ?? `Socio #${c.socioId}`}</td>
      <td>${c.periodo}</td>
      <td>${formatCurrency(c.monto)}</td>
      <td>${formatDate(c.fechaVencimiento)}</td>
      <td><span class="badge badge-${c.estado === 'VENCIDA' ? 'danger' : 'warning'}">${c.estado}</span></td>
    </tr>
  `).join('')

  const total = cuotas.reduce((acc, c) => acc + c.monto, 0)

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Deudores</title>${estilosBase()}</head><body>
    <div class="header">
      <div>
        <h1>Socios con cuotas pendientes</h1>
        <p class="subtitulo">Generado el ${fechaHoy()} · ${cuotas.length} cuotas sin pagar</p>
      </div>
      <div class="gym-nombre">${nombreGimnasio}</div>
    </div>

    <div class="totales">
      <div class="total-box"><div class="num">${cuotas.length}</div><div class="lbl">Cuotas pendientes</div></div>
      <div class="total-box"><div class="num" style="color:#991b1b">${formatCurrency(total)}</div><div class="lbl">Total adeudado</div></div>
    </div>

    <table style="margin-top:20px">
      <thead>
        <tr><th>Socio</th><th>Período</th><th>Monto</th><th>Vencimiento</th><th>Estado</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="footer">${nombreGimnasio} · Deudores · ${fechaHoy()}</div>
  </body></html>`

  abrirVentanaImpresion(html)
}