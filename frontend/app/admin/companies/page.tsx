'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Plus, LogOut, Edit, Key, Search, ChevronRight, ChevronLeft } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Company {
  id: string
  name: string
  nationalId: string
  companyType: string
  businessType: string | null
  username: string
  createdAt: string
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    nationalId: '',
    companyType: '',
    businessType: '',
  })
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await api.get('/admin/company/list')
      setCompanies(response.data.companies)
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت لیست شرکت‌ها',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchCompanies()
  }, [fetchCompanies, router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    router.push('/login')
  }

  // Filter and paginate companies
  const filteredCompanies = companies.filter((company) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      company.name.toLowerCase().includes(term) ||
      company.nationalId.includes(term) ||
      company.companyType.toLowerCase().includes(term) ||
      (company.businessType && company.businessType.toLowerCase().includes(term)) ||
      company.username.includes(term)
    )
  })

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage)
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!editFormData.name.trim()) {
      newErrors.name = 'نام شرکت الزامی است'
    } else if (editFormData.name.trim().length < 2) {
      newErrors.name = 'نام شرکت باید حداقل 2 کاراکتر باشد'
    }

    if (!editFormData.nationalId.trim()) {
      newErrors.nationalId = 'شناسه ملی الزامی است'
    } else {
      const cleaned = editFormData.nationalId.replace(/\D/g, '')
      if (!/^\d{10,11}$/.test(cleaned)) {
        newErrors.nationalId = 'شناسه ملی باید 10 یا 11 رقم باشد'
      }
    }

    if (!editFormData.companyType) {
      newErrors.companyType = 'نوع شرکت الزامی است'
    }

    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setEditFormData({
      name: company.name,
      nationalId: company.nationalId,
      companyType: company.companyType,
      businessType: company.businessType || '',
    })
    setEditErrors({})
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return

    if (!validateEditForm()) {
      toast({
        title: 'خطا در اعتبارسنجی',
        description: 'لطفاً تمام فیلدهای الزامی را به درستی پر کنید',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.put(`/admin/company/${editingCompany.id}`, editFormData)
      setCompanies(companies.map(c => c.id === editingCompany.id ? { ...c, ...response.data.company } : c))
      setEditingCompany(null)
      setEditErrors({})
      toast({
        title: 'موفق',
        description: 'اطلاعات شرکت با موفقیت به‌روزرسانی شد',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در به‌روزرسانی شرکت',
        variant: 'destructive',
      })
    }
  }

  const handleResetPassword = async (companyId: string) => {
    try {
      const response = await api.post(`/admin/company/${companyId}/reset-password`)
      setResettingPassword(companyId)
      setNewPassword(response.data.password)
      toast({
        title: 'موفق',
        description: 'رمز عبور با موفقیت بازنشانی شد',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در بازنشانی رمز عبور',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">مدیریت شرکت‌ها</h1>
        <div className="flex gap-2">
          <Link href="/admin/companies/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              افزودن شرکت جدید
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowLogoutConfirm(true)}>
            <LogOut className="ml-2 h-4 w-4" />
            خروج
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست شرکت‌ها</CardTitle>
          <CardDescription>تمام شرکت‌های ثبت شده در سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، شناسه ملی، نوع شرکت..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
                className="pr-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ شرکتی ثبت نشده است'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام شرکت</TableHead>
                    <TableHead>شناسه ملی</TableHead>
                    <TableHead>نوع شرکت</TableHead>
                    <TableHead>نوع فعالیت</TableHead>
                    <TableHead>نام کاربری</TableHead>
                    <TableHead>تاریخ ثبت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.nationalId}</TableCell>
                    <TableCell>{company.companyType}</TableCell>
                    <TableCell>{company.businessType || '-'}</TableCell>
                    <TableCell>{company.username}</TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString('fa-IR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(company.id)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    نمایش {((currentPage - 1) * itemsPerPage) + 1} تا {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} از {filteredCompanies.length} شرکت
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      قبلی
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      بعدی
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ویرایش شرکت</DialogTitle>
            <DialogDescription>
              اطلاعات شرکت را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">نام شرکت *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, name: e.target.value })
                  if (editErrors.name) {
                    setEditErrors({ ...editErrors, name: '' })
                  }
                }}
                onBlur={() => {
                  if (!editFormData.name.trim()) {
                    setEditErrors({ ...editErrors, name: 'نام شرکت الزامی است' })
                  } else if (editFormData.name.trim().length < 2) {
                    setEditErrors({ ...editErrors, name: 'نام شرکت باید حداقل 2 کاراکتر باشد' })
                  } else {
                    setEditErrors({ ...editErrors, name: '' })
                  }
                }}
                className={editErrors.name ? 'border-destructive' : ''}
                aria-invalid={!!editErrors.name}
                aria-describedby={editErrors.name ? 'edit-name-error' : undefined}
              />
              {editErrors.name && (
                <p id="edit-name-error" className="text-sm text-destructive" role="alert">
                  {editErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nationalId">شناسه ملی *</Label>
              <Input
                id="edit-nationalId"
                type="text"
                inputMode="numeric"
                value={editFormData.nationalId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setEditFormData({ ...editFormData, nationalId: value })
                  if (editErrors.nationalId) {
                    setEditErrors({ ...editErrors, nationalId: '' })
                  }
                }}
                onBlur={() => {
                  const cleaned = editFormData.nationalId.replace(/\D/g, '')
                  if (!cleaned) {
                    setEditErrors({ ...editErrors, nationalId: 'شناسه ملی الزامی است' })
                  } else if (!/^\d{10,11}$/.test(cleaned)) {
                    setEditErrors({ ...editErrors, nationalId: 'شناسه ملی باید 10 یا 11 رقم باشد' })
                  } else {
                    setEditErrors({ ...editErrors, nationalId: '' })
                  }
                }}
                className={editErrors.nationalId ? 'border-destructive' : ''}
                aria-invalid={!!editErrors.nationalId}
                aria-describedby={editErrors.nationalId ? 'edit-nationalId-error' : undefined}
                maxLength={11}
              />
              {editErrors.nationalId && (
                <p id="edit-nationalId-error" className="text-sm text-destructive" role="alert">
                  {editErrors.nationalId}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-companyType">نوع شرکت *</Label>
              <Select
                value={editFormData.companyType}
                onValueChange={(value) => {
                  setEditFormData({ ...editFormData, companyType: value })
                  if (editErrors.companyType) {
                    setEditErrors({ ...editErrors, companyType: '' })
                  }
                }}
              >
                <SelectTrigger 
                  id="edit-companyType" 
                  dir="rtl" 
                  className={`text-right ${editErrors.companyType ? 'border-destructive' : ''}`}
                  aria-invalid={!!editErrors.companyType}
                  aria-describedby={editErrors.companyType ? 'edit-companyType-error' : undefined}
                >
                  <SelectValue placeholder="انتخاب نوع شرکت" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="سهامی خاص">سهامی خاص</SelectItem>
                  <SelectItem value="سهامی عام">سهامی عام</SelectItem>
                  <SelectItem value="مسئولیت محدود">مسئولیت محدود</SelectItem>
                  <SelectItem value="تضامنی">تضامنی</SelectItem>
                </SelectContent>
              </Select>
              {editErrors.companyType && (
                <p id="edit-companyType-error" className="text-sm text-destructive" role="alert">
                  {editErrors.companyType}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-businessType">نوع فعالیت</Label>
              <Input
                id="edit-businessType"
                value={editFormData.businessType}
                onChange={(e) => setEditFormData({ ...editFormData, businessType: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCompany}>
              ذخیره تغییرات
            </Button>
            <Button variant="outline" onClick={() => {
              setEditingCompany(null)
              setEditErrors({})
            }}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأیید خروج</DialogTitle>
            <DialogDescription>
              آیا از خروج از سیستم اطمینان دارید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleLogout}>
              بله، خروج
            </Button>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resettingPassword} onOpenChange={(open) => !open && setResettingPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رمز عبور جدید</DialogTitle>
            <DialogDescription>
              رمز عبور جدید برای این شرکت:
            </DialogDescription>
          </DialogHeader>
          {newPassword && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-semibold mb-2">رمز عبور جدید:</p>
              <p className="text-lg font-mono">{newPassword}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              setResettingPassword(null)
              setNewPassword(null)
            }}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

