import { cn } from '@renderer/lib/utils'

type ContentContainerProps = {
  children: React.ReactNode
  className?: string
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  return <div className={cn('mx-auto w-full max-w-4xl px-6', className)}>{children}</div>
}
