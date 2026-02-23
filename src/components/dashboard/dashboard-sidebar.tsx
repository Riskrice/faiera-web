'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    BarChart3,
    Settings,
    LogOut,
    PlusCircle,
    GraduationCap,
    Trophy,
    LineChart,
    BrainCircuit,
    Video,
    Banknote,
    Calendar,
    CreditCard,
    FileText,
    Heart
} from 'lucide-react';

const adminItems = [
    {
        title: 'نظرة عامة',
        href: '/dashboard',
        icon: LayoutDashboard
    },
    {
        title: 'الكورسات',
        href: '/dashboard/courses',
        icon: BookOpen
    },
    {
        title: 'الحصص', // Added
        href: '/dashboard/sessions',
        icon: Video
    },
    {
        title: 'الطلاب',
        href: '/dashboard/students',
        icon: Users
    },
    {
        title: 'المعلمين',
        href: '/dashboard/teachers',
        icon: GraduationCap
    },
    {
        title: 'طلبات السحب',
        href: '/dashboard/withdrawals',
        icon: Banknote
    },
    {
        title: 'الاختبارات',
        href: '/dashboard/assessments',
        icon: Trophy
    },
    {
        title: 'بنك الأسئلة',
        href: '/dashboard/question-bank',
        icon: BrainCircuit
    },
    {
        title: 'الاشتراكات',
        href: '/dashboard/subscriptions',
        icon: BarChart3
    },
    {
        title: 'التحليلات',
        href: '/dashboard/analytics',
        icon: LineChart
    },
    {
        title: 'الإعدادات',
        href: '/dashboard/settings',
        icon: Settings
    }
];

const studentItems = [
    {
        title: 'الرئيسية',
        href: '/student',
        icon: LayoutDashboard
    },
    {
        title: 'كورساتي',
        href: '/student/courses',
        icon: BookOpen
    },
    {
        title: 'الحصص المباشرة',
        href: '/student/sessions',
        icon: Video
    },
    {
        title: 'الاختبارات',
        href: '/student/assessments',
        icon: FileText
    },
    {
        title: 'اشتراكاتي', // Added
        href: '/student/subscriptions',
        icon: CreditCard
    },
    {
        title: 'المحفوظات',
        href: '/student/wishlist',
        icon: Heart
    },
    {
        title: 'تقدمي',
        href: '/student/progress',
        icon: LineChart
    },
    {
        title: 'الإعدادات',
        href: '/student/settings',
        icon: Settings
    }
];

const teacherItems = [
    {
        title: 'الرئيسية',
        href: '/teacher',
        icon: LayoutDashboard
    },
    {
        title: 'حصصي',
        href: '/teacher/sessions',
        icon: Video
    },
    {
        title: 'المواعيد المتاحة', // Added
        href: '/teacher/availability',
        icon: Calendar
    },
    {
        title: 'الطلاب',
        href: '/teacher/students',
        icon: Users
    },
    {
        title: 'المحفظة',
        href: '/teacher/wallet',
        icon: BarChart3
    },
    {
        title: 'الإعدادات',
        href: '/teacher/settings',
        icon: Settings
    }
];

export function DashboardSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // Prioritize user role from AuthContext, fallback to path for unauthenticated states (rare)
    const isStudent = user?.role === 'student' || pathname?.startsWith('/student');
    const isTeacher = user?.role === 'teacher' || pathname?.startsWith('/teacher');

    const sidebarItems = isStudent ? studentItems : isTeacher ? teacherItems : adminItems;
    const title = isStudent ? 'Faiera Student' : isTeacher ? 'Faiera Teacher' : 'Faiera Admin';

    // Get user display info
    const displayName = user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.email?.split('@')[0] || 'مستخدم');
    const displayEmail = user?.email || '';
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <aside className="hidden lg:flex flex-col w-64 border-l border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl font-cairo">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black">
                        <span className="text-lg">F</span>
                    </div>
                    <span>{title}</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors font-cairo",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.title}
                        </Link>
                    );
                })}

                {!isStudent && !isTeacher && (
                    <div className="pt-4 mt-4 border-t border-border">
                        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            إجراءات سريعة
                        </div>
                        <Link href="/dashboard/courses">
                            <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                                <PlusCircle className="w-4 h-4" />
                                كورس جديد
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                </Button>
            </div>
        </aside>
    );
}

