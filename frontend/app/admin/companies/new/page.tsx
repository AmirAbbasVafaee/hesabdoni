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
  const [loading, setLoading] = useState(false)
  const [createdCompany, setCreatedCompany] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام شرکت *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">شناسه ملی *</Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyType">نوع شرکت *</Label>
              <Select
                value={formData.companyType}
                onValueChange={(value) => setFormData({ ...formData, companyType: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع شرکت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="سهامی خاص">سهامی خاص</SelectItem>
                  <SelectItem value="سهامی عام">سهامی عام</SelectItem>
                  <SelectItem value="مسئولیت محدود">مسئولیت محدود</SelectItem>
                  <SelectItem value="تضامنی">تضامنی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">نوع فعالیت</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ایجاد...' : 'ایجاد شرکت'}
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

