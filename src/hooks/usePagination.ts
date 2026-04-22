import { useState } from 'react'

export function usePagination(porPagina = 10) {
  const [pagina, setPagina] = useState(1)

  const reset = () => setPagina(1)

  return { pagina, setPagina, porPagina, reset }
}
