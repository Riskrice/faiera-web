'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Trophy,
    MessageSquare,
    Settings,
    LogOut,
    GraduationCap,
    Clock
} from 'lucide-react';
import { useAuth } from '@/contexts';

const menuItems = [
    { name: 'الرئيسية', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'دوراتي', icon: BookOpen, href: '/dashboard/courses' },
    { name: 'المسارات', icon: GraduationCap, href: '/dashboard/tracks' },
    { name: 'التقدم', icon: Trophy, href: '/dashboard/progress' },
    { name: 'الرسائل', icon: MessageSquare, href: '/dashboard/messages' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <aside className="fixed right-0 top-0 h-screen w-20 lg:w-64 bg-card/80 backdrop-blur-xl border-l border-white/5 z-40 transition-all duration-300 flex flex-col">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3 group">
                    <img
                        src="/logo.png"
                        alt="Faiera Logo"
                        className="h-10 w-auto object-contain drop-shadow-sm"
                        style={{ imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }}
                    />
                </Link>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-6 px-2 lg:px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l-full"
                                    />
                                )}
                                <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                                <span className="hidden lg:block font-cairo font-medium">{item.name}</span>

                                {isActive && (
                                    <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5 space-y-2">
                <Link href="/dashboard/settings">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
                        <Settings className="w-6 h-6" />
                        <span className="hidden lg:block font-cairo">الإعدادات</span>
                    </div>
                </Link>
                <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer">
                    <LogOut className="w-6 h-6" />
                    <span className="hidden lg:block font-cairo">تسجيل خروج</span>
                </button>
            </div>
        </aside>
    );
}
