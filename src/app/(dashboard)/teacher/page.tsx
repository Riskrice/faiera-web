'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useAuth } from '@/contexts';
import {
    Loader2,
    Users,
    GraduationCap,
    Calendar,
    BarChart3,
    ArrowLeft,
    Clock,
    DollarSign,
    Star,
    AlertCircle,
    Video
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
    totalStudents: number;
    averageRating: number;
    totalEarnings: number;
    totalSessions: number;
    pendingRequests: number;
    nextSession: {
        id: string;
        scheduledStartTime: string;
        durationMinutes: number;
        student: {
            firstName: string;
            lastName: string;
            avatar?: string;
        };
        subject: string;
        grade: string;
    } | null;
}

export default function TeacherDashboardPage() {
    const { user, accessToken } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!accessToken) {
                setLoading(false);
                return;
            }
            try {
                const data = await api.get<DashboardStats>('/teachers/dashboard/stats', {
                    token: accessToken
                });
                setStats(data);
            } catch (error) {
                console.error(error);
                toast.error('فشل في تحميل الإحصائيات');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const nextSessionDate = stats?.nextSession
        ? new Date(stats.nextSession.scheduledStartTime)
        : null;

    const isSessionSoon = nextSessionDate &&
        (nextSessionDate.getTime() - new Date().getTime()) < 30 * 60 * 1000; // < 30 mins

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-cairo bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/60">
                        مرحباً، {user?.firstName || 'أستاذي'} 👋
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        إليك نظرة عامة على أدائك وجدولك اليوم.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/teacher/sessions">
                        <Button variant="outline" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            الجدول الكامل
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">الطلاب النشطين</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalStudents}</div>
                        <p className="text-xs text-muted-foreground mt-1">طالب تم تدريسهم</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">الأرباح الحالية</CardTitle>
                        <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">
                            {stats?.totalEarnings}<span className="text-base font-normal text-muted-foreground mr-1">ج.م</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">متاح للسحب</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">التقييم العام</CardTitle>
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
                            <span className="text-sm text-muted-foreground">/ 5.0</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">بناءً على تقييمات الطلاب</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all border-primary/10 bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الحصص</CardTitle>
                        <div className="p-2 bg-purple-100 rounded-full">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalSessions}</div>
                        <p className="text-xs text-muted-foreground mt-1">حصة مكتملة</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Next Session Area */}
                <Card className="md:col-span-4 border-primary/20 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            الحصة القادمة
                        </CardTitle>
                        <CardDescription>تفاصيل حصتك القادمة المجدولة</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.nextSession ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {stats.nextSession.student.firstName[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">
                                            {stats.nextSession.student.firstName} {stats.nextSession.student.lastName}
                                        </h4>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span>{stats.nextSession.subject}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                            <span>{stats.nextSession.grade}</span>
                                        </p>
                                    </div>
                                    <div className="text-left rtl:text-right">
                                        <div className="font-bold text-lg font-mono">
                                            {new Date(stats.nextSession.scheduledStartTime).toLocaleTimeString('ar-EG', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(stats.nextSession.scheduledStartTime).toLocaleDateString('ar-EG')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button className="flex-1 gap-2" size="lg" disabled={!isSessionSoon}>
                                        <Video className="w-5 h-5" />
                                        {isSessionSoon ? 'انضم الآن للحصة' : 'لم يحن الموعد بعد'}
                                    </Button>
                                    <Link href={`/teacher/sessions?id=${stats.nextSession.id}`}>
                                        <Button variant="outline" size="lg">تفاصيل الحصة</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <Calendar className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">لا توجد حصص قادمة</h3>
                                    <p className="text-muted-foreground text-sm">ليس لديك أي حجوزات مجدولة قريباً.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions / Notifications */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            تنبيهات ومهام
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Pending Requests Alert */}
                        {stats?.pendingRequests ? (
                            <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <div>
                                        <p className="font-medium text-sm">طلبات حجز جديدة</p>
                                        <p className="text-xs text-muted-foreground">لديك {stats.pendingRequests} طلبات بانتظار الموافقة</p>
                                    </div>
                                </div>
                                <Link href="/teacher/sessions">
                                    <Button size="sm" variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-100">
                                        مراجعة
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">لا توجد تنبيهات جديدة</p>
                        )}

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">روابط سريعة</h4>
                            <div className="space-y-2">
                                <Link href="/teacher/settings?tab=packages">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span>الباقات والأسعار</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">تعديل أسعار الحصص والباقات</span>
                                        </div>
                                    </Button>
                                </Link>
                                <Link href="/teacher/availability">
                                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span>أوقات العمل</span>
                                            <span className="text-[10px] text-muted-foreground font-normal">تحديث المواعيد المتاحة للحجز</span>
                                        </div>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
