'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, LogOut, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchStats()
  }, [])

  const fetchStats = async () => {
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
  }

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

      <div className="grid gap-4 md:grid-cols-2">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

