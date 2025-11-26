'use client'

import { useState, useEffect } from 'react'
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
      setFormData({
        ...ocrData,
        coverImageUrl,
      })
    }
  }, [ocrData, coverImageUrl])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تأیید اطلاعات روکش سند</DialogTitle>
          <DialogDescription>
            لطفاً اطلاعات استخراج شده را بررسی و در صورت نیاز ویرایش کنید
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="docDate">تاریخ سند</Label>
              <Input
                id="docDate"
                type="date"
                value={formData.docDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, docDate: e.target.value })
                }
              />
            </div>
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
                onChange={(e) =>
                  setFormData({ ...formData, totalDebit: parseNumber(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCredit">جمع کل بستانکار</Label>
              <Input
                id="totalCredit"
                type="number"
                value={formatNumber(formData.totalCredit)}
                onChange={(e) =>
                  setFormData({ ...formData, totalCredit: parseNumber(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'تأیید و ادامه'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

