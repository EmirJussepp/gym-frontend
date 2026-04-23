import { useState, useEffect, useCallback, useMemo } from 'react'
import { ejerciciosService } from '@/services/ejercicios.service'
import { gruposMuscularesService } from '@/services/gruposMusculares.service'
import { rutinasService } from '@/services/rutinas.service'
import { rutinaEjercicioService, type RutinaEjercicioDetalle } from '@/services/rutinaEjercicio.service'
import type { Ejercicio, GrupoMuscular, Rutina } from '@/types'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { ToastContainer } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import {
  Plus, Pencil, Trash2, Dumbbell, Layers,
  ListChecks, ChevronDown, ChevronRight, Search
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import EjercicioForm from './EjercicioForm'
import RutinaForm from '../rutinas/RutinaForm'
import RutinaEjerciciosModal from '../rutinas/RutinaEjerciciosModal'

type Tab = 'rutinas' | 'ejercicios' | 'grupos'

const COLORES_GRUPO = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-teal-50 text-teal-700 border-teal-200',
]

const PUNTO_COLORES = [
  'bg-blue-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400',
  'bg-rose-400', 'bg-cyan-400', 'bg-orange-400', 'bg-teal-400',
]

export default function BibliotecaPage() {
  const [tab, setTab]               = useState<Tab>('rutinas')
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [grupos, setGrupos]         = useState<GrupoMuscular[]>([])
  const [rutinas, setRutinas]       = useState<Rutina[]>([])
  const [loading, setLoading]       = useState(true)
  const [busqueda, setBusqueda]     = useState('')

  // Rutinas expandidas
  const [rutinaExpandida, setRutinaExpandida]     = useState<number | null>(null)
  const [ejerciciosRutina, setEjerciciosRutina]   = useState<Record<number, RutinaEjercicioDetalle[]>>({})
  const [loadingRutina, setLoadingRutina]         = useState<number | null>(null)

  // Modales rutinas
  const [modalRutina, setModalRutina]           = useState(false)
  const [editandoRutina, setEditandoRutina]     = useState<Rutina | null>(null)
  const [ejerciciosModal, setEjerciciosModal]   = useState<Rutina | null>(null)
  const [confirmDelRutina, setConfirmDelRutina] = useState<Rutina | null>(null)

  // Modales ejercicios
  const [modalEjercicio, setModalEjercicio]           = useState(false)
  const [editandoEjercicio, setEditandoEjercicio]     = useState<Ejercicio | null>(null)
  const [confirmDelEjercicio, setConfirmDelEjercicio] = useState<Ejercicio | null>(null)

  // Modales grupos
  const [modalGrupo, setModalGrupo]           = useState(false)
  const [editandoGrupo, setEditandoGrupo]     = useState<GrupoMuscular | null>(null)
  const [confirmDelGrupo, setConfirmDelGrupo] = useState<GrupoMuscular | null>(null)

  const { toasts, toast, dismiss } = useToast()

  const {
    register: regGrupo,
    handleSubmit: submitGrupo,
    reset: resetGrupo,
    formState: { isSubmitting: submittingGrupo, errors: errorsGrupo }
  } = useForm<{ nombre: string }>()

  const fetchTodo = useCallback(async () => {
    setLoading(true)
    try {
      const [ejs, grps, ruts] = await Promise.all([
        ejerciciosService.getAll(1, 200),
        gruposMuscularesService.getAll(),
        rutinasService.getAll(1, 100),
      ])
      setEjercicios(ejs.data)
      setGrupos(grps)
      setRutinas(ruts.data)
    } catch {
      toast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTodo() }, [fetchTodo])

  // gruposMap usa g.id (el único campo id en GrupoMuscular)
  const gruposMap = useMemo(() =>
    Object.fromEntries(grupos.map(g => [g.id, g.nombre]))
  , [grupos])

  const colorGrupo = (idx: number) => COLORES_GRUPO[idx % COLORES_GRUPO.length]
  const puntoGrupo = (idx: number) => PUNTO_COLORES[idx % PUNTO_COLORES.length]

  // índice de color por nombre de grupo para consistencia visual
  const idxGrupo = useMemo(() => {
    const map: Record<string, number> = {}
    grupos.forEach((g, i) => { map[g.nombre] = i })
    return map
  }, [grupos])

  // Ejercicios agrupados por grupo muscular (filtrados por búsqueda)
  const ejerciciosPorGrupo = useMemo(() => {
    const filtrados = busqueda
      ? ejercicios.filter(e => e.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      : ejercicios
    const map: Record<string, Ejercicio[]> = {}
    filtrados.filter(e => e.activo).forEach(e => {
      const g = gruposMap[e.grupoMuscularId] ?? 'Sin grupo'
      if (!map[g]) map[g] = []
      map[g].push(e)
    })
    return map
  }, [ejercicios, gruposMap, busqueda])

  // Expandir / colapsar rutina y cargar sus ejercicios
  const toggleRutina = async (rutina: Rutina) => {
    if (rutinaExpandida === rutina.rutinaId) {
      setRutinaExpandida(null)
      return
    }
    setRutinaExpandida(rutina.rutinaId)
    if (ejerciciosRutina[rutina.rutinaId]) return
    setLoadingRutina(rutina.rutinaId)
    try {
      const ejs = await rutinaEjercicioService.getByRutina(rutina.rutinaId)
      setEjerciciosRutina(prev => ({ ...prev, [rutina.rutinaId]: ejs }))
    } catch {
      toast('Error al cargar ejercicios de la rutina', 'error')
    } finally {
      setLoadingRutina(null)
    }
  }

  // Ejercicios de una rutina agrupados por grupo muscular
  const ejerciciosRutinaAgrupados = (rutinaId: number) => {
    const ejs = ejerciciosRutina[rutinaId] ?? []
    const map: Record<string, RutinaEjercicioDetalle[]> = {}
    ejs.forEach(e => {
      const g = e.grupoMuscularNombre ?? 'Sin grupo'
      if (!map[g]) map[g] = []
      map[g].push(e)
    })
    return map
  }

  // ── Handlers rutinas ──
  const handleDeleteRutina = async () => {
    if (!confirmDelRutina) return
    try {
      await rutinasService.delete(confirmDelRutina.rutinaId)
      toast('Rutina desactivada', 'success')
      setConfirmDelRutina(null)
      fetchTodo()
    } catch { toast('Error al eliminar rutina', 'error') }
  }

  // ── Handlers ejercicios ──
  const handleDeleteEjercicio = async () => {
    if (!confirmDelEjercicio) return
    try {
      await ejerciciosService.delete(confirmDelEjercicio.ejercicioId)
      toast('Ejercicio desactivado', 'success')
      setConfirmDelEjercicio(null)
      fetchTodo()
    } catch { toast('Error al eliminar ejercicio', 'error') }
  }

  // ── Handlers grupos ──
  const onSubmitGrupo = async (data: { nombre: string }) => {
    try {
      if (editandoGrupo) {
        await gruposMuscularesService.update(editandoGrupo.id, data.nombre)
        toast('Grupo actualizado', 'success')
      } else {
        await gruposMuscularesService.create(data.nombre)
        toast('Grupo creado', 'success')
      }
      setModalGrupo(false)
      setEditandoGrupo(null)
      fetchTodo()
    } catch { toast('Error al guardar grupo', 'error') }
  }

  const handleDeleteGrupo = async () => {
    if (!confirmDelGrupo) return
    try {
      await gruposMuscularesService.delete(confirmDelGrupo.id)
      toast('Grupo eliminado', 'success')
      setConfirmDelGrupo(null)
      fetchTodo()
    } catch {
      toast('No se puede eliminar — tiene ejercicios asociados', 'error')
      setConfirmDelGrupo(null)
    }
  }

  const TABS = [
    { id: 'rutinas',    label: 'Rutinas',          icon: ListChecks, count: rutinas.filter(r => r.activo).length },
    { id: 'ejercicios', label: 'Ejercicios',        icon: Dumbbell,   count: ejercicios.filter(e => e.activo).length },
    { id: 'grupos',     label: 'Grupos musculares', icon: Layers,     count: grupos.length },
  ] as const

  return (
    <div>
      <PageHeader
        title="Biblioteca de entrenamiento"
        subtitle="Rutinas, ejercicios y grupos musculares"
        action={
          tab === 'rutinas' ? (
            <Button onClick={() => { setEditandoRutina(null); setModalRutina(true) }}>
              <Plus className="h-4 w-4" /> Nueva rutina
            </Button>
          ) : tab === 'ejercicios' ? (
            <Button onClick={() => { setEditandoEjercicio(null); setModalEjercicio(true) }}>
              <Plus className="h-4 w-4" /> Nuevo ejercicio
            </Button>
          ) : (
            <Button onClick={() => { setEditandoGrupo(null); resetGrupo({ nombre: '' }); setModalGrupo(true) }}>
              <Plus className="h-4 w-4" /> Nuevo grupo
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => { setTab(id as Tab); setBusqueda('') }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
              tab === id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* ────────── TAB RUTINAS ────────── */}
          {tab === 'rutinas' && (
            <div className="space-y-3">
              {rutinas.filter(r => r.activo).length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Sin rutinas creadas</p>
                  <Button className="mt-4" onClick={() => { setEditandoRutina(null); setModalRutina(true) }}>
                    <Plus className="h-4 w-4" /> Crear primera rutina
                  </Button>
                </div>
              ) : (
                rutinas.filter(r => r.activo).map(r => {
                  const expandida = rutinaExpandida === r.rutinaId
                  const agrupados = ejerciciosRutinaAgrupados(r.rutinaId)
                  const totalEjs  = (ejerciciosRutina[r.rutinaId] ?? []).length

                  return (
                    <Card key={r.rutinaId} className="overflow-hidden">
                      <CardContent className="pt-0 pb-0">
                        {/* Header rutina */}
                        <div
                          className="flex items-center gap-4 py-4 cursor-pointer select-none"
                          onClick={() => toggleRutina(r)}
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <ListChecks className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{r.nombre}</p>
                            {r.descripcion && (
                              <p className="text-xs text-muted-foreground truncate">{r.descripcion}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {ejerciciosRutina[r.rutinaId] !== undefined && (
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                {totalEjs} ejercicio{totalEjs !== 1 ? 's' : ''}
                              </span>
                            )}
                            <Button
                              variant="ghost" size="icon"
                              title="Editar ejercicios"
                              onClick={e => { e.stopPropagation(); setEjerciciosModal(r) }}
                            >
                              <Dumbbell className="h-3.5 w-3.5 text-primary" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={e => { e.stopPropagation(); setEditandoRutina(r); setModalRutina(true) }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={e => { e.stopPropagation(); setConfirmDelRutina(r) }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                            {expandida
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                        </div>

                        {/* Ejercicios expandidos */}
                        {expandida && (
                          <div className="border-t border-border pb-4 pt-3">
                            {loadingRutina === r.rutinaId ? (
                              <div className="flex justify-center py-4"><Spinner /></div>
                            ) : Object.keys(agrupados).length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                Sin ejercicios — usá el botón{' '}
                                <Dumbbell className="inline h-3.5 w-3.5 mx-1" />
                                para agregar
                              </div>
                            ) : (
                              <div className="space-y-4 px-2">
                                {Object.entries(agrupados).map(([grupo, items]) => {
                                  const idx = idxGrupo[grupo] ?? 0
                                  return (
                                    <div key={grupo}>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorGrupo(idx)}`}>
                                          {grupo}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {items.length} ejercicio{items.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[...items]
                                          .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
                                          .map(ej => (
                                            <div
                                              key={ej.id}
                                              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 border border-border/50"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                {ej.orden != null && (
                                                  <span className="text-xs text-muted-foreground w-5 shrink-0">
                                                    {ej.orden}.
                                                  </span>
                                                )}
                                                <span className="text-sm font-medium truncate">
                                                  {ej.ejercicioNombre}
                                                </span>
                                              </div>
                                              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                {ej.series && ej.repeticiones
                                                  ? `${ej.series}×${ej.repeticiones}`
                                                  : '—'}
                                                {ej.descansoSeg ? ` · ${ej.descansoSeg}s` : ''}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* ────────── TAB EJERCICIOS ────────── */}
          {tab === 'ejercicios' && (
            <div>
              <div className="relative mb-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Buscar ejercicio..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
              </div>

              {Object.keys(ejerciciosPorGrupo).length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>{busqueda ? `Sin resultados para "${busqueda}"` : 'Sin ejercicios cargados'}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(ejerciciosPorGrupo).map(([grupo, items]) => {
                    const idx = idxGrupo[grupo] ?? 0
                    return (
                      <div key={grupo}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${colorGrupo(idx)}`}>
                            {grupo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {items.length} ejercicio{items.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {items.map(e => (
                            <div
                              key={e.ejercicioId}
                              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`h-2 w-2 rounded-full shrink-0 ${puntoGrupo(idx)}`} />
                                <span className="text-sm font-medium truncate">{e.nombre}</span>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => { setEditandoEjercicio(e); setModalEjercicio(true) }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  onClick={() => setConfirmDelEjercicio(e)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────── TAB GRUPOS MUSCULARES ────────── */}
          {tab === 'grupos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grupos.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Sin grupos musculares</p>
                  <Button className="mt-4" onClick={() => { setEditandoGrupo(null); resetGrupo({ nombre: '' }); setModalGrupo(true) }}>
                    <Plus className="h-4 w-4" /> Crear primer grupo
                  </Button>
                </div>
              ) : (
                grupos.map((g, idx) => {
                  const cantEjs = ejercicios.filter(e => e.grupoMuscularId === g.id && e.activo).length
                  return (
                    <Card key={g.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold border ${colorGrupo(idx)}`}>
                              {g.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{g.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {cantEjs} ejercicio{cantEjs !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => {
                                setEditandoGrupo(g)
                                resetGrupo({ nombre: g.nombre })
                                setModalGrupo(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setConfirmDelGrupo(g)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Chips de ejercicios */}
                        {cantEjs > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {ejercicios
                              .filter(e => e.grupoMuscularId === g.id && e.activo)
                              .slice(0, 5)
                              .map(e => (
                                <span
                                  key={e.ejercicioId}
                                  className={`text-xs px-2 py-0.5 rounded-full border ${colorGrupo(idx)}`}
                                >
                                  {e.nombre}
                                </span>
                              ))}
                            {cantEjs > 5 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                +{cantEjs - 5} más
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ── MODALES RUTINAS ── */}
      <Modal
        open={modalRutina}
        onClose={() => { setModalRutina(false); setEditandoRutina(null) }}
        title={editandoRutina ? 'Editar rutina' : 'Nueva rutina'}
      >
        <RutinaForm
          rutina={editandoRutina}
          onSaved={() => {
            setModalRutina(false)
            setEditandoRutina(null)
            toast(editandoRutina ? 'Rutina actualizada' : 'Rutina creada', 'success')
            fetchTodo()
          }}
          onCancel={() => { setModalRutina(false); setEditandoRutina(null) }}
        />
      </Modal>

      <Modal open={!!confirmDelRutina} onClose={() => setConfirmDelRutina(null)} title="Desactivar rutina">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Desactivar la rutina <strong>{confirmDelRutina?.nombre}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelRutina(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteRutina}>Desactivar</Button>
        </div>
      </Modal>

      {ejerciciosModal && (
        <RutinaEjerciciosModal
          open={!!ejerciciosModal}
          onClose={() => {
            const id = ejerciciosModal.rutinaId
            setEjerciciosModal(null)
            if (rutinaExpandida === id) {
              rutinaEjercicioService.getByRutina(id)
                .then(ejs => setEjerciciosRutina(prev => ({ ...prev, [id]: ejs })))
                .catch(() => {})
            }
          }}
          rutinaId={ejerciciosModal.rutinaId}
          rutinaNombre={ejerciciosModal.nombre}
        />
      )}

      {/* ── MODALES EJERCICIOS ── */}
      <Modal
        open={modalEjercicio}
        onClose={() => { setModalEjercicio(false); setEditandoEjercicio(null) }}
        title={editandoEjercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      >
        <EjercicioForm
          grupos={grupos}
          ejercicio={editandoEjercicio}
          onSaved={() => {
            setModalEjercicio(false)
            setEditandoEjercicio(null)
            toast(editandoEjercicio ? 'Ejercicio actualizado' : 'Ejercicio creado', 'success')
            fetchTodo()
          }}
          onCancel={() => { setModalEjercicio(false); setEditandoEjercicio(null) }}
        />
      </Modal>

      <Modal open={!!confirmDelEjercicio} onClose={() => setConfirmDelEjercicio(null)} title="Desactivar ejercicio">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Desactivar el ejercicio <strong>{confirmDelEjercicio?.nombre}</strong>?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelEjercicio(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteEjercicio}>Desactivar</Button>
        </div>
      </Modal>

      {/* ── MODALES GRUPOS ── */}
      <Modal
        open={modalGrupo}
        onClose={() => { setModalGrupo(false); setEditandoGrupo(null) }}
        title={editandoGrupo ? 'Editar grupo muscular' : 'Nuevo grupo muscular'}
      >
        <form onSubmit={submitGrupo(onSubmitGrupo)} className="space-y-4">
          <Input
            id="nombreGrupo"
            label="Nombre"
            placeholder="Ej: Pecho, Espalda, Piernas..."
            error={errorsGrupo.nombre?.message}
            {...regGrupo('nombre', { required: 'Requerido' })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setModalGrupo(false); setEditandoGrupo(null) }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submittingGrupo}>
              {submittingGrupo ? 'Guardando...' : editandoGrupo ? 'Guardar cambios' : 'Crear grupo'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelGrupo} onClose={() => setConfirmDelGrupo(null)} title="Eliminar grupo muscular">
        <p className="text-sm text-muted-foreground mb-6">
          ¿Eliminar <strong>{confirmDelGrupo?.nombre}</strong>?
          Solo se puede eliminar si no tiene ejercicios asociados.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDelGrupo(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleDeleteGrupo}>Eliminar</Button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}