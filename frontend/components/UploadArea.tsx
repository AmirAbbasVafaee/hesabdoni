'use client'

import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UploadAreaProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
  className?: string
}

export function UploadArea({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateAndSetFile = useCallback((file: File) => {
    setError(null)

    if (file.size > maxSize) {
      setError(`حجم فایل باید کمتر از ${maxSize / 1024 / 1024} مگابایت باشد`)
      return
    }

    const allowedTypes = accept.split(',').map((t) => t.trim())
    const isValidType =
      allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type || file.name.endsWith(type)
      }) ||
      allowedTypes.includes('.pdf') && file.name.endsWith('.pdf')

    if (!isValidType) {
      setError('فرمت فایل مجاز نیست. فقط تصاویر و PDF مجاز است')
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }, [maxSize, accept, onFileSelect])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        validateAndSetFile(file)
      }
    },
    [validateAndSetFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        validateAndSetFile(file)
      }
    },
    [validateAndSetFile]
  )

  const removeFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400',
          error && 'border-destructive'
        )}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="mt-2"
            >
              <X className="ml-2 h-4 w-4" />
              حذف فایل
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                فایل را اینجا بکشید یا کلیک کنید
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                فرمت‌های مجاز: JPG, PNG, PDF (حداکثر {maxSize / 1024 / 1024}MB)
              </p>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span>انتخاب فایل</span>
              </Button>
            </label>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}

