import { cn } from '@/lib/utils'

export function Table({ className, children }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-border">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  )
}

export function TableHead({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted/50', className)}>{children}</thead>
}

export function TableBody({ className, children }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)}>{children}</tbody>
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-b border-border transition-colors hover:bg-muted/30', className)} {...props}>
      {children}
    </tr>
  )
}

export function TableTh({ className, children }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('h-11 px-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)}>
      {children}
    </th>
  )
}

export function TableTd({ className, children }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-sm', className)}>{children}</td>
}
