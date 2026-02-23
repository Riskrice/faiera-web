'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar, Footer } from '@/components/layout';
import { Loader2, Mail, ArrowLeft, CheckCircle, ShieldCheck, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await forgotPassword(email);
            setIsSent(true);
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء إرسال رابط الاستعادة');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full flex flex-col bg-background text-foreground relative pt-20">
            <Navbar />

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="flex-1 flex flex-col lg:flex-row-reverse w-full relative z-10">
                {/* Right Section: Visual / Stick to Top on Desktop */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="hidden lg:flex w-1/2 relative items-center justify-center p-12 lg:sticky lg:top-0 h-screen"
                >
                    {/* Portal Card Container */}
                    <div className="relative w-full max-w-[500px] aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/20 outline outline-1 outline-border/30 group">

                        {/* Background/Image Layer */}
                        <div className="absolute inset-0 bg-[#020817]">
                            <img
                                src="/assets/forgot-password-illustration.png"
                                alt="Password Recovery"
                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent opacity-90" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">

                            {/* Floating Badges */}
                            <div className="flex justify-end">
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-xs">حماية وأمان</p>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                                <motion.div
                                    animate={{ x: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                    className="p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 shadow-lg flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                                        <KeyRound className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-xs">استعادة الوصول</p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Bottom Text */}
                            <div className="space-y-4 max-w-sm">
                                <div className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
                                    <span className="text-primary text-xs font-bold">استعادة الحساب</span>
                                </div>
                                <h2 className="text-4xl font-bold font-cairo text-white leading-tight">
                                    لا تقلق، <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">أمنك أولويتنا</span>
                                </h2>
                                <p className="text-gray-400 font-sans text-sm leading-relaxed">
                                    اتبع الخطوات البسيطة لاستعادة كلمة المرور الخاصة بك والعودة إلى رحلتك التعليمية.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Left Section: Form */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-12 relative z-10"
                >
                    <div className="w-full max-w-md space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <Link href="/" className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">F</Link>
                            </div>
                            <h1 className="text-3xl font-bold font-cairo text-foreground">نسيت كلمة المرور؟</h1>
                            <p className="text-muted-foreground font-sans">
                                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                            </p>
                        </div>

                        {/* Success State */}
                        {isSent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold font-cairo text-foreground">تم الإرسال بنجاح!</h3>
                                <p className="text-muted-foreground text-sm">
                                    تحقق من بريدك الإلكتروني <strong>{email}</strong> لاتمام عملية الاستعادة.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => { setIsSent(false); setEmail(''); }}
                                    className="mt-4 border-primary/30 text-primary w-full"
                                >
                                    إرسال مرة أخرى
                                </Button>
                                <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground mt-4">
                                    العودة لتسجيل الدخول
                                </Link>
                            </motion.div>
                        ) : (
                            /* Form State */
                            <motion.form
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                onSubmit={handleSubmit}
                                className="space-y-6 backdrop-blur-xl bg-card/60 p-8 rounded-3xl border border-border/50 shadow-2xl"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground font-cairo">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="example@faiera.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pr-10 dir-ltr"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold font-cairo bg-primary hover:bg-emerald-600 shadow-lg shadow-primary/20 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : "إرسال رابط الاستعادة"}
                                </Button>

                                <div className="flex justify-center mt-6">
                                    <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                                        <ArrowLeft className="w-4 h-4 ml-1" />
                                        العودة لتسجيل الدخول
                                    </Link>
                                </div>
                            </motion.form>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </main>
    );
}
