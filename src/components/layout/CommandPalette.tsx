import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { sociosService } from '@/services/socios.service'
import type { Socio } from '@/types'
import { Search, User, X } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Socio[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const navigate  = useNavigate()

  // Abrir con Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Foco al abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Buscar con debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await sociosService.getAll(1, 20)
        const q = query.toLowerCase()
        const filtrados = res.data.filter(s =>
          `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) ||
          s.dni.includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.telefono?.includes(q)
        )
        setResults(filtrados.slice(0, 8))
        setSelected(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const ir = useCallback((socio: Socio) => {
    navigate(`/socios/${socio.socioId}`)
    setOpen(false)
  }, [navigate])

  // Navegacion con flechas
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) ir(results[selected])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar socio por nombre, DNI o email..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Buscando...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados para "{query}"
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribí para buscar un socio
            </div>
          )}

          {results.map((s, i) => (
            <button
              key={s.socioId}
              onClick={() => ir(s)}
              onMouseEnter={() => setSelected(i)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                i === selected ? 'bg-muted' : 'hover:bg-muted/50',
              ].join(' ')}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                {s.nombre.charAt(0)}{s.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.nombre} {s.apellido}</p>
                <p className="text-xs text-muted-foreground truncate">
                  DNI {s.dni}{s.email ? ` · ${s.email}` : ''}
                </p>
              </div>
              <span className={[
                'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                s.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' :
                s.estado === 'SUSPENDIDO' ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              ].join(' ')}>
                {s.estado}
              </span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">↑↓ navegar · Enter abrir</span>
          </div>
        )}
      </div>
    </div>
  )
}
