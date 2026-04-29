// ─── Auth ────────────────────────────────────────────────────────────────────
export interface Usuario {
  userId: number
  nombre: string
  email: string
  roleId: number | null
  activo: boolean
  rolNombre?: string
}

export interface LoginResponse {
  token: string
  usuario: Usuario
}

// ─── Socios ──────────────────────────────────────────────────────────────────
export interface Socio {
  socioId: number
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  fechaNacimiento?: string
  planId: number
  planNombre?: string
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'
  fechaInicio?: string
  precioPersonalizado?: number
  ultimaAsistenciaFecha?: string
  activo: boolean
}

export interface SocioRequest {
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  fechaNacimiento?: string
  planId: number
  estado: string
  fechaInicio?: string
  precioPersonalizado?: number
}

// ─── Planes ──────────────────────────────────────────────────────────────────
export interface Plan {
  planId: number
  nombre: string
  precio: number
  diasPorSemana?: number
  esLibre: boolean
  activo: boolean
}

export interface PlanRequest {
  nombre: string
  precio: number
  diasPorSemana?: number
  esLibre?: boolean
  activo?: boolean
}

// ─── Rutinas ─────────────────────────────────────────────────────────────────
export interface Rutina {
  rutinaId: number
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface RutinaRequest {
  nombre: string
  descripcion?: string
  activo?: boolean
}

// ─── Ejercicios ──────────────────────────────────────────────────────────────
export interface Ejercicio {
  ejercicioId: number
  nombre: string
  grupoMuscularId: number
  descripcion?: string
  activo: boolean
}

export interface EjercicioRequest {
  nombre: string
  grupoMuscularId: number
  descripcion?: string
  activo?: boolean
}

// ─── Grupos Musculares ───────────────────────────────────────────────────────
export interface GrupoMuscular {
  id: number
  nombre: string
}

// ─── Cuotas ──────────────────────────────────────────────────────────────────
export interface Cuota {
  cuotaId: number
  socioId: number
  periodo: string
  monto: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
  fechaVencimiento: string
  fechaPago?: string
}

// ─── Asistencias ─────────────────────────────────────────────────────────────
export interface Asistencia {
  asistenciaId: number
  socioId: number
  fecha: string
  tipoAsistencia: 'NORMAL' | 'RECUPERACION'
  tipoActividad?: string
}

// ─── Roles ───────────────────────────────────────────────────────────────────
export interface Rol {
  roleId: number
  nombre: string
  descripcion?: string
}

// ─── Paginado ────────────────────────────────────────────────────────────────
export interface PaginadoResponse<T> {
  data: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

// ─── RutinaSocio ─────────────────────────────────────────────────────────────
export interface RutinaSocio {
  id: number
  rutinaId: number
  rutinaNombre: string
  fechaAsignacion: string
  fechaFin: string | null
}

// ─── RutinaEjercicio ─────────────────────────────────────────────────────────
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
