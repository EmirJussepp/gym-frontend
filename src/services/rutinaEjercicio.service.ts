import api from '@/lib/axios'

export interface RutinaEjercicioDetalle {
  id: number
  rutinaId: number
  ejercicioId: number
  ejercicioNombre: string
  grupoMuscularId: number
  grupoMuscularNombre: string
  series: number | null
  repeticiones: string | null
  descansoSeg: number | null
  orden: number | null
}

export interface RutinaEjercicioItem {
  ejercicioId: number
  grupoMuscularId: number
  series: number
  repeticiones: string
  descansoSeg: number
  orden: number
}

export const rutinaEjercicioService = {
  getByRutina: async (rutinaId: number): Promise<RutinaEjercicioDetalle[]> => {
    const res = await api.get(`/rutinas/${rutinaId}/ejercicios`)
    return res.data
  },

  agregarLote: async (rutinaId: number, ejercicios: RutinaEjercicioItem[]) => {
    const res = await api.post(`/rutinas/${rutinaId}/ejercicios/lote`, { ejercicios })
    return res.data
  },

  agregar: async (rutinaId: number, item: RutinaEjercicioItem) => {
    const res = await api.post(`/rutinas/${rutinaId}/ejercicios/lote`, { ejercicios: [item] })
    return res.data
  },

  eliminar: async (rutinaId: number, id: number): Promise<void> => {
    await api.delete(`/rutinas/${rutinaId}/ejercicios/${id}`)
  },

  eliminarTodos: async (rutinaId: number): Promise<void> => {
    await api.delete(`/rutinas/${rutinaId}/ejercicios`)
  },
}
