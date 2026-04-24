'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    ShieldAlert,
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
    Heart,
    Compass,
    type LucideIcon,
} from 'lucide-react';

interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

interface DashboardSidebarProps {
    collapsed?: boolean;
}

const adminItems: SidebarItem[] = [
    { title: 'نظرة عامة', href: '/dashboard', icon: LayoutDashboard },
    { title: 'الكورسات', href: '/dashboard/courses', icon: BookOpen },
    { title: 'الحصص', href: '/dashboard/sessions', icon: Video },
    { title: 'الطلاب', href: '/dashboard/students', icon: Users },
    { title: 'المعلمين', href: '/dashboard/teachers', icon: GraduationCap },
    { title: 'طلبات السحب', href: '/dashboard/withdrawals', icon: Banknote },
    { title: 'الاختبارات', href: '/dashboard/assessments', icon: Trophy },
    { title: 'بنك الأسئلة', href: '/dashboard/question-bank', icon: BrainCircuit },
    { title: 'الاشتراكات', href: '/dashboard/subscriptions', icon: BarChart3 },
    { title: 'التحليلات', href: '/dashboard/analytics', icon: LineChart },
    { title: 'الإعدادات', href: '/dashboard/settings', icon: Settings },
];

const studentItems: SidebarItem[] = [
    { title: 'نظرة عامة', href: '/student', icon: LayoutDashboard },
    { title: 'كورساتي', href: '/student/courses', icon: BookOpen },
    { title: 'كل كورسات المنصة', href: '/student/explore', icon: Compass },
    { title: 'الحصص المباشرة', href: '/student/sessions', icon: Video },
    { title: 'الاختبارات', href: '/student/assessments', icon: FileText },
    { title: 'اشتراكاتي', href: '/student/subscriptions', icon: CreditCard },
    { title: 'المحفوظات', href: '/student/wishlist', icon: Heart },
    { title: 'التقدم', href: '/student/progress', icon: LineChart },
    { title: 'الإعدادات', href: '/student/settings', icon: Settings },
];

const teacherItems: SidebarItem[] = [
    { title: 'نظرة عامة', href: '/teacher', icon: LayoutDashboard },
    { title: 'حصصي', href: '/teacher/sessions', icon: Video },
    { title: 'المواعيد المتاحة', href: '/teacher/availability', icon: Calendar },
    { title: 'الطلاب', href: '/teacher/students', icon: Users },
    { title: 'المحفظة', href: '/teacher/wallet', icon: BarChart3 },
    { title: 'الإعدادات', href: '/teacher/settings', icon: Settings },
];

export function DashboardSidebar({ collapsed = false }: DashboardSidebarProps) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [canManageAdmins, setCanManageAdmins] = useState(false);

    useEffect(() => {
        setCanManageAdmins(user?.role === 'super_admin');
    }, [user]);

    const isStudent = user?.role === 'student' || pathname?.startsWith('/student');
    const isTeacher = user?.role === 'teacher' || pathname?.startsWith('/teacher');

    let sidebarItems = isStudent ? studentItems : isTeacher ? teacherItems : adminItems;

    // Inject a single admin-management entry right before "Settings" for super admins only.
    if (canManageAdmins && !isStudent && !isTeacher) {
        const rbacItems: SidebarItem[] = [
            { title: 'إدارة المشرفين', href: '/admin/team', icon: ShieldAlert },
        ];
        const settingsIndex = sidebarItems.findIndex(item => item.href === '/dashboard/settings');
        if (settingsIndex !== -1) {
            sidebarItems = [
                ...sidebarItems.slice(0, settingsIndex),
                ...rbacItems,
                ...sidebarItems.slice(settingsIndex)
            ];
        } else {
            sidebarItems = [...sidebarItems, ...rbacItems];
        }
    }

    const title = isStudent ? 'Faiera Student' : isTeacher ? 'Faiera Teacher' : 'Faiera Admin';

    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName}`
        : (user?.email?.split('@')[0] || 'مستخدم');
    const displayEmail = user?.email || '';
    const initials = displayName.substring(0, 2).toUpperCase();

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-l border-border bg-card/50 backdrop-blur-xl h-screen sticky top-0 transition-all duration-300 sidebar-collapsed',
                collapsed ? 'w-20' : 'w-64',
            )}
        >
            <div className={cn('h-16 flex items-center border-b border-border', collapsed ? 'justify-center px-2' : 'justify-start px-4')}>
                <Link href="/" className={cn('flex items-center min-w-0 font-bold text-xl font-cairo', collapsed ? 'justify-center' : 'gap-2')}>
                    <Image src="/logo.png" alt="فايرة" width={32} height={32} className="rounded-lg" />
                    {!collapsed && <span className="truncate">{title}</span>}
                </Link>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const isActive =
                        item.href === '/admin/team'
                            ? pathname?.startsWith('/admin/')
                            : pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.title : undefined}
                            className={cn(
                                'flex items-center rounded-lg text-sm font-medium transition-colors font-cairo',
                                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                    );
                })}

                {!isStudent && !isTeacher && !collapsed && (
                    <div className="pt-4 mt-4 border-t border-border">
                        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            إجراءات سريعة
                        </div>
                        <Link href="/dashboard/courses/create">
                            <Button className="w-full justify-start gap-2" variant="outline" size="sm">
                                <PlusCircle className="w-4 h-4" />
                                كورس جديد
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border">
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold" title={displayName}>
                            {initials}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => signOut()}
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </aside>
    );
}

