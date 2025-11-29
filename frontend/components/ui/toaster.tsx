'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, XCircle, Info, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const getIcon = (variant?: string | null) => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-5 w-5 text-destructive-foreground" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <CheckCircle2 className="h-5 w-5 text-foreground" />
    }
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(variant)}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

