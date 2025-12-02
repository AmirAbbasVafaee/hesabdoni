'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Upload, Plus, X, FileText } from 'lucide-react'
import api, { getBackendBaseUrl } from '@/lib/api'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ContractCategory {
  id: string
  name: string
  isCustom: boolean
}

interface Contract {
  id: string
  categoryId: string
  title: string
  contractCode: string
  contractDate: string
  documentUrl: string
  documentFileName: string
  category: ContractCategory | null
}

export default function EditContractPage() {
  const params = useParams()
  const contractId = params.id as string
  const [categories, setCategories] = useState<ContractCategory[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: '',
    title: '',
    contractCode: '',
    contractDate: '',
    document: null as File | null,
  })
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const fetchContract = useCallback(async () => {
    try {
      const response = await api.get(`/contracts/${contractId}`)
      const contractData = response.data.contract
      setContract(contractData)
      setFormData({
        categoryId: contractData.categoryId || '',
        title: contractData.title,
        contractCode: contractData.contractCode,
        contractDate: contractData.contractDate ? new Date(contractData.contractDate).toISOString().split('T')[0] : '',
        document: null,
      })
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/contracts/categories')
      setCategories(response.data.categories || [])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchCategories()
    fetchContract()
  }, [fetchContract, fetchCategories, router])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'خطا',
        description: 'نام دسته‌بندی الزامی است',
        variant: 'destructive',
      })
      return
    }

    setCreatingCategory(true)
    try {
      const response = await api.post('/contracts/categories', { name: newCategoryName.trim() })
      setCategories([...categories, response.data.category])
      setFormData({ ...formData, categoryId: response.data.category.id })
      setNewCategoryName('')
      setShowNewCategoryDialog(false)
      toast({
        title: 'موفق',
        description: 'دسته‌بندی با موفقیت ایجاد شد',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ایجاد دسته‌بندی',
        variant: 'destructive',
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoryId || !formData.title || !formData.contractCode || !formData.contractDate) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای الزامی را پر کنید',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const submitFormData = new FormData()
      submitFormData.append('categoryId', formData.categoryId)
      submitFormData.append('title', formData.title)
      submitFormData.append('contractCode', formData.contractCode)
      submitFormData.append('contractDate', formData.contractDate)
      if (formData.document) {
        submitFormData.append('document', formData.document)
      }

      await api.put(`/contracts/${contractId}`, submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast({
        title: 'موفق',
        description: 'قرارداد با موفقیت به‌روزرسانی شد',
        variant: 'default',
      })

      router.push('/contracts')
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در به‌روزرسانی قرارداد',
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

  if (!contract) {
    return null
  }

  const getDocumentUrl = (documentUrl: string) => {
    const baseUrl = getBackendBaseUrl()
    return `${baseUrl}${documentUrl}`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/contracts">
          <Button variant="ghost">
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت به لیست قراردادها
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ویرایش قرارداد</CardTitle>
          <CardDescription>اطلاعات قرارداد را ویرایش کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="categoryId">دسته‌بندی *</Label>
              <div className="flex gap-2">
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCategoryDialog(true)}
                >
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن دسته‌بندی
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">عنوان قرارداد *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان قرارداد را وارد کنید"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractCode">کد یکتای قرارداد *</Label>
              <Input
                id="contractCode"
                value={formData.contractCode}
                onChange={(e) => setFormData({ ...formData, contractCode: e.target.value })}
                placeholder="کد یکتای قرارداد را وارد کنید"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractDate">تاریخ قرارداد *</Label>
              <Input
                id="contractDate"
                type="date"
                value={formData.contractDate}
                onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">فایل قرارداد (تصویر یا PDF)</Label>
              {contract.documentUrl && (
                <div className="mb-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contract.documentFileName}</span>
                  </div>
                  <a
                    href={getDocumentUrl(contract.documentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    مشاهده فایل فعلی
                  </a>
                </div>
              )}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {formData.document ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{formData.document.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, document: null })}
                    >
                      <X className="ml-2 h-4 w-4" />
                      حذف فایل
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {contract.documentUrl ? 'برای تغییر فایل کلیک کنید' : 'برای آپلود فایل کلیک کنید'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">فقط فایل‌های تصویری (JPG, PNG) و PDF</p>
                    <input
                      id="document-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData({ ...formData, document: file })
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">اگر فایل جدیدی انتخاب نکنید، فایل قبلی حفظ می‌شود</p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
              <Link href="/contracts">
                <Button type="button" variant="outline">
                  انصراف
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن دسته‌بندی جدید</DialogTitle>
            <DialogDescription>
              نام دسته‌بندی جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="نام دسته‌بندی"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)} disabled={creatingCategory}>
              انصراف
            </Button>
            <Button onClick={handleCreateCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              {creatingCategory ? 'در حال ایجاد...' : 'ایجاد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

