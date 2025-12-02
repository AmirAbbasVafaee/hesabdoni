'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Eye, Edit, Trash2, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import api, { getBackendBaseUrl } from '@/lib/api'
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
  title: string
  contractCode: string
  contractDate: string
  documentUrl: string
  documentFileName: string
  category: ContractCategory | null
  createdAt: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [categories, setCategories] = useState<ContractCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const fetchContracts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      params.append('limit', '1000')

      const response = await api.get(`/contracts/list?${params.toString()}`)
      setContracts(response.data.contracts || [])
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در دریافت لیست قراردادها',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm, toast])

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
    fetchContracts()
  }, [fetchContracts, fetchCategories, router])

  const handleDelete = async () => {
    if (!contractToDelete) return

    setDeleting(true)
    try {
      await api.delete(`/contracts/${contractToDelete.id}`)
      toast({
        title: 'موفق',
        description: 'قرارداد با موفقیت حذف شد',
        variant: 'default',
      })
      setDeleteDialogOpen(false)
      setContractToDelete(null)
      fetchContracts()
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.response?.data?.error || 'خطا در حذف قرارداد',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['عنوان', 'کد قرارداد', 'دسته‌بندی', 'تاریخ قرارداد', 'نام فایل']
    const rows = contracts.map(contract => [
      contract.title,
      contract.contractCode,
      contract.category?.name || '-',
      new Date(contract.contractDate).toLocaleDateString('fa-IR'),
      contract.documentFileName
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `قراردادها_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR')
  }

  const getDocumentUrl = (documentUrl: string) => {
    const baseUrl = getBackendBaseUrl()
    return `${baseUrl}${documentUrl}`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">بایگانی قراردادها</h1>
        <div className="flex gap-2">
          {contracts.length > 0 && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="ml-2 h-4 w-4" />
              خروجی Excel
            </Button>
          )}
          <Link href="/contracts/new">
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              افزودن قرارداد جدید
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست قراردادها</CardTitle>
          <CardDescription>تمام قراردادهای ثبت شده</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس عنوان یا کد قرارداد..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                className="pr-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="فیلتر بر اساس دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' ? 'نتیجه‌ای یافت نشد' : 'هیچ قراردادی ثبت نشده است'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان</TableHead>
                  <TableHead>کد قرارداد</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead>تاریخ قرارداد</TableHead>
                  <TableHead>فایل</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.title}</TableCell>
                    <TableCell>{contract.contractCode}</TableCell>
                    <TableCell>{contract.category?.name || '-'}</TableCell>
                    <TableCell>{formatDate(contract.contractDate)}</TableCell>
                    <TableCell>
                      <a
                        href={getDocumentUrl(contract.documentUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-4 w-4" />
                        مشاهده
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/contracts/${contract.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setContractToDelete(contract)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف قرارداد</DialogTitle>
            <DialogDescription>
              آیا از حذف قرارداد &quot;{contractToDelete?.title}&quot; مطمئن هستید؟ این عمل غیرقابل بازگشت است.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'در حال حذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

