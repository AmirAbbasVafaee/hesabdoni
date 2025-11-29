'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Eye } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

interface Document {
  id: string
  docNumber: string | null
  docDate: string | null
  description: string | null
  totalDebit: number
  totalCredit: number
  status: 'pending' | 'completed'
  createdAt: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const { toast } = useToast()

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents/list?limit=100')
      setDocuments(response.data.documents || [])
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت لیست اسناد',
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
    fetchDocuments()
  }, [fetchDocuments, router])

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      doc.docNumber?.toLowerCase().includes(term) ||
      doc.description?.toLowerCase().includes(term)
    )
  })

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">اسناد مالی</h1>
        <Link href="/documents/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            افزودن سند جدید
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست اسناد</CardTitle>
          <CardDescription>تمام اسناد مالی ثبت شده</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس شماره سند یا شرح..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ سندی ثبت نشده است'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره سند</TableHead>
                  <TableHead>تاریخ سند</TableHead>
                  <TableHead>شرح</TableHead>
                  <TableHead>بدهکار</TableHead>
                  <TableHead>بستانکار</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.docNumber || '-'}</TableCell>
                    <TableCell>
                      {doc.docDate
                        ? new Date(doc.docDate).toLocaleDateString('fa-IR')
                        : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {doc.description || '-'}
                    </TableCell>
                    <TableCell>{formatNumber(doc.totalDebit)}</TableCell>
                    <TableCell>{formatNumber(doc.totalCredit)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          doc.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {doc.status === 'completed' ? 'تکمیل شده' : 'در انتظار'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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

