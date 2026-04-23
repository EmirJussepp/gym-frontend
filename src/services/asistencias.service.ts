import api from '@/lib/axios'
import type { Asistencia } from '@/types'

export const asistenciasService = {
  getBySocio: async (socioId: number, anio?: number, mes?: number): Promise<Asistencia[]> => {
    let url = `/socios/${socioId}/asistencias`
    if (anio && mes) url += `?anio=${anio}&mes=${mes}`
    const res = await api.get(url)
    return res.data
  },

  registrar: async (
    socioId: number,
    fecha: string,
    tipoAsistencia = 'NORMAL',
    tipoActividad?: string,
    recuperacionId?: number
  ) => {
    const body: Record<string, unknown> = { fecha, tipoAsistencia, tipoActividad }
    if (recuperacionId) body.recuperacionId = recuperacionId
    const res = await api.post(`/socios/${socioId}/asistencias`, body)
    return res.data
  },

  delete: async (socioId: number, asistenciaId: number): Promise<void> => {
    await api.delete(`/socios/${socioId}/asistencias/${asistenciaId}`)
  },
}