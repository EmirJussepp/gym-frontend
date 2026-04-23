import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Users, CreditCard, Dumbbell,
  ListChecks, CalendarCheck, LogOut, ChevronRight,
  Layers, Shield, Clock, RotateCcw, UserCog,
  Wallet, Settings
} from 'lucide-react'

const NAV_MAIN = [
  { to: '/dashboard',         label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/socios',            label: 'Socios',            icon: Users },
  { to: '/cuotas',            label: 'Cuotas',            icon: CreditCard },
  { to: '/asistencias',       label: 'Asistencias',       icon: CalendarCheck },
]

const NAV_GESTION = [
  { to: '/planes',         label: 'Planes',          icon: CreditCard },
  { to: '/biblioteca',     label: 'Entrenamiento',   icon: Dumbbell   },
  { to: '/horarios',       label: 'Horarios',        icon: Clock      },
  { to: '/recuperaciones', label: 'Recuperaciones',  icon: RotateCcw  },
]

const NAV_CONFIG = [
  { to: '/usuarios',          label: 'Usuarios',          icon: UserCog },
  { to: '/roles',             label: 'Roles',             icon: Shield },
  { to: '/metodos-pago',      label: 'Métodos de pago',   icon: Wallet },
  { to: '/configuracion',     label: 'Configuración',     icon: Settings },
]

function NavGroup({ titulo, items }: { titulo: string; items: typeof NAV_MAIN }) {
  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {titulo}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map(({ to, label, icon: Icon }) => (
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
              {label}
              <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const { usuario, logout } = useAuthStore()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Dumbbell className="h-4 w-4 text-white" />
        </div>
        <span className="font-display text-lg font-bold leading-tight">
          {localStorage.getItem('gym_nombre') ?? 'GestionatuGym'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavGroup titulo="Principal" items={NAV_MAIN} />
        <NavGroup titulo="Gestión" items={NAV_GESTION} />
        <NavGroup titulo="Sistema" items={NAV_CONFIG} />
      </nav>

      {/* Footer usuario */}
      <div className="border-t border-border p-4 shrink-0">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {usuario?.nombre?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{usuario?.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{usuario?.email}</p>
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