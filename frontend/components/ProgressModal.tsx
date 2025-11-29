'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Upload, FileText } from 'lucide-react'

interface ProgressModalProps {
  open: boolean
  type: 'upload' | 'ocr'
  progress?: number
  message?: string
}

export function ProgressModal({ open, type, progress, message }: ProgressModalProps) {
  const isUpload = type === 'upload'
  const IconComponent = isUpload ? Upload : FileText
  const title = isUpload ? 'در حال آپلود فایل...' : 'در حال پردازش OCR...'
  const defaultMessage = isUpload 
    ? 'لطفاً صبر کنید، فایل در حال آپلود است'
    : 'در حال استخراج اطلاعات از تصویر...'

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {message || defaultMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          {progress !== undefined && (
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {progress}%
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

