import * as XLSX from 'xlsx'
import type { Socio, Plan, SocioRequest } from '@/types'

// ─── Exportar ─────────────────────────────────────────────────────────────────

export function exportarSociosExcel(
  socios: Socio[],
  planes: Plan[],
  nombreGimnasio = 'Mi Gimnasio'
) {
  const planNombre = (planId: number) =>
    planes.find(p => p.planId === planId)?.nombre ?? `Plan #${planId}`

  const filas = socios.map(s => ({
    Nombre:          s.nombre,
    Apellido:        s.apellido,
    DNI:             s.dni,
    Teléfono:        s.telefono ?? '',
    Email:           s.email ?? '',
    'Fecha Nacimiento': s.fechaNacimiento ?? '',
    Plan:            planNombre(s.planId),
    Estado:          s.estado,
    'Fecha Inicio':  s.fechaInicio ?? '',
    'Precio Personalizado': s.precioPersonalizado ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(filas)

  // Ancho de columnas
  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 14 },
    { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 12 },
    { wch: 14 }, { wch: 20 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Socios')

  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `socios-${nombreGimnasio.replace(/\s+/g, '-').toLowerCase()}-${fecha}.xlsx`)
}

// ─── Plantilla vacía ──────────────────────────────────────────────────────────

export function descargarPlantillaExcel(planes: Plan[]) {
  const encabezados = [{
    Nombre:          '',
    Apellido:        '',
    DNI:             '',
    Teléfono:        '',
    Email:           '',
    'Fecha Nacimiento': '(YYYY-MM-DD)',
    Plan:            planes.map(p => p.nombre).join(' | '),
    Estado:          'ACTIVO | INACTIVO | SUSPENDIDO',
    'Fecha Inicio':  '(YYYY-MM-DD)',
    'Precio Personalizado': '(opcional, número)',
  }]
  const ws = XLSX.utils.json_to_sheet(encabezados)
  ws['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 14 },
    { wch: 28 }, { wch: 16 }, { wch: 35 }, { wch: 35 },
    { wch: 14 }, { wch: 20 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Socios')
  XLSX.writeFile(wb, 'plantilla-socios.xlsx')
}

// ─── Tipos de resultado de parseo ─────────────────────────────────────────────

export interface FilaImportada {
  fila:    number
  datos:   SocioRequest
  errores: string[]
  valido:  boolean
}

// ─── Parsear archivo ──────────────────────────────────────────────────────────

export function parsearArchivoSocios(
  file: File,
  planes: Plan[]
): Promise<FilaImportada[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb   = XLSX.read(data, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

        const resultado: FilaImportada[] = rows.map((row, idx) => {
          const errores: string[] = []

          const nombre   = String(row['Nombre'] ?? '').trim()
          const apellido = String(row['Apellido'] ?? '').trim()
          const dni      = String(row['DNI'] ?? '').trim()
          const telefono = String(row['Teléfono'] ?? '').trim() || undefined
          const email    = String(row['Email'] ?? '').trim() || undefined
          const fechaNac = String(row['Fecha Nacimiento'] ?? '').trim() || undefined
          const planStr  = String(row['Plan'] ?? '').trim()
          const estado   = String(row['Estado'] ?? 'ACTIVO').trim().toUpperCase()
          const fechaIni = String(row['Fecha Inicio'] ?? '').trim() || undefined
          const precioStr = String(row['Precio Personalizado'] ?? '').trim()

          if (!nombre)   errores.push('Nombre requerido')
          if (!apellido) errores.push('Apellido requerido')
          if (!dni)      errores.push('DNI requerido')

          // Buscar plan por nombre (case-insensitive)
          const plan = planes.find(
            p => p.nombre.toLowerCase() === planStr.toLowerCase()
          )
          if (!plan) errores.push(`Plan "${planStr}" no encontrado`)

          const estadosValidos = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO']
          if (!estadosValidos.includes(estado)) errores.push(`Estado inválido: ${estado}`)

          // Validar fechas (formato YYYY-MM-DD)
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

          return { fila: idx + 2, datos, errores, valido: errores.length === 0 }
        })

        resolve(resultado)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
