'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Navbar() {
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'الرئيسية', href: '/' },
        { name: 'استكشف', href: '/explore' },
        { name: 'الحصص المباشرة', href: '/sessions' },
        { name: 'المسارات', href: '/explore?type=track' },
        { name: 'المعلمين', href: '/mentors' },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 lg:px-12 py-4",
                scrolled ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <img
                        src="/logo.png"
                        alt="Faiera Logo"
                        className="h-10 w-auto object-contain drop-shadow-sm"
                        style={{ imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }}
                    />
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 bg-background/5 px-8 py-2 rounded-full border border-border/50 backdrop-blur-sm shadow-sm">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-muted-foreground hover:text-primary transition-colors font-cairo font-medium text-sm"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <NotificationBell />
                            <div className="h-6 w-px bg-border/50" />
                            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                                لوحة التحكم
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-foreground hover:text-primary transition-colors font-cairo font-bold">
                                تسجيل الدخول
                            </Link>
                            <Link href="/register" className={cn(buttonVariants({ variant: "glow", size: "sm" }), "font-cairo rounded-full px-6")}>
                                اشترك مجاناً
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-foreground p-2 -mr-2" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="md:hidden bg-background border-t border-border mt-4"
                >
                    <div className="flex flex-col p-6 space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-muted-foreground hover:text-primary text-lg font-cairo"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <hr className="border-border" />
                        <Link href="/login" className="text-foreground font-cairo font-bold">تسجيل الدخول</Link>
                        <Button className="w-full font-cairo">اشترك مجاناً</Button>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
