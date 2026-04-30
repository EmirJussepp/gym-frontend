import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ejerciciosService } from '@/services/ejercicios.service'
import { getImagenUrl } from '@/lib/utils'
import type { Ejercicio, GrupoMuscular } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ImageOff, Upload, X } from 'lucide-react'

const schema = z.object({
  nombre:          z.string().min(1, 'Requerido'),
  grupoMuscularId: z.number({ required_error: 'Seleccioná un grupo muscular' }).min(1),
  descripcion:     z.string().optional(),
  imagenUrl:       z.string().optional(),
  activo:          z.coerce.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  grupos:    GrupoMuscular[]
  ejercicio: Ejercicio | null
  onSaved:   () => void
  onCancel:  () => void
}

export default function EjercicioForm({ grupos, ejercicio, onSaved, onCancel }: Props) {
  const [subiendo, setSubiendo]       = useState(false)
  const [errorImg, setErrorImg]       = useState<string | null>(null)
  // Preview local (antes de subir) o URL ya guardada
  const [preview, setPreview]         = useState<string | null>(null)
  const inputFileRef                  = useRef<HTMLInputElement>(null)

  const {
    control, register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true, imagenUrl: '' },
  })

  const imagenGuardada = watch('imagenUrl')

  useEffect(() => {
    if (ejercicio) {
      reset({
        nombre:          ejercicio.nombre,
        grupoMuscularId: ejercicio.grupoMuscularId,
        descripcion:     ejercicio.descripcion ?? '',
        imagenUrl:       ejercicio.imagenUrl ?? '',
        activo:          ejercicio.activo,
      })
      setPreview(ejercicio.imagenUrl ? getImagenUrl(ejercicio.imagenUrl) ?? null : null)
    } else {
      reset({ activo: true, imagenUrl: '' })
      setPreview(null)
    }
    setErrorImg(null)
  }, [ejercicio, reset])

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErrorImg('El archivo debe ser una imagen (JPG, PNG, WEBP…)')
      return
    }
    // Validar tamaño (máx 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorImg('La imagen no puede superar los 5 MB')
      return
    }

    // Mostrar preview local inmediato
    setPreview(URL.createObjectURL(file))
    setErrorImg(null)
    setSubiendo(true)

    try {
      const url = await ejerciciosService.uploadImagen(file)
      setValue('imagenUrl', url, { shouldValidate: true })
    } catch {
      setErrorImg('Error al subir la imagen. Intentá de nuevo.')
      setPreview(imagenGuardada ? getImagenUrl(imagenGuardada) ?? null : null)
    } finally {
      setSubiendo(false)
    }
  }

  const quitarImagen = () => {
    setValue('imagenUrl', '', { shouldValidate: true })
    setPreview(null)
    setErrorImg(null)
    if (inputFileRef.current) inputFileRef.current.value = ''
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
      {/* Campo oculto — necesario para react-hook-form */}
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
            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Seleccionar...</option>
            {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
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

      {/* ── Imagen ── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Foto del ejercicio</label>

        {/* Vista previa + quitar */}
        {preview ? (
          <div className="relative w-full rounded-xl overflow-hidden border border-input bg-muted/30">
            <img
              src={preview}
              alt="Vista previa"
              className="w-full max-h-52 object-contain py-3"
              onError={() => setPreview(null)}
            />
            {subiendo && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <span className="text-sm text-muted-foreground animate-pulse">Subiendo…</span>
              </div>
            )}
            {!subiendo && (
              <button
                type="button"
                onClick={quitarImagen}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-destructive hover:text-white transition-colors"
                title="Quitar imagen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          /* Zona de upload */
          <label
            htmlFor="img-upload"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-8 cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Hacé clic o arrastrá una imagen</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP — máx. 5 MB</p>
            </div>
          </label>
        )}

        <input
          ref={inputFileRef}
          id="img-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleArchivoSeleccionado}
          disabled={subiendo}
        />

        {/* Botón alternativo si ya hay imagen (cambiar) */}
        {preview && !subiendo && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputFileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Cambiar imagen
          </Button>
        )}

        {/* Error */}
        {errorImg && (
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <ImageOff className="h-3.5 w-3.5 shrink-0" /> {errorImg}
          </p>
        )}

        {/* Info PDF */}
        {preview && !errorImg && (
          <p className="text-xs text-muted-foreground">
            Esta imagen aparecerá en el PDF de la rutina del socio.
          </p>
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
            onChange={e => field.onChange(e.target.value === 'true')}
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
        )}
      />

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting || subiendo}>
          {ejercicio ? 'Guardar cambios' : 'Crear ejercicio'}
        </Button>
      </div>
    </form>
  )
}
