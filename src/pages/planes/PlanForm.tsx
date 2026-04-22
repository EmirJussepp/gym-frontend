import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { planesService } from '@/services/planes.service'
import type { Plan } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  precio: z.coerce.number().min(0, 'Debe ser mayor a 0'),
  diasPorSemana: z.coerce.number().optional(),
  esLibre: z.coerce.boolean().optional(),
  activo: z.coerce.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  plan: Plan | null
  onSaved: () => void
  onCancel: () => void
}

export default function PlanForm({ plan, onSaved, onCancel }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activo: true, esLibre: false, diasPorSemana: 3 },
  })

  useEffect(() => {
    if (plan) reset({ nombre: plan.nombre, precio: plan.precio, diasPorSemana: plan.diasPorSemana, esLibre: plan.esLibre, activo: plan.activo })
    else reset({ activo: true, esLibre: false, diasPorSemana: 3 })
  }, [plan, reset])

  const onSubmit = async (data: FormData) => {
    if (plan) await planesService.update(plan.planId, data)
    else await planesService.create(data)
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input id="nombre" label="Nombre del plan" error={errors.nombre?.message} {...register('nombre')} />
      <div className="grid grid-cols-2 gap-4">
        <Input id="precio" label="Precio ($)" type="number" error={errors.precio?.message} {...register('precio')} />
        <Input id="diasPorSemana" label="Días por semana" type="number" min={1} max={7} {...register('diasPorSemana')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select id="esLibre" label="Tipo" {...register('esLibre')}>
          <option value="false">Fijo (días determinados)</option>
          <option value="true">Libre (sin límite)</option>
        </Select>
        <Select id="activo" label="Estado" {...register('activo')}>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>{plan ? 'Guardar cambios' : 'Crear plan'}</Button>
      </div>
    </form>
  )
}
