import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ejerciciosService } from '@/services/ejercicios.service'
import type { Ejercicio, GrupoMuscular, WgerOpcion } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Search, X, ImageOff } from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  grupoMuscularId: z
    .number({ required_error: 'Seleccioná un grupo muscular' })
    .min(1, 'Seleccioná un grupo muscular'),
  descripcion: z.string().optional(),
  imagenUrl: z.string().optional(),
  activo: z.coerce.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  grupos: GrupoMuscular[]
  ejercicio: Ejercicio | null
  onSaved: () => void
  onCancel: () => void
}

export default function EjercicioForm({ grupos, ejercicio, onSaved, onCancel }: Props) {
  const [wgerOpciones, setWgerOpciones]   = useState<WgerOpcion[]>([])
  const [buscandoWger, setBuscandoWger]   = useState(false)
  const [wgerError, setWgerError]         = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true, imagenUrl: '' },
  })

  const nombreActual = watch('nombre')
  const imagenSeleccionada = watch('imagenUrl')

  useEffect(() => {
    if (ejercicio) {
      reset({
        nombre:          ejercicio.nombre,
        grupoMuscularId: ejercicio.grupoMuscularId,
        descripcion:     ejercicio.descripcion ?? '',
        imagenUrl:       ejercicio.imagenUrl ?? '',
        activo:          ejercicio.activo,
      })
    } else {
      reset({ activo: true })
    }
    setWgerOpciones([])
    setWgerError(null)
  }, [ejercicio, reset])

  const buscarEnWger = async () => {
    const termino = nombreActual?.trim()
    if (!termino) return
    setBuscandoWger(true)
    setWgerError(null)
    setWgerOpciones([])
    try {
      const opciones = await ejerciciosService.buscarWger(termino)
      if (opciones.length === 0) {
        setWgerError('No se encontraron imágenes en wger para ese nombre. Probá en inglés.')
      } else {
        setWgerOpciones(opciones)
      }
    } catch {
      setWgerError('Error al conectar con wger. Verificá tu conexión.')
    } finally {
      setBuscandoWger(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, imagenUrl: data.imagenUrl || undefined }
    if (ejercicio) {
      await ejerciciosService.update(ejercicio.ejercicioId, payload)
    } else {
      await ejerciciosService.create(payload)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Campo oculto necesario para que react-hook-form incluya imagenUrl en el submit */}
      <input type="hidden" {...register('imagenUrl')} />

      {/* Nombre */}
      <Input
        id="nombre"
        label="Nombre"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      {/* Grupo muscular */}
      <Controller
        name="grupoMuscularId"
        control={control}
        render={({ field }) => (
          <Select
            id="grupoMuscularId"
            label="Grupo muscular"
            error={errors.grupoMuscularId?.message as string}
            value={field.value ?? ''}
            onChange={(e) => {
              const value = e.target.value
              field.onChange(value ? Number(value) : undefined)
            }}
          >
            <option value="">Seleccionar...</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </Select>
        )}
      />

      {/* Descripción */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
          {...register('descripcion')}
        />
      </div>

      {/* Imagen wger */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Imagen ilustrativa</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={buscarEnWger}
            disabled={buscandoWger || !nombreActual?.trim()}
          >
            <Search className="h-3.5 w-3.5" />
            {buscandoWger ? 'Buscando...' : 'Buscar en wger'}
          </Button>
        </div>

        {/* Vista previa de imagen seleccionada */}
        {imagenSeleccionada && (
          <div className="flex items-center gap-3 rounded-lg border border-input bg-muted/40 p-2">
            <img
              src={imagenSeleccionada}
              alt="Imagen seleccionada"
              className="h-16 w-16 object-contain rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{imagenSeleccionada}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => { setValue('imagenUrl', ''); setWgerOpciones([]) }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error wger */}
        {wgerError && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <ImageOff className="h-3.5 w-3.5" /> {wgerError}
          </p>
        )}

        {/* Opciones de wger */}
        {wgerOpciones.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {wgerOpciones.map((op) => (
              <button
                key={op.wgerBaseId}
                type="button"
                onClick={() => {
                  setValue('imagenUrl', op.imagenUrl)
                  setWgerOpciones([])
                }}
                className={`rounded-lg border-2 p-1.5 flex flex-col items-center gap-1 transition-colors hover:border-primary ${
                  imagenSeleccionada === op.imagenUrl ? 'border-primary bg-primary/5' : 'border-input'
                }`}
              >
                <img
                  src={op.imagenUrl}
                  alt={op.nombre}
                  className="h-14 w-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '' }}
                />
                <span className="text-xs text-center text-muted-foreground leading-tight line-clamp-2">{op.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estado */}
      <Controller
        name="activo"
        control={control}
        render={({ field }) => (
          <Select
            id="activo"
            label="Estado"
            value={String(field.value)}
            onChange={(e) => field.onChange(e.target.value === 'true')}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        )}
      />

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {ejercicio ? 'Guardar cambios' : 'Crear ejercicio'}
        </Button>
      </div>
    </form>
  )
}
