'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBackendBaseUrl } from '@/lib/api'
import { JalaliDateInput } from '@/components/JalaliDateInput'

interface OCRResult {
  docNumber?: string
  docDate?: string
  description?: string
  kolCode?: string
  moeenCode?: string
  tafziliCode?: string
  debit?: number
  credit?: number
  totalDebit?: number
  totalCredit?: number
}

interface DocumentCoverModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ocrData: OCRResult | null
  onConfirm: (data: OCRResult & { coverImageUrl: string }) => void
  coverImageUrl: string
  loading?: boolean
}

export function DocumentCoverModal({
  open,
  onOpenChange,
  ocrData,
  onConfirm,
  coverImageUrl,
  loading = false,
}: DocumentCoverModalProps) {
  const [formData, setFormData] = useState<OCRResult & { coverImageUrl: string }>({
    coverImageUrl: '',
  })

  useEffect(() => {
    if (ocrData) {
      // Auto-calculate totals if debit/credit are provided
      const debit = ocrData.debit || 0
      const credit = ocrData.credit || 0
      
      setFormData({
        ...ocrData,
        coverImageUrl,
        // Auto-calculate totals if not provided
        totalDebit: ocrData.totalDebit ?? debit,
        totalCredit: ocrData.totalCredit ?? credit,
      })
    }
  }, [ocrData, coverImageUrl])

  // Auto-calculate totals when debit/credit change
  useEffect(() => {
    if (formData.debit !== undefined || formData.credit !== undefined) {
      setFormData(prev => ({
        ...prev,
        totalDebit: prev.totalDebit ?? (prev.debit || 0),
        totalCredit: prev.totalCredit ?? (prev.credit || 0),
      }))
    }
  }, [formData.debit, formData.credit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(formData)
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return ''
    return num.toString()
  }

  const parseNumber = (str: string) => {
    const cleaned = str.replace(/,/g, '')
    return cleaned ? parseFloat(cleaned) : 0
  }

  // Get full image URL
  const getImageUrl = () => {
    if (!coverImageUrl) return ''
    if (coverImageUrl.startsWith('http')) return coverImageUrl
    // If relative URL, construct full backend URL
    return `${getBackendBaseUrl()}${coverImageUrl}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تأیید اطلاعات روکش سند</DialogTitle>
          <DialogDescription>
            لطفاً اطلاعات استخراج شده را بررسی و در صورت نیاز ویرایش کنید
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Preview */}
          {coverImageUrl && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="mb-2 block">پیش‌نمایش روکش سند</Label>
              <div className="relative w-full h-64 bg-white rounded border overflow-hidden">
                <Image
                  src={getImageUrl()}
                  alt="روکش سند"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docNumber">شماره سند</Label>
              <Input
                id="docNumber"
                value={formData.docNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, docNumber: e.target.value })
                }
              />
            </div>
            <JalaliDateInput
              id="docDate"
              label="تاریخ سند"
              value={formData.docDate || ''}
              onChange={(value) =>
                setFormData({ ...formData, docDate: value })
              }
              className="space-y-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">شرح سند</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kolCode">کد حساب کل</Label>
              <Input
                id="kolCode"
                value={formData.kolCode || ''}
                onChange={(e) =>
                  setFormData({ ...formData, kolCode: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeenCode">کد حساب معین</Label>
              <Input
                id="moeenCode"
                value={formData.moeenCode || ''}
                onChange={(e) =>
                  setFormData({ ...formData, moeenCode: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tafziliCode">کد حساب تفصیل</Label>
              <Input
                id="tafziliCode"
                value={formData.tafziliCode || ''}
                onChange={(e) =>
                  setFormData({ ...formData, tafziliCode: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debit">مبلغ بدهکار</Label>
              <Input
                id="debit"
                type="number"
                value={formatNumber(formData.debit)}
                onChange={(e) =>
                  setFormData({ ...formData, debit: parseNumber(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit">مبلغ بستانکار</Label>
              <Input
                id="credit"
                type="number"
                value={formatNumber(formData.credit)}
                onChange={(e) =>
                  setFormData({ ...formData, credit: parseNumber(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDebit">جمع کل بدهکار</Label>
              <Input
                id="totalDebit"
                type="number"
                value={formatNumber(formData.totalDebit)}
                onChange={(e) => {
                  const value = parseNumber(e.target.value)
                  setFormData({ ...formData, totalDebit: value })
                }}
                placeholder="خودکار محاسبه می‌شود"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCredit">جمع کل بستانکار</Label>
              <Input
                id="totalCredit"
                type="number"
                value={formatNumber(formData.totalCredit)}
                onChange={(e) => {
                  const value = parseNumber(e.target.value)
                  setFormData({ ...formData, totalCredit: value })
                }}
                placeholder="خودکار محاسبه می‌شود"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'تأیید و ادامه'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

