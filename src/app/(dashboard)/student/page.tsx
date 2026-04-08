'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Target, Clock, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts';
import { getStudentStats, getStudentProgress } from '@/lib/api';
import { toast } from 'sonner';

interface StudentStats {
    completedCourses: number;
    hoursLearned: number;
    activeCourses: number;
    streakDays: number;
}

interface UserProgress {
    id: string;
    contentId: string;
    content: {
        id: string;
        titleAr: string;
        titleEn: string;
        courseId?: string;
        moduleId?: string;
    };
    completedAt: string | null;
    lastAccessedAt: string;
    timeSpent: number;
    metadata?: any;
}

export default function StudentDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [lastWatched, setLastWatched] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const catalogHref = '/explore';

    // Get user's display name
    const displayName = user?.firstName || 'طالب';

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [statsRes, progressRes] = await Promise.all([
                    getStudentStats(),
                    getStudentProgress(1)
                ]);

                setStats(statsRes.data);
                if (progressRes.data && progressRes.data.length > 0) {
                    setLastWatched(progressRes.data[0]);
                }
            } catch (error: any) {
                // If 401, session expired, let auth context handle logout
                if (error?.statusCode === 401) {
                    return;
                }
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    if (authLoading || (loading && !stats)) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-background border border-primary/10 p-8">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold font-cairo mb-2">مرحباً بعودتك، {displayName} 👋</h1>
                        <p className="text-muted-foreground max-w-xl">
                            {stats && stats.hoursLearned > 0
                                ? `لقد أحرزت تقدماً رائعاً! أكملت ${stats.hoursLearned} ساعة تعليمية. استمر في العمل الجيد.`
                                : 'مرحباً بك في رحلة التعلم. ابدأ الآن لاستكشاف الكورسات المتاحة.'}
                        </p>
                    </div>
                    <Button size="lg" className="rounded-full px-8 font-cairo font-bold shadow-lg shadow-primary/20" asChild>
                        <Link href={lastWatched ? '/student/courses' : catalogHref}>
                            {lastWatched ? 'استئناف التعلم' : 'تصفح الكورسات'}
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الكورسات الحالية</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeCourses || 0}</div>
                        <p className="text-xs text-muted-foreground">كورسات قيد التقدم</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ساعات التعلم</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.hoursLearned || 0}</div>
                        <p className="text-xs text-muted-foreground">ساعة إجمالية</p>
                    </CardContent>
                </Card>
            </div>

            {/* Continue Watching Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold font-cairo">استئناف المشاهدة</h2>
                    <Link href={catalogHref} className="text-primary hover:underline text-sm font-medium">عرض كل الكورسات</Link>
                </div>

                {lastWatched ? (
                    <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center hover:bg-muted/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/courses/${lastWatched.content?.courseId || lastWatched.metadata?.courseId}/learn?lessonId=${lastWatched.contentId}`}>
                        <div className="relative w-full md:w-64 aspect-video rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                            {lastWatched.metadata?.courseThumbnail ? (
                                <img 
                                    src={lastWatched.metadata.courseThumbnail} 
                                    alt="Course Thumbnail"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : null}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <PlayCircle className="w-10 h-10 text-white opacity-80 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded">
                                استئناف
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-right w-full">
                            <div className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {lastWatched.metadata?.courseTitle || 'كورس تعليمي'}
                            </div>
                            <h3 className="text-xl font-bold">{lastWatched.content?.titleAr || lastWatched.content?.titleEn || lastWatched.metadata?.titleAr || 'درس تعليمي'}</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                                {lastWatched.completedAt ? 'لقد أكملت هذا الدرس.' : 'أنت في منتصف هذا الدرس. اضغط للاستكمال.'}
                            </p>
                        </div>
                        <div>
                            <Button variant="secondary" className="group-hover:bg-primary group-hover:text-white transition-colors">
                                إكمال الدرس
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                        <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold">لم تبدأ أي كورس بعد</h3>
                        <p className="text-muted-foreground mb-4">ابدأ رحلتك التعليمية الآن واستكشف مئات الدروس.</p>
                        <Button asChild>
                            <Link href={catalogHref}>تصفح الكتالوج</Link>
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}
