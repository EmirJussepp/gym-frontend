import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { rutinasService } from '@/services/rutinas.service'
import type { Rutina } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
  activo: z.coerce.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  rutina: Rutina | null
  onSaved: () => void
  onCancel: () => void
}

export default function RutinaForm({ rutina, onSaved, onCancel }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true },
  })

  useEffect(() => {
    if (rutina) reset({ nombre: rutina.nombre, descripcion: rutina.descripcion ?? '', activo: rutina.activo })
    else reset({ activo: true })
  }, [rutina, reset])

  const onSubmit = async (data: FormData) => {
    if (rutina) await rutinasService.update(rutina.rutinaId, data)
    else await rutinasService.create(data)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input id="nombre" label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
          {...register('descripcion')}
        />
      </div>
      <Select id="activo" label="Estado" {...register('activo')}>
        <option value="true">Activa</option>
        <option value="false">Inactiva</option>
      </Select>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{rutina ? 'Guardar cambios' : 'Crear rutina'}</Button>
      </div>
    </form>
  )
}
