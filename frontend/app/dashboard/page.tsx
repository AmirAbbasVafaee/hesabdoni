'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, LogOut, FolderOpen, Building2, Edit } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [companyInfoProgress, setCompanyInfoProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/documents/list?limit=1000')
      const documents = response.data.documents || []
      setStats({
        total: documents.length,
        pending: documents.filter((d: any) => d.status === 'pending').length,
        completed: documents.filter((d: any) => d.status === 'completed').length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCompanyInfoProgress = useCallback(async () => {
    try {
      const response = await api.get('/company-documents/progress')
      setCompanyInfoProgress(response.data)
    } catch (error) {
      console.error('Error fetching company info progress:', error)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStats()
    fetchCompanyInfoProgress()
  }, [fetchStats, fetchCompanyInfoProgress, router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">داشبورد</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="ml-2 h-4 w-4" />
          خروج
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل اسناد</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در انتظار</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تکمیل شده</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>عملیات سریع</CardTitle>
            <CardDescription>دسترسی سریع به بخش‌های مختلف</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/documents/new">
              <Button className="w-full justify-start">
                <Plus className="ml-2 h-4 w-4" />
                افزودن سند جدید
              </Button>
            </Link>
            <Link href="/documents">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="ml-2 h-4 w-4" />
                مشاهده تمام اسناد
              </Button>
            </Link>
            <Link href="/contracts">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="ml-2 h-4 w-4" />
                بایگانی قراردادها
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              تکمیل اطلاعات عمومی شرکت
            </CardTitle>
            <CardDescription>پیشرفت تکمیل پروفایل</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">پیشرفت تکمیل پروفایل</span>
                <span className="font-semibold text-teal-600">{companyInfoProgress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${companyInfoProgress.percentage}%`,
                    background: 'linear-gradient(to right, #14b8a6, #84cc16)'
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {companyInfoProgress.completed} از {companyInfoProgress.total} فرم تکمیل شده
              </p>
            </div>
            <Link href="/company-info" className="block">
              <Button className="w-full" variant={companyInfoProgress.percentage === 100 ? "outline" : "default"}>
                {companyInfoProgress.percentage === 100 ? (
                  <>
                    <Edit className="ml-2 h-4 w-4" />
                    ویرایش اطلاعات
                  </>
                ) : (
                  <>
                    <Plus className="ml-2 h-4 w-4" />
                    تکمیل اطلاعات
                  </>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

