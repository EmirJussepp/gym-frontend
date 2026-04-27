import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from './CommandPalette'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={[
        "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <Sidebar />
      </div>

      <CommandPalette />

      <main className="flex-1 overflow-y-auto">
        {/* Topbar mobile */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/logoaerogym.jpg"
            alt="Aero Gym"
            className="h-7 w-auto object-contain"
          />
        </div>

        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
