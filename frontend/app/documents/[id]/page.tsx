'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight, Trash2, Plus, Edit, Save, X } from 'lucide-react'
import api, { getBackendBaseUrl } from '@/lib/api'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { JalaliDateInput } from '@/components/JalaliDateInput'
import { UploadArea } from '@/components/UploadArea'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Document>>({})
  const [newCoverImage, setNewCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchDocument = useCallback(async () => {
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
  }, [params.id, router, toast])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchDocument()
  }, [fetchDocument, router])

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return

    try {
      await api.delete(`/documents/${params.id}/files/${fileId}`)
      setFiles(files.filter((f) => f.id !== fileId))
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت حذف شد',
        variant: 'success',
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

  const handleEdit = () => {
    if (document) {
      setEditData({
        docNumber: document.docNumber || '',
        docDate: document.docDate || '',
        description: document.description || '',
        kolCode: document.kolCode || '',
        moeenCode: document.moeenCode || '',
        tafziliCode: document.tafziliCode || '',
        debit: document.debit,
        credit: document.credit,
        totalDebit: document.totalDebit,
        totalCredit: document.totalCredit,
      })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({})
    setNewCoverImage(null)
    setCoverImagePreview(null)
  }

  const handleCoverImageSelect = (file: File) => {
    setNewCoverImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!document) return

    setSaving(true)
    try {
      let coverImageUrl = document.coverImageUrl

      // Upload new cover image if selected
      if (newCoverImage) {
        const formData = new FormData()
        formData.append('cover', newCoverImage)

        const uploadResponse = await api.post('/documents/upload-cover', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        coverImageUrl = uploadResponse.data.fileUrl
      }

      // Update document
      const updateData = {
        ...editData,
        coverImageUrl,
      }

      const response = await api.put(`/documents/${document.id}`, updateData)
      setDocument(response.data.document)
      setIsEditing(false)
      setEditData({})
      setNewCoverImage(null)
      setCoverImagePreview(null)

      toast({
        title: 'موفق',
        description: 'سند با موفقیت به‌روزرسانی شد',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در به‌روزرسانی سند',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
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
      <div className="mb-6 flex justify-between items-center">
        <Link href="/documents">
          <Button variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به لیست
          </Button>
        </Link>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit className="ml-2 h-4 w-4" />
            ویرایش سند
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="ml-2 h-4 w-4" />
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
            <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
              <X className="ml-2 h-4 w-4" />
              انصراف
            </Button>
          </div>
        )}
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
            {isEditing ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-kolCode">کد حساب کل</Label>
                    <Input
                      id="edit-kolCode"
                      value={editData.kolCode || ''}
                      onChange={(e) => setEditData({ ...editData, kolCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-moeenCode">کد حساب معین</Label>
                    <Input
                      id="edit-moeenCode"
                      value={editData.moeenCode || ''}
                      onChange={(e) => setEditData({ ...editData, moeenCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tafziliCode">کد حساب تفصیل</Label>
                    <Input
                      id="edit-tafziliCode"
                      value={editData.tafziliCode || ''}
                      onChange={(e) => setEditData({ ...editData, tafziliCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-debit">بدهکار</Label>
                    <Input
                      id="edit-debit"
                      type="number"
                      value={editData.debit || 0}
                      onChange={(e) => setEditData({ ...editData, debit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-credit">بستانکار</Label>
                    <Input
                      id="edit-credit"
                      type="number"
                      value={editData.credit || 0}
                      onChange={(e) => setEditData({ ...editData, credit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-totalDebit">جمع کل بدهکار</Label>
                    <Input
                      id="edit-totalDebit"
                      type="number"
                      value={editData.totalDebit || 0}
                      onChange={(e) => setEditData({ ...editData, totalDebit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-totalCredit">جمع کل بستانکار</Label>
                    <Input
                      id="edit-totalCredit"
                      type="number"
                      value={editData.totalCredit || 0}
                      onChange={(e) => setEditData({ ...editData, totalCredit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
            {isEditing ? (
              <div>
                <Label className="mb-2 block">تصویر روکش</Label>
                {coverImagePreview ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-64 rounded border overflow-hidden">
                      <Image
                        src={coverImagePreview}
                        alt="پیش‌نمایش روکش جدید"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewCoverImage(null)
                        setCoverImagePreview(null)
                      }}
                    >
                      <X className="ml-2 h-4 w-4" />
                      حذف تصویر جدید
                    </Button>
                  </div>
                ) : (
                  <UploadArea
                    onFileSelect={handleCoverImageSelect}
                    accept="image/*"
                  />
                )}
                {!coverImagePreview && document.coverImageUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">تصویر فعلی:</p>
                    <div className="relative w-full h-64 rounded border overflow-hidden">
                      <Image
                        src={`${getBackendBaseUrl()}${document.coverImageUrl}`}
                        alt="روکش سند فعلی"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              document.coverImageUrl && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">تصویر روکش</p>
                  <div className="relative w-full h-64 rounded border overflow-hidden">
                    <Image
                      src={`${getBackendBaseUrl()}${document.coverImageUrl}`}
                      alt="روکش سند"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )
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
                            href={`${getBackendBaseUrl()}${file.fileUrl}`}
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

