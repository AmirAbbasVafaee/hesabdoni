'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import api from '@/lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { username, password })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Check if admin and redirect accordingly
      if (response.data.user.isAdmin) {
        localStorage.setItem('isAdmin', 'true')
        toast({
          title: 'ورود موفق',
          description: 'با موفقیت وارد پنل مدیریت شدید',
        })
        router.push('/admin/companies')
      } else {
        localStorage.removeItem('isAdmin')
        toast({
          title: 'ورود موفق',
          description: 'با موفقیت وارد شدید',
        })
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast({
        title: 'خطا در ورود',
        description: error.response?.data?.error || 'نام کاربری یا رمز عبور اشتباه است',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ورود به حساب‌دونی</CardTitle>
          <CardDescription className="text-center">
            لطفاً اطلاعات ورود خود را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">شناسه ملی</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="شناسه ملی شرکت"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="رمز عبور"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

