'use client';

import Link from 'next/link';
import Image from 'next/image';
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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6 lg:px-12 py-3 md:py-4",
                scrolled ? "bg-background/88 backdrop-blur-xl border-b border-white/5 py-2.5 md:py-3" : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <div className="relative h-10 w-[92px] md:h-14 md:w-[132px] lg:h-16 lg:w-[152px] flex items-center justify-center">
                        <Image
                            src="/logo.png"
                            alt="Faiera Logo"
                            fill
                            sizes="(max-width: 768px) 92px, (max-width: 1024px) 132px, 152px"
                            className="object-contain scale-[2.1] md:scale-[2.2] origin-center drop-shadow-sm"
                        />
                    </div>
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
                <button className="md:hidden text-foreground p-2 -mr-2 rounded-full hover:bg-background/70" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="md:hidden bg-background/98 backdrop-blur-xl border-t border-border mt-3 rounded-2xl overflow-hidden shadow-lg"
                >
                    <div className="flex flex-col p-5 space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="text-muted-foreground hover:text-primary text-lg font-cairo"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <hr className="border-border" />
                        {user ? (
                            <Link href="/dashboard" className="w-full" onClick={() => setIsOpen(false)}>
                                <Button className="w-full font-cairo text-base py-5 shadow-lg">الذهاب إلى لوحة التحكم</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-foreground font-cairo font-bold" onClick={() => setIsOpen(false)}>تسجيل الدخول</Link>
                                <Link href="/register" className="w-full" onClick={() => setIsOpen(false)}>
                                    <Button className="w-full font-cairo text-base py-5 shadow-lg">اشترك مجاناً</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
