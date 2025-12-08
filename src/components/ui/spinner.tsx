import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 border-b-2',
  md: 'h-12 w-12 border-b-3',
  lg: 'h-16 w-16 border-b-4',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary',
        sizeClasses[size],
        className
      )}
    />
  )
}
