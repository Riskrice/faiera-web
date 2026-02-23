'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar, Footer } from '@/components/layout';
import { Loader2, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { toast } from 'sonner';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [isLoading, setIsLoading] = useState(false);
    const [isReset, setIsReset] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('كلمتا المرور غير متطابقتين');
            return;
        }

        if (password.length < 8) {
            toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        if (!token) {
            toast.error('رابط إعادة التعيين غير صالح');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(token, password);
            setIsReset(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (error: any) {
            toast.error(error.message || 'فشل في إعادة تعيين كلمة المرور. الرابط قد يكون منتهي الصلاحية.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold font-cairo">رابط غير صالح</h1>
                    <p className="text-muted-foreground">رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.</p>
                    <Button asChild>
                        <Link href="/forgot-password">طلب رابط جديد</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-full flex flex-col bg-background text-foreground relative pt-20">
            <Navbar />

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
            </div>

            <div className="flex-1 flex items-center justify-center px-8 py-12 relative z-10">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20">
                                <Lock className="w-6 h-6" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold font-cairo text-foreground">إعادة تعيين كلمة المرور</h1>
                        <p className="text-muted-foreground font-sans">
                            {email ? `أدخل كلمة مرور جديدة للحساب ${email}` : 'أدخل كلمة مرور جديدة'}
                        </p>
                    </div>

                    {isReset ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold font-cairo text-foreground">تم تغيير كلمة المرور!</h3>
                            <p className="text-muted-foreground text-sm">
                                سيتم تحويلك لصفحة تسجيل الدخول خلال ثوانٍ...
                            </p>
                            <Button asChild variant="outline" className="mt-4 border-primary/30 text-primary w-full">
                                <Link href="/login">تسجيل الدخول الآن</Link>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            onSubmit={handleSubmit}
                            className="space-y-6 backdrop-blur-xl bg-card/60 p-8 rounded-3xl border border-border/50 shadow-2xl"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground font-cairo">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="pr-10 pl-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    يجب أن تحتوي على حرف كبير وصغير ورقم وحرف خاص
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground font-cairo">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="pr-10"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold font-cairo bg-primary hover:bg-emerald-600 shadow-lg shadow-primary/20 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'تعيين كلمة المرور'}
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
            </div>
            <Footer />
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
