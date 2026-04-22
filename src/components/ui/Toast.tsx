import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContainerProps {
  toasts: ToastItem[]
  dismiss: (id: string) => void
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium min-w-72 animate-in slide-in-from-bottom-2',
            {
              'bg-emerald-50 border-emerald-200 text-emerald-800': t.type === 'success',
              'bg-red-50 border-red-200 text-red-800': t.type === 'error',
              'bg-blue-50 border-blue-200 text-blue-800': t.type === 'info',
            }
          )}
        >
          {t.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
          {t.type === 'error' && <XCircle className="h-4 w-4 shrink-0" />}
          {t.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
