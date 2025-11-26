'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadArea } from '@/components/UploadArea'
import { DocumentCoverModal } from '@/components/DocumentCoverModal'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight, Upload, Check } from 'lucide-react'
import api from '@/lib/api'

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

export default function NewDocumentPage() {
  const [step, setStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [ocrData, setOcrData] = useState<OCRResult | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [fileTitle, setFileTitle] = useState('')
  const [fileOrder, setFileOrder] = useState(1)
  const [uploadingFile, setUploadingFile] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleUploadCover = async () => {
    if (!selectedFile) {
      toast({
        title: 'خطا',
        description: 'لطفاً فایل را انتخاب کنید',
        variant: 'destructive',
      })
      return
    }

    setOcrLoading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append('cover', selectedFile)

      const uploadResponse = await api.post('/documents/upload-cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const fileUrl = uploadResponse.data.fileUrl
      setCoverImageUrl(fileUrl)

      // Process OCR
      const ocrFormData = new FormData()
      ocrFormData.append('image', selectedFile)

      const ocrResponse = await api.post('/documents/ocr', ocrFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setOcrData(ocrResponse.data.data)
      setStep(2)
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در آپلود یا پردازش OCR',
        variant: 'destructive',
      })
    } finally {
      setOcrLoading(false)
    }
  }

  const handleConfirmCover = async (data: OCRResult & { coverImageUrl: string }) => {
    try {
      const response = await api.post('/documents/confirm-cover', data)
      setDocumentId(response.data.document.id)
      setStep(3)
      toast({
        title: 'موفق',
        description: 'روکش سند با موفقیت ثبت شد',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ثبت سند',
        variant: 'destructive',
      })
    }
  }

  const handleUploadDocumentFile = async (file: File) => {
    if (!documentId) {
      toast({
        title: 'خطا',
        description: 'ابتدا باید روکش سند را تأیید کنید',
        variant: 'destructive',
      })
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', fileTitle || file.name)
      formData.append('order', fileOrder.toString())

      await api.post(`/documents/${documentId}/upload-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      })

      setFileTitle('')
      setFileOrder((prev) => prev + 1)
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در آپلود فایل',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFinish = () => {
    router.push('/documents')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">افزودن سند جدید</h1>

      {/* Step 1: Upload Cover */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>مرحله 1: آپلود روکش سند</CardTitle>
            <CardDescription>
              فایل روکش سند را آپلود کنید تا اطلاعات آن به صورت خودکار استخراج شود
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadArea
              onFileSelect={handleFileSelect}
              accept="image/*,.pdf"
            />
            <Button
              onClick={handleUploadCover}
              disabled={!selectedFile || ocrLoading}
              className="w-full"
            >
              {ocrLoading ? (
                'در حال پردازش OCR...'
              ) : (
                <>
                  آپلود و پردازش OCR
                  <ArrowRight className="mr-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Confirm OCR Data */}
      {step === 2 && ocrData && (
        <>
          <DocumentCoverModal
            open={true}
            onOpenChange={() => {}}
            ocrData={ocrData}
            coverImageUrl={coverImageUrl}
            onConfirm={handleConfirmCover}
          />
        </>
      )}

      {/* Step 3: Upload Documents */}
      {step === 3 && documentId && (
        <Card>
          <CardHeader>
            <CardTitle>مرحله 3: آپلود مستندات</CardTitle>
            <CardDescription>
              مستندات مرتبط با این سند را به ترتیب حساب معین آپلود کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">عنوان مستند</Label>
              <Input
                id="fileTitle"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="مثال: فاکتور شماره 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileOrder">ترتیب</Label>
              <Input
                id="fileOrder"
                type="number"
                value={fileOrder}
                onChange={(e) => setFileOrder(parseInt(e.target.value) || 1)}
              />
            </div>
            <UploadArea
              onFileSelect={handleUploadDocumentFile}
              accept="image/*,.pdf"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                بازگشت
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                تکمیل و ذخیره
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

