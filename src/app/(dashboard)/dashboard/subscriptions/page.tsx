'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    CreditCard,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    X,
    Loader2,
    RefreshCw
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Subscription = {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    plan: {
        id: string;
        nameAr: string;
        nameEn: string;
        price: number;
    };
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
};

export default function SubscriptionsPage() {
    const { accessToken } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const fetchSubscriptions = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // We need to get all subscriptions - this endpoint should exist or be created
            const response = await fetch(`${apiUrl}/subscriptions/my`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("فشل في تحميل الاشتراكات");

            const data = await response.json();
            setSubscriptions(data.data || data || []);
        } catch (error: any) {
            console.error("Error fetching subscriptions:", error);
            toast.error(error.message || "حدث خطأ أثناء تحميل الاشتراكات");
        } finally {
            setLoading(false);
        }
    }, [accessToken, apiUrl]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    // Filter subscriptions
    const filteredSubscriptions = subscriptions
        .filter(sub => {
            if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
            if (!debouncedSearchTerm) return true;
            const searchLower = debouncedSearchTerm.toLowerCase();
            const userName = `${sub.user?.firstName || ''} ${sub.user?.lastName || ''}`.toLowerCase();
            const planName = (sub.plan?.nameAr || '').toLowerCase();
            return userName.includes(searchLower) || planName.includes(searchLower);
        });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3" /> نشط</Badge>;
            case 'expired':
                return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> منتهي</Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> ملغي</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">الاشتراكات</h2>
                    <p className="text-muted-foreground">إدارة اشتراكات الطلاب والباقات ({subscriptions.length} اشتراك)</p>
                </div>
                <Button variant="outline" onClick={fetchSubscriptions} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن اشتراك (اسم الطالب، الباقة)..."
                        className="pr-9 pl-9"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                    />
                    {localSearchTerm && (
                        <button
                            onClick={() => setLocalSearchTerm('')}
                            className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="w-[180px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الحالات</SelectItem>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="expired">منتهي</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الطالب</TableHead>
                            <TableHead className="text-right">الباقة</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ البداية</TableHead>
                            <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSubscriptions.length > 0 ? (
                            filteredSubscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {sub.user?.firstName?.[0]}{sub.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium">{sub.user?.firstName} {sub.user?.lastName}</div>
                                                <div className="text-xs text-muted-foreground">{sub.user?.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-primary" />
                                            <span className="font-medium">{sub.plan?.nameAr || 'باقة'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono font-bold text-emerald-600">
                                        {sub.plan?.price?.toLocaleString() || 0} EGP
                                    </TableCell>
                                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                    <TableCell className="font-sans text-sm">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            {new Date(sub.startDate).toLocaleDateString('ar-EG')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-sans text-sm">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            {new Date(sub.endDate).toLocaleDateString('ar-EG')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {debouncedSearchTerm || statusFilter !== 'all' ? "لا توجد اشتراكات مطابقة." : "لا توجد اشتراكات بعد."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
