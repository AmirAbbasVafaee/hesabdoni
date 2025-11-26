'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { Plus, LogOut } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

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
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin')
    if (!isAdmin) {
      router.push('/admin/login')
      return
    }
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
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
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('isAdmin')
    router.push('/admin/login')
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
          <Button variant="outline" onClick={handleLogout}>
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
          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">هیچ شرکتی ثبت نشده است</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام شرکت</TableHead>
                  <TableHead>شناسه ملی</TableHead>
                  <TableHead>نوع شرکت</TableHead>
                  <TableHead>نوع فعالیت</TableHead>
                  <TableHead>نام کاربری</TableHead>
                  <TableHead>تاریخ ثبت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.nationalId}</TableCell>
                    <TableCell>{company.companyType}</TableCell>
                    <TableCell>{company.businessType || '-'}</TableCell>
                    <TableCell>{company.username}</TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString('fa-IR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

