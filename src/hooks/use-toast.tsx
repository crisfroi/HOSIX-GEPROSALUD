import * as React from 'react'

export type ToastVariant = 'default' | 'destructive'

export type ToastItem = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: ToastVariant
  duration?: number
}

export type ToastOptions = Omit<ToastItem, 'id'>

type ToastContextValue = {
  toasts: ToastItem[]
  toast: (options: ToastOptions) => void
  dismissToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

let globalToastHandler: ((options: ToastOptions) => void) | null = null

function generateToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `toast-${Math.random().toString(36).slice(2, 10)}`
}

export function useToast() {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

export function toast(options: ToastOptions) {
  if (!globalToastHandler) {
    console.warn('Toast provider is not mounted yet.')
    return
  }

  globalToastHandler(options)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = React.useCallback((options: ToastOptions) => {
    const id = generateToastId()

    setToasts((current) => [
      ...current,
      {
        id,
        duration: 5000,
        ...options,
      },
    ])
  }, [])

  React.useEffect(() => {
    globalToastHandler = showToast
    return () => {
      globalToastHandler = null
    }
  }, [showToast])

  const value = React.useMemo(
    () => ({ toasts, toast: showToast, dismissToast }),
    [toasts, showToast, dismissToast]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
