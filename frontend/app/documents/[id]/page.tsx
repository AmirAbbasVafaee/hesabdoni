'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight, Trash2, Plus } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

interface Document {
  id: string
  docNumber: string | null
  docDate: string | null
  description: string | null
  kolCode: string | null
  moeenCode: string | null
  tafziliCode: string | null
  debit: number
  credit: number
  totalDebit: number
  totalCredit: number
  status: 'pending' | 'completed'
  coverImageUrl: string | null
  createdAt: string
}

interface DocumentFile {
  id: string
  title: string
  order: number
  fileUrl: string
  createdAt: string
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchDocument()
  }, [params.id])

  const fetchDocument = async () => {
    try {
      const response = await api.get(`/documents/${params.id}`)
      setDocument(response.data.document)
      setFiles(response.data.files || [])
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت اطلاعات سند',
        variant: 'destructive',
      })
      router.push('/documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return

    try {
      await api.delete(`/documents/${params.id}/files/${fileId}`)
      setFiles(files.filter((f) => f.id !== fileId))
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت حذف شد',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در حذف فایل',
        variant: 'destructive',
      })
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">در حال بارگذاری...</div>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/documents">
          <Button variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به لیست
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات روکش سند</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">شماره سند</p>
              <p className="text-lg">{document.docNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">تاریخ سند</p>
              <p className="text-lg">
                {document.docDate
                  ? new Date(document.docDate).toLocaleDateString('fa-IR')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">شرح</p>
              <p className="text-lg">{document.description || '-'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کد حساب کل</p>
                <p>{document.kolCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">کد حساب معین</p>
                <p>{document.moeenCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">کد حساب تفصیل</p>
                <p>{document.tafziliCode || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">بدهکار</p>
                <p className="text-lg">{formatNumber(document.debit)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">بستانکار</p>
                <p className="text-lg">{formatNumber(document.credit)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">جمع کل بدهکار</p>
                <p className="text-lg font-bold">{formatNumber(document.totalDebit)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">جمع کل بستانکار</p>
                <p className="text-lg font-bold">{formatNumber(document.totalCredit)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">وضعیت</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  document.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {document.status === 'completed' ? 'تکمیل شده' : 'در انتظار'}
              </span>
            </div>
            {document.coverImageUrl && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">تصویر روکش</p>
                <img
                  src={`http://localhost:5000${document.coverImageUrl}`}
                  alt="روکش سند"
                  className="max-w-full h-auto rounded border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مستندات مرتبط</CardTitle>
            <CardDescription>فایل‌های مرتبط با این سند</CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هیچ مستندی آپلود نشده است
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ترتیب</TableHead>
                    <TableHead>عنوان</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.order}</TableCell>
                      <TableCell>{file.title}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a
                            href={`http://localhost:5000${file.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              مشاهده
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

