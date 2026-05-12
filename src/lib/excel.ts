import ExcelJS from 'exceljs'
import type { Socio, Plan, SocioRequest } from '@/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const COL_WIDTHS = [15, 15, 12, 14, 28, 16, 18, 12, 14, 20]

const HEADERS = [
  'Nombre', 'Apellido', 'DNI', 'Teléfono', 'Email',
  'Fecha Nacimiento', 'Plan', 'Estado', 'Fecha Inicio', 'Precio Personalizado',
]

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })
  row.height = 22
}

function applyColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  ws.columns = widths.map((width, i) => ({ key: String(i), width }))
}

async function triggerDownload(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Exportar ─────────────────────────────────────────────────────────────────

export async function exportarSociosExcel(
  socios: Socio[],
  planes: Plan[],
  nombreGimnasio = 'Mi Gimnasio'
) {
  const planNombre = (planId: number) =>
    planes.find(p => p.planId === planId)?.nombre ?? `Plan #${planId}`

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Socios')

  applyColWidths(ws, COL_WIDTHS)

  const headerRow = ws.addRow(HEADERS)
  applyHeaderStyle(headerRow)

  socios.forEach(s => {
    ws.addRow([
      s.nombre,
      s.apellido,
      s.dni,
      s.telefono ?? '',
      s.email ?? '',
      s.fechaNacimiento ?? '',
      planNombre(s.planId),
      s.estado,
      s.fechaInicio ?? '',
      s.precioPersonalizado ?? '',
    ])
  })

  const fecha = new Date().toISOString().slice(0, 10)
  await triggerDownload(
    wb,
    `socios-${nombreGimnasio.replace(/\s+/g, '-').toLowerCase()}-${fecha}.xlsx`
  )
}

// ─── Plantilla vacía ──────────────────────────────────────────────────────────

export async function descargarPlantillaExcel(planes: Plan[]) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Socios')

  applyColWidths(ws, [15, 15, 12, 14, 28, 16, 35, 35, 14, 20])

  const headerRow = ws.addRow(HEADERS)
  applyHeaderStyle(headerRow)

  ws.addRow([
    '', '', '', '', '',
    '(YYYY-MM-DD)',
    planes.map(p => p.nombre).join(' | '),
    'ACTIVO | INACTIVO | SUSPENDIDO',
    '(YYYY-MM-DD)',
    '(opcional, número)',
  ])

  await triggerDownload(wb, 'plantilla-socios.xlsx')
}

// ─── Tipos de resultado de parseo ─────────────────────────────────────────────

export interface FilaImportada {
  fila:    number
  datos:   SocioRequest
  errores: string[]
  valido:  boolean
}

// ─── Parsear archivo ──────────────────────────────────────────────────────────

export async function parsearArchivoSocios(
  file: File,
  planes: Plan[]
): Promise<FilaImportada[]> {
  const buffer = await file.arrayBuffer()

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const ws = wb.worksheets[0]
  if (!ws) throw new Error('El archivo no contiene hojas')

  // First row is the header — map column index → header name
  const headerRow = ws.getRow(1)
  const colIndex: Record<string, number> = {}
  headerRow.eachCell((cell, colNumber) => {
    const val = String(cell.value ?? '').trim()
    if (val) colIndex[val] = colNumber
  })

  const col = (row: ExcelJS.Row, name: string): string =>
    String(row.getCell(colIndex[name] ?? 0).value ?? '').trim()

  const resultado: FilaImportada[] = []

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // skip header

    const errores: string[] = []

    const nombre    = col(row, 'Nombre')
    const apellido  = col(row, 'Apellido')
    const dni       = col(row, 'DNI')
    const telefono  = col(row, 'Teléfono') || undefined
    const email     = col(row, 'Email') || undefined
    const fechaNac  = col(row, 'Fecha Nacimiento') || undefined
    const planStr   = col(row, 'Plan')
    const estado    = col(row, 'Estado').toUpperCase() || 'ACTIVO'
    const fechaIni  = col(row, 'Fecha Inicio') || undefined
    const precioStr = col(row, 'Precio Personalizado')

    if (!nombre)   errores.push('Nombre requerido')
    if (!apellido) errores.push('Apellido requerido')
    if (!dni)      errores.push('DNI requerido')

    const plan = planes.find(p => p.nombre.toLowerCase() === planStr.toLowerCase())
    if (!plan) errores.push(`Plan "${planStr}" no encontrado`)

    const estadosValidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO']
    if (!estadosValidos.includes(estado)) errores.push(`Estado inválido: ${estado}`)

    const reDate = /^\d{4}-\d{2}-\d{2}$/
    if (fechaNac && !reDate.test(fechaNac)) errores.push('Fecha nacimiento: usar formato YYYY-MM-DD')
    if (fechaIni && !reDate.test(fechaIni)) errores.push('Fecha inicio: usar formato YYYY-MM-DD')

    const precioPersonalizado = precioStr ? Number(precioStr) : undefined
    if (precioStr && isNaN(precioPersonalizado!)) errores.push('Precio personalizado debe ser un número')

    const datos: SocioRequest = {
      nombre,
      apellido,
      dni,
      telefono,
      email,
      fechaNacimiento: fechaNac,
      planId:  plan?.planId ?? 0,
      estado:  errores.length ? 'ACTIVO' : estado,
      fechaInicio: fechaIni,
      precioPersonalizado: precioPersonalizado && !isNaN(precioPersonalizado) ? precioPersonalizado : undefined,
    }

    resultado.push({ fila: rowNumber, datos, errores, valido: errores.length === 0 })
  })

  return resultado
}
