import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-display font-bold text-primary/20 select-none mb-2">404</p>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Página no encontrada</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          La ruta que buscás no existe o fue movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="h-4 w-4" /> Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
