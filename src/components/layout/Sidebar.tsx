import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useNotificacionesStore } from '@/store/notificacionesStore'
import { useIsAdmin } from '@/hooks/useRole'
import {
  LayoutDashboard, Users, CreditCard,
  Dumbbell, CalendarCheck, LogOut, ChevronRight,
  Shield, Clock, RotateCcw, UserCog,
  Wallet, Settings, AlertCircle, Search
} from 'lucide-react'

const NAV_MAIN = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/socios',      label: 'Socios',       icon: Users },
  { to: '/cuotas',      label: 'Cuotas',       icon: CreditCard, badge: true },
  { to: '/asistencias', label: 'Asistencias',  icon: CalendarCheck },
]

const NAV_GESTION = [
  { to: '/planes',         label: 'Planes',         icon: CreditCard },
  { to: '/biblioteca',     label: 'Entrenamiento',  icon: Dumbbell },
  { to: '/horarios',       label: 'Horarios',       icon: Clock },
  { to: '/recuperaciones', label: 'Recuperaciones', icon: RotateCcw },
]

const NAV_CONFIG = [
  { to: '/usuarios',      label: 'Usuarios',         icon: UserCog },
  { to: '/roles',         label: 'Roles',             icon: Shield },
  { to: '/metodos-pago',  label: 'Métodos de pago',  icon: Wallet },
  { to: '/configuracion', label: 'Configuración',     icon: Settings },
]

function NavGroup({
  titulo,
  items,
  badge,
}: {
  titulo: string
  items: { to: string; label: string; icon: React.ElementType; badge?: boolean }[]
  badge?: number
}) {
  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {titulo}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon, badge: showBadge }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>

              {/* Badge de notificación */}
              {showBadge && badge && badge > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const { usuario, logout }        = useAuthStore()
  const { cuotasVencidas, cargar } = useNotificacionesStore()
  const esAdmin                    = useIsAdmin()
  const [gymNombre, setGymNombre]  = useState(
    () => localStorage.getItem('gym_nombre') ?? 'AERO GYM'
  )

  // Cargar notificaciones al montar y cada 5 minutos
  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 5 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  // Sincronizar nombre del gimnasio si cambia en otra pestaña o desde ConfiguracionPage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gym_nombre' && e.newValue) setGymNombre(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-border px-4 shrink-0">
        <img
          src="/logoaerogym.jpg"
          alt="Aero Gym"
          className="h-12 w-auto object-contain shrink-0"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold tracking-wide" style={{ color: '#E8922A' }}>
            {gymNombre}
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Since 2026
          </span>
        </div>
      </div>

      {/* Alerta si hay cuotas pendientes */}
      {cuotasVencidas > 0 && (
        <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            {cuotasVencidas} cuota{cuotasVencidas !== 1 ? 's' : ''} pendiente{cuotasVencidas !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Cmd+K hint */}
      <div className="mx-3 mt-3">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            window.dispatchEvent(e)
          }}
          className="w-full flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar socio...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup titulo="Principal" items={NAV_MAIN} badge={cuotasVencidas} />
        <NavGroup titulo="Gestión"   items={NAV_GESTION} />
        {esAdmin && <NavGroup titulo="Sistema" items={NAV_CONFIG} />}
      </nav>

      {/* Footer usuario */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
            {usuario?.nombre?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">
              {usuario?.rolNombre ?? (esAdmin ? 'Admin' : 'Recepcionista')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}