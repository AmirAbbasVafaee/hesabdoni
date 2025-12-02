'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowRight, ArrowLeft, Check, Circle, Plus, Edit, FileText, X, Eye, Upload } from 'lucide-react'
import Link from 'next/link'
import api, { getBackendBaseUrl } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { UploadArea } from '@/components/UploadArea'

interface DocumentType {
  id: string
  companyId: string
  name: string
  order: number
  isCustom: boolean
  hasDocument: boolean
  document: {
    id: string
    fileUrl: string
    fileName: string
    mimeType: string | null
  } | null
}

export default function CompanyInfoPage() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await api.get('/company-documents/types')
      setDocumentTypes(response.data.types || [])
    } catch (error: any) {
      console.error('Error fetching document types:', error)
      toast({
        title: 'خطا',
        description: 'خطا در دریافت انواع اسناد',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchDocumentTypes()
  }, [fetchDocumentTypes, router])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentTypeId', selectedType.id)

      await api.post('/company-documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      })

      setShowUploadDialog(false)
      setSelectedFile(null)
      setSelectedType(null)
      fetchDocumentTypes()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در آپلود فایل',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast({
        title: 'خطا',
        description: 'نام نوع سند الزامی است',
        variant: 'destructive',
      })
      return
    }

    try {
      await api.post('/company-documents/types', { name: newTypeName.trim() })
      toast({
        title: 'موفق',
        description: 'نوع سند جدید با موفقیت اضافه شد',
      })
      setShowAddTypeDialog(false)
      setNewTypeName('')
      fetchDocumentTypes()
    } catch (error: any) {
      console.error('Add type error:', error)
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در افزودن نوع سند',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('آیا از حذف این نوع سند اطمینان دارید؟')) return

    try {
      await api.delete(`/company-documents/types/${typeId}`)
      toast({
        title: 'موفق',
        description: 'نوع سند با موفقیت حذف شد',
      })
      fetchDocumentTypes()
    } catch (error: any) {
      console.error('Delete type error:', error)
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در حذف نوع سند',
        variant: 'destructive',
      })
    }
  }

  const openUploadDialog = (type: DocumentType) => {
    setSelectedType(type)
    setSelectedFile(null)
    setShowUploadDialog(true)
  }

  const openViewDialog = (type: DocumentType) => {
    setSelectedType(type)
    setShowViewDialog(true)
  }

  const getFileUrl = (fileUrl: string) => {
    const backendUrl = getBackendBaseUrl()
    return `${backendUrl}${fileUrl}`
  }

  const isImage = (mimeType: string | null) => {
    return mimeType?.startsWith('image/') || false
  }

  const completedCount = documentTypes.filter(t => t.hasDocument).length
  const totalCount = documentTypes.length

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">تکمیل اطلاعات</h1>
      </div>

      <div className="mb-6">
        <p className="text-muted-foreground mb-4">
          فرم‌های زیر را تکمیل کنید. فرم‌های تکمیل شده را می‌توانید ویرایش کنید.
        </p>

        {/* Summary Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>خلاصه وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {documentTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2">
                  {type.hasDocument ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={type.hasDocument ? 'text-green-600' : 'text-gray-600'}>
                    {type.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {completedCount < totalCount && (
          <Button
            className="w-full mb-6"
            onClick={() => {
              const firstIncomplete = documentTypes.find(t => !t.hasDocument)
              if (firstIncomplete) {
                openUploadDialog(firstIncomplete)
              }
            }}
          >
            ادامه تکمیل اطلاعات
          </Button>
        )}
      </div>

      {/* Document Type Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentTypes.map((type) => (
          <Card key={type.id} className={type.hasDocument ? 'bg-gray-50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {type.hasDocument ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <CardTitle>{type.name}</CardTitle>
                </div>
                {type.isCustom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteType(type.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription>
                {type.hasDocument
                  ? 'فایل آپلود شده است'
                  : 'لطفاً فایل مربوطه را آپلود کنید'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {type.hasDocument ? (
                    <>
                      <span className="text-sm text-green-600">تکمیل شده</span>
                      {type.document && (
                        <span className="text-xs text-green-600">+ 15 توکن</span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">تکمیل نشده</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {type.hasDocument ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(type)}
                      >
                        <Eye className="ml-2 h-4 w-4" />
                        مشاهده
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUploadDialog(type)}
                      >
                        <Edit className="ml-2 h-4 w-4" />
                        ویرایش
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openUploadDialog(type)}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                      تکمیل
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Custom Type Card */}
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              اضافه شود
            </CardTitle>
            <CardDescription>افزودن نوع سند جدید</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddTypeDialog(true)}
            >
              <Plus className="ml-2 h-4 w-4" />
              افزودن نوع سند جدید
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedType?.hasDocument ? 'ویرایش' : 'آپلود'} {selectedType?.name}
            </DialogTitle>
            <DialogDescription>
              فایل مورد نظر را انتخاب کنید (تصویر یا PDF)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <UploadArea
              onFileSelect={handleFileSelect}
              accept="image/*,.pdf"
              maxSize={10 * 1024 * 1024}
            />
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                فایل انتخاب شده: {selectedFile.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? 'در حال آپلود...' : 'آپلود'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedType?.name}</DialogTitle>
            <DialogDescription>مشاهده فایل آپلود شده</DialogDescription>
          </DialogHeader>
          {selectedType?.document && (
            <div className="space-y-4">
              {isImage(selectedType.document.mimeType) ? (
                <img
                  src={getFileUrl(selectedType.document.fileUrl)}
                  alt={selectedType.document.fileName}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={getFileUrl(selectedType.document.fileUrl)}
                  className="w-full h-[600px] rounded-lg"
                  title={selectedType.document.fileName}
                />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedType.document.fileName}
                </span>
                <a
                  href={getFileUrl(selectedType.document.fileUrl)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <FileText className="ml-2 h-4 w-4" />
                    دانلود
                  </Button>
                </a>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              بستن
            </Button>
            {selectedType && (
              <Button onClick={() => {
                setShowViewDialog(false)
                openUploadDialog(selectedType)
              }}>
                <Edit className="ml-2 h-4 w-4" />
                ویرایش
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Type Dialog */}
      <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن نوع سند جدید</DialogTitle>
            <DialogDescription>
              نام نوع سند جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="typeName">نام نوع سند</Label>
              <Input
                id="typeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="مثال: مجوز فعالیت"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddTypeDialog(false)
              setNewTypeName('')
            }}>
              انصراف
            </Button>
            <Button onClick={handleAddType} disabled={!newTypeName.trim()}>
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

