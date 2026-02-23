import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            {/* Right Side: Form Container (Order 2 on Mobile, 1 on Desktop if using RTL, but grid-cols handles it) */}
            {/* Since it's RTL, the first column in DOM is Right in LTR? No. 
                In RTL, grid cols are Right to Left? 
                Tailwind LTR default. We want Form on one side, Image on other.
                Let's assume standard LTR DOM structure, CSS handles direction.
            */}

            <div className="flex flex-col justify-center items-center p-8 lg:p-12 bg-background order-2 lg:order-1 relative z-10">
                <div className="w-full max-w-[400px] space-y-6">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="font-bold text-2xl font-cairo">
                            <img
                                src="/logo.png"
                                alt="Faiera Logo"
                                className="h-10 w-auto object-contain drop-shadow-sm"
                                style={{ imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }}
                            />
                        </Link>
                    </div>

                    {children}

                    <div className="pt-8 text-center text-sm text-muted-foreground">
                        <p>
                            محمى بواسطة{' '}
                            <Link href="/privacy-policy" className="underline hover:text-primary underline-offset-4">
                                سياسة الخصوصية
                            </Link>{' '}
                            و{' '}
                            <Link href="/terms-of-use" className="underline hover:text-primary underline-offset-4">
                                شروط الاستخدام
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Left Side: Brand Hero (Order 1 on Mobile (hidden?), 2 on Desktop) */}
            <div className="relative hidden lg:flex flex-col bg-[#0F1115] text-white p-12 overflow-hidden order-1 lg:order-2 border-l border-white/5">
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2667&auto=format&fit=crop"
                        alt="Education Background"
                        fill
                        className="object-cover opacity-20"
                        priority
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-primary/20" />
                </div>

                {/* Brand Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <Link href="/" className="flex items-center gap-2 font-bold text-3xl font-cairo">
                            <img
                                src="/logo.png"
                                alt="Faiera Logo"
                                className="h-10 w-auto object-contain drop-shadow-sm"
                                style={{ imageRendering: 'crisp-edges', WebkitFontSmoothing: 'antialiased' }}
                            />
                        </Link>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <blockquote className="space-y-2">
                            <p className="text-2xl font-medium leading-relaxed font-cairo">
                                &ldquo;التعليم هو السلاح الأقوى الذي يمكنك استخدامه لتغيير العالم. في Faiera، نؤمن بأن كل طالب يستحق فرصة للتميز.&rdquo;
                            </p>
                            <footer className="text-sm text-gray-400">
                                &mdash; فريق فاير التعليمي
                            </footer>
                        </blockquote>

                        <div className="flex items-center gap-4 pt-4">
                            <div className="flex -space-x-4 space-x-reverse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 overflow-hidden relative">
                                        <Image
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                                            alt="User"
                                            fill
                                            unoptimized
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-medium">
                                أكثر من <span className="text-primary font-bold">10,000+</span> طالب يثقون بنا
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
