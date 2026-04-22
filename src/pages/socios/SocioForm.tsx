import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { sociosService } from '@/services/socios.service'
import type { Socio, Plan } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  dni: z.string().min(1, 'Requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  planId: z.coerce.number().min(1, 'Seleccioná un plan'),
  estado: z.string().min(1, 'Requerido'),
  fechaNacimiento: z.string().optional(),
  fechaInicio: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  planes: Plan[]
  socio: Socio | null
  onSaved: () => void
  onCancel: () => void
}

export default function SocioForm({ planes, socio, onSaved, onCancel }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { estado: 'ACTIVO' },
  })

  useEffect(() => {
    if (socio) {
      reset({
        nombre: socio.nombre,
        apellido: socio.apellido,
        dni: socio.dni,
        telefono: socio.telefono ?? '',
        email: socio.email ?? '',
        planId: socio.planId,
        estado: socio.estado,
        fechaNacimiento: socio.fechaNacimiento ?? '',
        fechaInicio: socio.fechaInicio ?? '',
      })
    } else {
      reset({ estado: 'ACTIVO' })
    }
  }, [socio, reset])

  const onSubmit = async (data: FormData) => {
    if (socio) {
      await sociosService.update(socio.socioId, data)
    } else {
      await sociosService.create(data)
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input id="nombre" label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
        <Input id="apellido" label="Apellido" error={errors.apellido?.message} {...register('apellido')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input id="dni" label="DNI" error={errors.dni?.message} {...register('dni')} />
        <Input id="telefono" label="Teléfono" {...register('telefono')} />
      </div>
      <Input id="email" label="Email" type="email" {...register('email')} />
      <div className="grid grid-cols-2 gap-4">
        <Input id="fechaNacimiento" label="Fecha de nacimiento" type="date" {...register('fechaNacimiento')} />
        <Input id="fechaInicio" label="Fecha de inicio" type="date" {...register('fechaInicio')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select id="planId" label="Plan" error={errors.planId?.message} {...register('planId')}>
          <option value="">Seleccionar plan...</option>
          {planes.map((p) => (
            <option key={p.planId} value={p.planId}>{p.nombre}</option>
          ))}
        </Select>
        <Select id="estado" label="Estado" error={errors.estado?.message} {...register('estado')}>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {socio ? 'Guardar cambios' : 'Crear socio'}
        </Button>
      </div>
    </form>
  )
}
