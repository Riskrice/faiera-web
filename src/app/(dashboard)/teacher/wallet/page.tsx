"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DollarSign,
    TrendingUp,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Download,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts"

type Transaction = {
    id: string
    type: "earning" | "withdrawal"
    amount: number
    description: string
    date: Date
    status: "completed" | "pending" | "processing" | "rejected"
}

type TeacherProfile = {
    currentBalance: number
    frozenBalance: number
    totalEarnings: number
    totalWithdrawn: number
}

export default function TeacherWalletPage() {
    const { accessToken } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [stats, setStats] = useState<TeacherProfile>({
        currentBalance: 0,
        frozenBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
    const [withdrawAmount, setWithdrawAmount] = useState("")

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    // Fetch Teacher Profile Data
    useEffect(() => {
        const fetchData = async () => {
            if (!accessToken) {
                setIsLoading(false)
                return
            }

            try {
                // Fetch profile with balance
                const profileResponse = await fetch(`${apiUrl}/teachers/profile/me`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                })

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    const profile = profileData.data || profileData
                    setStats({
                        currentBalance: profile.currentBalance || 0,
                        frozenBalance: profile.frozenBalance || 0,
                        totalEarnings: profile.totalEarnings || 0,
                        totalWithdrawn: profile.totalWithdrawn || 0
                    })
                }

                // Fetch withdrawal history (transactions)
                // Note: This endpoint may need to be created if it doesn't exist
                // For now, we'll show bookings as earnings
                const bookingsResponse = await fetch(`${apiUrl}/teachers/bookings/my?status=completed`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                })

                if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json()
                    const bookings = bookingsData.data || []

                    // Transform bookings to transactions
                    const earningTransactions: Transaction[] = bookings.map((booking: any) => ({
                        id: booking.id,
                        type: "earning" as const,
                        amount: booking.totalPrice || 0,
                        description: `حصة ${booking.bookingType === 'single' ? 'فردية' : 'باقة'} - ${booking.student?.firstName || 'طالب'}`,
                        date: new Date(booking.completedAt || booking.createdAt),
                        status: "completed" as const
                    }))

                    setTransactions(earningTransactions)
                }

            } catch (error) {
                console.error("Error fetching wallet data:", error)
                toast.error("فشل في تحميل بيانات المحفظة")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [accessToken, apiUrl])

    const handleWithdrawSubmit = async () => {
        const amount = parseFloat(withdrawAmount)
        if (!amount || amount <= 0) {
            toast.error("يرجى إدخال مبلغ صحيح")
            return
        }
        if (amount > stats.currentBalance) {
            toast.error("رصيدك الحالي غير كافٍ")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`${apiUrl}/teachers/withdraw`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount,
                    paymentDetails: { method: 'bank' }
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "فشل طلب السحب")
            }

            toast.success("تم تقديم طلب السحب بنجاح 💸", {
                description: "سيتم مراجعة الطلب وتحويل المبلغ خلال 3 أيام عمل."
            })
            setIsWithdrawDialogOpen(false)
            setWithdrawAmount("")

            // Optimistic update
            setStats(prev => ({
                ...prev,
                currentBalance: prev.currentBalance - amount,
                frozenBalance: prev.frozenBalance + amount
            }))
            setTransactions(prev => [{
                id: Date.now().toString(),
                type: "withdrawal",
                amount: amount,
                description: "طلب سحب أرباح (قيد المعالجة)",
                date: new Date(),
                status: "pending"
            }, ...prev])

        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء تقديم الطلب")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold font-cairo flex items-center gap-2">
                    <Wallet className="w-8 h-8 text-primary" />
                    المحفظة والأرباح
                </h1>
                <p className="text-muted-foreground mt-1">متابعة الأرباح، الرصيد المتاح، وسجل المعاملات المالية.</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">الرصيد المتاح للسحب</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{stats.currentBalance.toLocaleString()} EGP</div>
                        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="w-full mt-4 gap-2"
                                    disabled={stats.currentBalance <= 0}
                                >
                                    طلب سحب الأرباح
                                    <ArrowUpRight className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>طلب سحب أرباح</DialogTitle>
                                    <DialogDescription>
                                        أدخل المبلغ المراد سحبه. سيتم تحويل المبلغ إلى حسابك المسجل.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>المبلغ المتاح للسحب</Label>
                                        <div className="text-2xl font-bold text-emerald-600">{stats.currentBalance.toLocaleString()} EGP</div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">مبلغ السحب</Label>
                                        <div className="relative">
                                            <Input
                                                id="amount"
                                                placeholder="0.00"
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                            />
                                            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">EGP</span>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>إلغاء</Button>
                                    <Button onClick={handleWithdrawSubmit} disabled={isSubmitting}>
                                        {isSubmitting ? "جاري المعالجة..." : "تأكيد السحب"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">أرصدة معلقة / قيد التنفيذ</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.frozenBalance.toLocaleString()} EGP</div>
                        <p className="text-xs text-muted-foreground mt-1">تشمل طلبات السحب والحصص التي لم تنتهِ فترة ضمانها</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الأرباح (الكلية)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEarnings.toLocaleString()} EGP</div>
                        <p className="text-xs text-muted-foreground mt-1">منذ انضمامك للمنصة</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-cairo text-lg">سجل المعاملات</CardTitle>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        تصدير CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد معاملات بعد</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map(transaction => (
                                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {transaction.type === 'earning' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm md:text-base">{transaction.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <span>{transaction.date.toLocaleDateString('ar-EG')}</span>
                                                <span>•</span>
                                                <span>{transaction.date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <Badge variant={
                                                    transaction.status === 'completed' ? 'secondary' :
                                                        transaction.status === 'pending' ? 'outline' : 'default'
                                                } className={`text-[10px] h-5 px-1.5 ${transaction.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    transaction.status === 'processing' || transaction.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' :
                                                        transaction.status === 'rejected' ? 'bg-red-100 text-red-700' : ''
                                                    }`}>
                                                    {transaction.status === 'completed' ? 'مكتمل' :
                                                        transaction.status === 'pending' ? 'قيد الانتظار' :
                                                            transaction.status === 'rejected' ? 'مرفوض' : 'معالجة'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-bold dir-ltr ${transaction.type === 'earning' ? 'text-emerald-600' : 'text-foreground'
                                        }`}>
                                        {transaction.type === 'earning' ? '+' : '-'}{transaction.amount.toLocaleString()} EGP
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
