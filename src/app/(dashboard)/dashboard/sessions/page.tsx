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
    MoreHorizontal,
    Video,
    Calendar,
    Clock,
    RefreshCw,
    X,
    Loader2
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

type Session = {
    id: string;
    title: string;
    description?: string;
    status: string;
    startTime?: string;
    endTime?: string;
    teacher?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    hostName?: string;
    subject: string;
    grade: string;
    price: number;
    enrollmentsCount?: number;
};

export default function AdminSessionsPage() {
    const { accessToken } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const fetchSessions = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/sessions`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("فشل في تحميل الحصص");

            const data = await response.json();
            setSessions(data.data || data || []);
        } catch (error: any) {
            console.error("Error fetching sessions:", error);
            toast.error("حدث خطأ أثناء تحميل الحصص");
        } finally {
            setLoading(false);
        }
    }, [accessToken, apiUrl]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const filteredSessions = sessions.filter(s => {
        if (!debouncedSearchTerm) return true;
        const searchLower = debouncedSearchTerm.toLowerCase();
        return s.title.toLowerCase().includes(searchLower) ||
            (s.teacher?.firstName && s.teacher.firstName.toLowerCase().includes(searchLower)) ||
            (s.teacher?.lastName && s.teacher.lastName.toLowerCase().includes(searchLower));
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">مجدولة</Badge>;
            case 'live':
                return <Badge variant="default" className="bg-red-600 hover:bg-red-700 animate-pulse">مباشر الآن</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">مكتملة</Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="bg-gray-100 text-gray-700 border-gray-200">ملغاة</Badge>;
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
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">إدارة الحصص</h2>
                    <p className="text-muted-foreground">عرض وإدارة جميع الحصص المباشرة ({sessions.length} حصة)</p>
                </div>
                <Button variant="outline" onClick={fetchSessions} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن حصة أو معلم..."
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
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">الحصة</TableHead>
                            <TableHead className="text-right">المعلم</TableHead>
                            <TableHead className="text-right">الموعد</TableHead>
                            <TableHead className="text-right">السعر</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSessions.length > 0 ? (
                            filteredSessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">{session.title}</span>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="secondary" className="text-[10px] font-normal">{session.subject}</Badge>
                                                <span>{session.grade}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {session.teacher?.firstName || session.hostName || 'معلم غير معروف'} {session.teacher?.lastName || ''}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <span dir="ltr">
                                                    {session.startTime ? format(new Date(session.startTime), 'yyyy-MM-dd') : '---'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span dir="ltr">
                                                    {session.startTime ? format(new Date(session.startTime), 'hh:mm a') : '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium text-green-600">
                                            {session.price > 0 ? `${session.price} ج.م` : 'مجاني'}
                                        </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => { }}>التفاصيل</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    {debouncedSearchTerm ? "لا توجد حصص مطابقة للبحث." : "لا توجد حصص مسجلة."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
