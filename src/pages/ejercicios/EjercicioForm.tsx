import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ejerciciosService } from '@/services/ejercicios.service'
import type { Ejercicio, GrupoMuscular } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  grupoMuscularId: z
    .number({ required_error: 'Seleccioná un grupo muscular' })
    .min(1, 'Seleccioná un grupo muscular'),
  descripcion: z.string().optional(),
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
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true },
  })

  useEffect(() => {
    if (ejercicio) {
      reset({
        nombre: ejercicio.nombre,
        grupoMuscularId: ejercicio.grupoMuscularId, // 👈 esto está bien si tu ejercicio guarda el id
        descripcion: ejercicio.descripcion ?? '',
        activo: ejercicio.activo,
      })
    } else {
      reset({ activo: true })
    }
  }, [ejercicio, reset])

  const onSubmit = async (data: FormData) => {
    if (ejercicio) {
      await ejerciciosService.update(ejercicio.ejercicioId, data)
    } else {
      await ejerciciosService.create(data)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

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
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
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