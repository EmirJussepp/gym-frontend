import { Button } from './Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  pagina: number
  totalPaginas: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ pagina, totalPaginas, onPrev, onNext }: PaginationProps) {
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <span className="text-sm text-muted-foreground">
        Página {pagina} de {totalPaginas}
      </span>
      <Button variant="outline" size="icon" onClick={onPrev} disabled={pagina <= 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onNext} disabled={pagina >= totalPaginas}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
