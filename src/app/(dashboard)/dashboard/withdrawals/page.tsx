"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Loader2,
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts"

type WithdrawalRequest = {
    id: string
    teacher: {
        id: string
        user: {
            firstName: string
            lastName: string
            email: string
        }
    }
    amount: number
    status: "pending" | "approved" | "rejected"
    createdAt: string
    processedAt?: string
    paymentMethod?: string
    paymentDetails?: any
}

export default function WithdrawalsPage() {
    const { accessToken } = useAuth()
    const [requests, setRequests] = useState<WithdrawalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
    const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'VIEW' | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    const fetchRequests = useCallback(async () => {
        if (!accessToken) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${apiUrl}/teachers/admin/withdrawals`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) throw new Error("فشل في تحميل الطلبات")

            const data = await response.json()
            setRequests(data.data || data || [])
        } catch (error: any) {
            console.error("Error fetching withdrawals:", error)
            toast.error(error.message || "حدث خطأ أثناء تحميل الطلبات")
        } finally {
            setLoading(false)
        }
    }, [accessToken, apiUrl])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const filteredRequests = requests.filter(req => {
        if (!searchTerm) return true
        const name = `${req.teacher?.user?.firstName || ''} ${req.teacher?.user?.lastName || ''}`.toLowerCase()
        return name.includes(searchTerm.toLowerCase()) ||
            req.amount.toString().includes(searchTerm)
    })

    const handleProcess = async () => {
        if (!selectedRequest || !actionType || actionType === 'VIEW' || !accessToken) return

        setIsLoading(true)
        try {
            const response = await fetch(`${apiUrl}/teachers/admin/withdrawals/${selectedRequest.id}/process`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: actionType
                }),
            })

            if (!response.ok) throw new Error("فشل في معالجة الطلب")

            toast.success(actionType === 'APPROVE' ? "تمت الموافقة على الطلب ✅" : "تم رفض الطلب ❌")
            fetchRequests()
            setSelectedRequest(null)
            setActionType(null)
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء معالجة الطلب")
        } finally {
            setIsLoading(false)
        }
    }

    const openConfirmDialog = (req: WithdrawalRequest, type: 'APPROVE' | 'REJECT' | 'VIEW') => {
        setSelectedRequest(req)
        setActionType(type)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">طلبات السحب</h2>
                    <p className="text-muted-foreground">إدارة ومراجعة طلبات سحب الأرباح من المعلمين ({requests.length} طلب)</p>
                </div>
                <Button variant="outline" onClick={fetchRequests} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث باسم المعلم أو المبلغ..."
                        className="pr-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">المعلم</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">تاريخ الطلب</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>
                                                    {request.teacher?.user?.firstName?.[0]}{request.teacher?.user?.lastName?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">
                                                    {request.teacher?.user?.firstName} {request.teacher?.user?.lastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {request.teacher?.user?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold font-mono text-emerald-600">
                                        {request.amount.toLocaleString()} EGP
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            request.status === 'approved' ? 'default' :
                                                request.status === 'pending' ? 'outline' : 'destructive'
                                        } className={
                                            request.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                request.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''
                                        }>
                                            {request.status === 'approved' ? 'مكتمل' :
                                                request.status === 'pending' ? 'قيد الانتظار' : 'مرفوض'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {request.status === 'pending' && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                                    onClick={() => openConfirmDialog(request, 'APPROVE')}
                                                    title="موافقة"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => openConfirmDialog(request, 'REJECT')}
                                                    title="رفض"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        {request.status !== 'pending' && (
                                            <span className="text-sm text-muted-foreground">تم المعالجة</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    لا توجد طلبات سحب بعد.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'APPROVE' ? 'تأكيد الموافقة على السحب' :
                                actionType === 'REJECT' ? 'رفض طلب السحب' :
                                    'تفاصيل طلب السحب'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'APPROVE'
                                ? `هل أنت متأكد من تحويل مبلغ ${selectedRequest?.amount} EGP للمعلم ${selectedRequest?.teacher?.user?.firstName} ${selectedRequest?.teacher?.user?.lastName}؟`
                                : actionType === 'REJECT'
                                    ? `هل أنت متأكد من رفض طلب السحب؟ سيتم إعادة المبلغ لرصيد المعلم.`
                                    : `بيانات طلب السحب`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest?.paymentDetails && (
                        <div className="bg-muted p-4 rounded-md text-sm">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary border-b pb-2 border-border/50">
                                <DollarSign className="w-4 h-4" />
                                <span>بيانات التحويل</span>
                            </h4>
                            <div className="grid gap-4">
                                {Object.entries(selectedRequest.paymentDetails).map(([key, value]) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-xs font-bold">{key}:</span>
                                        <span className="font-mono text-base bg-background p-2 rounded border select-all" dir="ltr">
                                            {String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {actionType === 'VIEW' ? (
                            <Button onClick={() => setSelectedRequest(null)}>إغلاق</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setSelectedRequest(null)}>إلغاء</Button>
                                <Button
                                    variant={actionType === 'APPROVE' ? 'default' : 'destructive'}
                                    className={actionType === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={handleProcess}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'جاري التنفيذ...' : (actionType === 'APPROVE' ? 'تأكيد التحويل' : 'رفض الطلب')}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
