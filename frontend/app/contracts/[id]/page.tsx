'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Edit, FileText } from 'lucide-react'
import api, { getBackendBaseUrl } from '@/lib/api'
import Link from 'next/link'

interface ContractCategory {
  id: string
  name: string
}

interface Contract {
  id: string
  title: string
  contractCode: string
  contractDate: string
  documentUrl: string
  documentFileName: string
  documentFileSize: number | null
  documentMimeType: string | null
  category: ContractCategory | null
  createdAt: string
  updatedAt: string
}

export default function ContractDetailPage() {
  const params = useParams()
  const contractId = params.id as string
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    try {
      const response = await api.get(`/contracts/${contractId}`)
      setContract(response.data.contract)
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت اطلاعات قرارداد',
        variant: 'destructive',
      })
      router.push('/contracts')
    } finally {
      setLoading(false)
    }
  }, [contractId, toast, router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchContract()
  }, [fetchContract, router])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!contract) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) {
      return `${mb.toFixed(2)} مگابایت`
    }
    const kb = bytes / 1024
    return `${kb.toFixed(2)} کیلوبایت`
  }

  const getDocumentUrl = (documentUrl: string) => {
    const baseUrl = getBackendBaseUrl()
    return `${baseUrl}${documentUrl}`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/contracts">
          <Button variant="ghost">
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت به لیست قراردادها
          </Button>
        </Link>
        <Link href={`/contracts/${contractId}/edit`}>
          <Button>
            <Edit className="ml-2 h-4 w-4" />
            ویرایش قرارداد
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جزئیات قرارداد</CardTitle>
          <CardDescription>اطلاعات کامل قرارداد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">عنوان قرارداد</label>
              <p className="mt-1 text-lg">{contract.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">کد یکتای قرارداد</label>
              <p className="mt-1 text-lg font-mono">{contract.contractCode}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">دسته‌بندی</label>
              <p className="mt-1 text-lg">{contract.category?.name || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">تاریخ قرارداد</label>
              <p className="mt-1 text-lg">{formatDate(contract.contractDate)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">نام فایل</label>
              <p className="mt-1 text-lg">{contract.documentFileName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">حجم فایل</label>
              <p className="mt-1 text-lg">{formatFileSize(contract.documentFileSize)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">نوع فایل</label>
              <p className="mt-1 text-lg">{contract.documentMimeType || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">تاریخ ثبت</label>
              <p className="mt-1 text-lg">{formatDate(contract.createdAt)}</p>
            </div>
          </div>

          <div className="pt-6 border-t">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">فایل قرارداد</label>
            <a
              href={getDocumentUrl(contract.documentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-5 w-5" />
              مشاهده و دانلود فایل
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

