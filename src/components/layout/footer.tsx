'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        platform: [
            { name: 'استكشف الدورات', href: '/explore' },
            { name: 'المسارات التعليمية', href: '/tracks' },
            { name: 'المعلمون', href: '/mentors' },
        ],
        company: [
            { name: 'شروط الاستخدام', href: '/terms-of-use' },
            { name: 'سياسة الخصوصية', href: '/privacy-policy' },
        ],
    };

    return (
        <footer className="bg-muted/30 border-t border-border pt-20 pb-10 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center gap-3 w-fit">
                            <img
                                src="/logo.png"
                                alt="Faiera Logo"
                                className="h-10 w-auto object-contain drop-shadow-sm"
                                style={{ imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }}
                            />
                        </Link>
                        <p className="text-muted-foreground font-sans leading-relaxed max-w-sm">
                            منصة التعليم الأولى التي تجمع بين المحتوى الأكاديمي المتقن والتجربة العملية الممتعة. نبني مستقبل التعليم التقني في الشرق الأوسط.
                        </p>
                        <div className="flex items-center gap-4">
                            {[
                                { Icon: Facebook, href: 'https://www.facebook.com/people/Faiera-%D9%81%D8%A7%D9%8A%D8%B1%D8%A7/61563330826336/' },
                                { Icon: Instagram, href: 'https://www.instagram.com/faiera_edu' },
                                { Icon: Linkedin, href: 'https://www.linkedin.com/company/faiera' },
                            ].map(({ Icon, href }) => (
                                <Link key={href} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all hover:-translate-y-1">
                                    <Icon className="w-5 h-5" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="space-y-6">
                        <h3 className="font-bold font-cairo text-foreground text-lg">المنصة</h3>
                        <ul className="space-y-4">
                            {footerLinks.platform.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors font-sans text-sm">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="font-bold font-cairo text-foreground text-lg">الشركة</h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors font-sans text-sm">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col gap-2 items-center md:items-start">
                        <p className="text-muted-foreground text-sm font-sans text-center md:text-right">
                            © {currentYear} Faiera Inc. جميع الحقوق محفوظة.
                        </p>
                        <p className="text-xs text-muted-foreground font-sans">
                            محمى بواسطة <Link href="/privacy-policy" className="underline hover:text-primary">سياسة الخصوصية</Link> و <Link href="/terms-of-use" className="underline hover:text-primary">شروط الاستخدام</Link>
                        </p>
                    </div>
                    <div className="flex items-center gap-8">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>تم التطوير بواسطة</span>
                            <Link href="https://riskrice.com" target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline">
                                RiskRice
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
