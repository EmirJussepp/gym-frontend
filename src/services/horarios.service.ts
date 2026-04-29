import api from '@/lib/axios'

export interface Horario {
  horarioId: number
  socioId: number
  diaSemana: number
  horaInicio: string
  tipoActividad: string
  activo: boolean
}

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const getDiaNombre = (dia: number) => DIAS[dia] ?? dia.toString()

export const horariosService = {
  getBySocio: async (socioId: number): Promise<Horario[]> => {
    const res = await api.get(`/socios/${socioId}/horarios`)
    return res.data
  },

  create: async (socioId: number, diaSemana: number, horaInicio: string, tipoActividad: string): Promise<Horario> => {
    const res = await api.post(`/socios/${socioId}/horarios`, { diaSemana, horaInicio, tipoActividad })
    return res.data
  },

  update: async (socioId: number, horarioId: number, diaSemana: number, horaInicio: string, tipoActividad: string): Promise<Horario> => {
    const res = await api.put(`/socios/${socioId}/horarios/${horarioId}`, { diaSemana, horaInicio, tipoActividad })
    return res.data
  },

  delete: async (socioId: number, horarioId: number): Promise<void> => {
    await api.delete(`/socios/${socioId}/horarios/${horarioId}`)
  },
}
