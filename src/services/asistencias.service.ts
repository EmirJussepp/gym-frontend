import api from '@/lib/axios'
import type { Asistencia } from '@/types'

export const asistenciasService = {
  getBySocio: async (socioId: number, anio?: number, mes?: number): Promise<Asistencia[]> => {
    let url = `/socios/${socioId}/asistencias`
    if (anio && mes) url += `?anio=${anio}&mes=${mes}`
    const res = await api.get(url)
    return res.data
  },

  registrar: async (socioId: number, fecha: string, tipoAsistencia = 'NORMAL', tipoActividad?: string) => {
    const res = await api.post(`/socios/${socioId}/asistencias`, {
      fecha,
      tipoAsistencia,
      tipoActividad,
    })
    return res.data
  },

  delete: async (socioId: number, asistenciaId: number): Promise<void> => {
    await api.delete(`/socios/${socioId}/asistencias/${asistenciaId}`)
  },
}
