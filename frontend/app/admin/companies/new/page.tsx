'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowRight } from 'lucide-react'
import api from '@/lib/api'

export default function NewCompanyPage() {
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    companyType: '',
    businessType: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [createdCompany, setCreatedCompany] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'نام شرکت الزامی است'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'نام شرکت باید حداقل 2 کاراکتر باشد'
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'شناسه ملی الزامی است'
    } else if (!/^\d{10,11}$/.test(formData.nationalId.trim())) {
      newErrors.nationalId = 'شناسه ملی باید 10 یا 11 رقم باشد'
    }

    if (!formData.companyType) {
      newErrors.companyType = 'نوع شرکت الزامی است'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'خطا در اعتبارسنجی',
        description: 'لطفاً تمام فیلدهای الزامی را به درستی پر کنید',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/admin/company/create', formData)
      setCreatedCompany({
        ...response.data.company,
        password: response.data.password,
      })
      toast({
        title: 'موفق',
        description: 'شرکت با موفقیت ایجاد شد',
        variant: 'success',
      })
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در ایجاد شرکت',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/companies')
  }

  if (createdCompany) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>شرکت با موفقیت ایجاد شد</CardTitle>
            <CardDescription>اطلاعات ورود شرکت</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-semibold mb-2">اطلاعات ورود:</p>
              <p><strong>نام کاربری:</strong> {createdCompany.username}</p>
              <p><strong>رمز عبور:</strong> {createdCompany.password}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/admin/companies')}>
                بازگشت به لیست
              </Button>
              <Button variant="outline" onClick={() => setCreatedCompany(null)}>
                ایجاد شرکت دیگر
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>ایجاد شرکت جدید</CardTitle>
          <CardDescription>اطلاعات شرکت را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">نام شرکت *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (errors.name) {
                    setErrors({ ...errors, name: '' })
                  }
                }}
                onBlur={() => {
                  if (!formData.name.trim()) {
                    setErrors({ ...errors, name: 'نام شرکت الزامی است' })
                  } else if (formData.name.trim().length < 2) {
                    setErrors({ ...errors, name: 'نام شرکت باید حداقل 2 کاراکتر باشد' })
                  } else {
                    setErrors({ ...errors, name: '' })
                  }
                }}
                className={errors.name ? 'border-destructive' : ''}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">شناسه ملی *</Label>
              <Input
                id="nationalId"
                type="text"
                inputMode="numeric"
                value={formData.nationalId}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, nationalId: value })
                  if (errors.nationalId) {
                    setErrors({ ...errors, nationalId: '' })
                  }
                }}
                onBlur={() => {
                  if (!formData.nationalId.trim()) {
                    setErrors({ ...errors, nationalId: 'شناسه ملی الزامی است' })
                  } else if (!/^\d{10,11}$/.test(formData.nationalId.trim())) {
                    setErrors({ ...errors, nationalId: 'شناسه ملی باید 10 یا 11 رقم باشد' })
                  } else {
                    setErrors({ ...errors, nationalId: '' })
                  }
                }}
                className={errors.nationalId ? 'border-destructive' : ''}
                aria-invalid={!!errors.nationalId}
                aria-describedby={errors.nationalId ? 'nationalId-error' : undefined}
                maxLength={11}
              />
              {errors.nationalId && (
                <p id="nationalId-error" className="text-sm text-destructive" role="alert">
                  {errors.nationalId}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyType">نوع شرکت *</Label>
              <Select
                value={formData.companyType}
                onValueChange={(value) => {
                  setFormData({ ...formData, companyType: value })
                  if (errors.companyType) {
                    setErrors({ ...errors, companyType: '' })
                  }
                }}
              >
                <SelectTrigger 
                  id="companyType"
                  dir="rtl"
                  className={`text-right ${errors.companyType ? 'border-destructive' : ''}`}
                  aria-invalid={!!errors.companyType}
                  aria-describedby={errors.companyType ? 'companyType-error' : undefined}
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
              {errors.companyType && (
                <p id="companyType-error" className="text-sm text-destructive" role="alert">
                  {errors.companyType}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">نوع فعالیت</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'در حال ایجاد...' : 'ایجاد شرکت'}
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={loading}
              >
                انصراف
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

