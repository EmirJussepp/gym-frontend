import { useState, useRef } from 'react'
import type { Plan } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { sociosService } from '@/services/socios.service'
import { parsearArchivoSocios, descargarPlantillaExcel, type FilaImportada } from '@/lib/excel'
import { Upload, FileDown, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

interface Props {
  open:    boolean
  onClose: () => void
  planes:  Plan[]
  onImportado: (cantidad: number) => void
}

export default function SocioImportModal({ open, onClose, planes, onImportado }: Props) {
  const [filas, setFilas]           = useState<FilaImportada[]>([])
  const [parseando, setParseando]   = useState(false)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado]   = useState<{ ok: number; errores: number } | null>(null)
  const [archivoNombre, setArchivoNombre] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const totalValidos  = filas.filter(f => f.valido).length
  const totalInvalidos = filas.filter(f => !f.valido).length

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivoNombre(file.name)
    setParseando(true)
    setResultado(null)
    try {
      const parsed = await parsearArchivoSocios(file, planes)
      setFilas(parsed)
    } catch {
      alert('Error al leer el archivo. Verificá que sea un archivo Excel o CSV válido.')
    } finally {
      setParseando(false)
    }
  }

  const handleImportar = async () => {
    const validos = filas.filter(f => f.valido)
    if (!validos.length) return
    setImportando(true)
    let ok = 0
    let err = 0
    for (const fila of validos) {
      try {
        await sociosService.create(fila.datos)
        ok++
      } catch {
        err++
      }
    }
    setImportando(false)
    setResultado({ ok, errores: err })
    if (ok > 0) onImportado(ok)
  }

  const handleCerrar = () => {
    setFilas([])
    setResultado(null)
    setArchivoNombre('')
    if (inputRef.current) inputRef.current.value = ''
    onClose()
  }

  return (
    <Modal open={open} onClose={handleCerrar} title="Importar socios desde Excel" className="max-w-4xl">
      <div className="flex flex-col gap-5">

        {/* Paso 1: Descargar plantilla */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-1">1. Descargá la plantilla</p>
          <p className="text-xs text-muted-foreground mb-3">
            Usá esta plantilla para cargar los socios. Los planes disponibles y el formato de fechas están indicados en la primera fila.
          </p>
          <Button variant="outline" size="sm" onClick={() => descargarPlantillaExcel(planes)}>
            <FileDown className="h-3.5 w-3.5" /> Descargar plantilla .xlsx
          </Button>
        </div>

        {/* Paso 2: Subir archivo */}
        <div>
          <p className="text-sm font-medium mb-2">2. Cargá el archivo completado</p>
          <label
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            htmlFor="excel-upload"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {archivoNombre
                ? <span className="text-foreground font-medium">{archivoNombre}</span>
                : 'Hacé clic o arrastrá tu archivo .xlsx / .xls / .csv'
              }
            </span>
            <input
              ref={inputRef}
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleArchivo}
            />
          </label>
        </div>

        {/* Cargando */}
        {parseando && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Leyendo archivo...
          </div>
        )}

        {/* Resultado de importación */}
        {resultado && (
          <div className={`rounded-lg p-4 flex items-start gap-3 ${resultado.errores === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            {resultado.errores === 0
              ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            }
            <div>
              <p className="font-medium text-sm">
                {resultado.ok > 0 && `${resultado.ok} socio${resultado.ok !== 1 ? 's' : ''} importado${resultado.ok !== 1 ? 's' : ''} correctamente.`}
                {resultado.errores > 0 && ` ${resultado.errores} no pudieron crearse (puede que ya existan con ese DNI).`}
              </p>
            </div>
          </div>
        )}

        {/* Vista previa */}
        {filas.length > 0 && !resultado && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Vista previa ({filas.length} filas)</p>
              <div className="flex gap-2 text-xs">
                {totalValidos > 0 && (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> {totalValidos} válidas
                  </span>
                )}
                {totalInvalidos > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> {totalInvalidos} con errores
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fila</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nombre</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Apellido</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">DNI</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Validación</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(f => (
                    <tr key={f.fila} className={f.valido ? '' : 'bg-destructive/5'}>
                      <td className="px-3 py-2 text-muted-foreground">{f.fila}</td>
                      <td className="px-3 py-2">{f.datos.nombre || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">{f.datos.apellido || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">{f.datos.dni || <span className="text-destructive">—</span>}</td>
                      <td className="px-3 py-2">
                        {planes.find(p => p.planId === f.datos.planId)?.nombre ?? (
                          <span className="text-destructive">No encontrado</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{f.datos.estado}</td>
                      <td className="px-3 py-2">
                        {f.valido ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          <span title={f.errores.join(', ')} className="cursor-help">
                            <Badge variant="danger">Error</Badge>
                          </span>
                        )}
                        {!f.valido && (
                          <p className="text-destructive text-[10px] mt-0.5">{f.errores[0]}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button variant="ghost" onClick={handleCerrar}>
            <X className="h-4 w-4" /> Cerrar
          </Button>
          {filas.length > 0 && !resultado && (
            <div className="flex items-center gap-3">
              {totalInvalidos > 0 && (
                <p className="text-xs text-muted-foreground">
                  Solo se importarán las {totalValidos} filas válidas
                </p>
              )}
              <Button
                onClick={handleImportar}
                loading={importando}
                disabled={totalValidos === 0 || importando}
              >
                <Upload className="h-4 w-4" />
                Importar {totalValidos} socio{totalValidos !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>

      </div>
    </Modal>
  )
}
