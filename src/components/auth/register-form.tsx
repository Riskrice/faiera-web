'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, ShieldCheck, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts';

// Simple Label component
const Label = ({ className, htmlFor, ...props }: React.ComponentProps<'label'>) => (
    <label
        htmlFor={htmlFor}
        className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
        {...props}
    />
);

// Regex for password strength
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,}$/;

const registerSchema = z.object({
    fullName: z.string().min(3, { message: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل' }),
    email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
    password: z.string().regex(strongPasswordRegex, {
        message: 'كلمة المرور ضعيفة. يجب أن تحتوي على حرف كبير، صغير، رقم، ورمز خاص.'
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isOtpLoading, setIsOtpLoading] = React.useState(false);
    const [isResendingOtp, setIsResendingOtp] = React.useState(false);
    const [verificationEmail, setVerificationEmail] = React.useState('');
    const [otpCode, setOtpCode] = React.useState('');
    const { signUp, verifyOtp, requestOtp } = useAuth();

    // Watch password for strength meter
    const [passwordStrength, setPasswordStrength] = React.useState(0);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const passwordValue = form.watch('password');

    React.useEffect(() => {
        if (!passwordValue) {
            setPasswordStrength(0);
            return;
        }
        let strength = 0;
        if (passwordValue.length >= 8) strength += 10; // Length
        if (/[A-Z]/.test(passwordValue)) strength += 25; // Uppercase
        if (/[a-z]/.test(passwordValue)) strength += 25; // Lowercase
        if (/[0-9]/.test(passwordValue)) strength += 20; // Number
        if (/[^A-Za-z0-9]/.test(passwordValue)) strength += 20; // Symbol
        setPasswordStrength(Math.min(strength, 100));
    }, [passwordValue]);

    async function onSubmit(data: RegisterValues) {
        setIsLoading(true);
        const { error } = await signUp(data.email, data.password, { name: data.fullName });
        setIsLoading(false);

        if (error) {
            toast.error('خطأ في إنشاء الحساب', {
                description: error.message || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
            });
        } else {
            setVerificationEmail(data.email);
            setOtpCode('');
            toast.success('تم إنشاء الحساب', {
                description: 'أرسلنا كود تحقق إلى بريدك الإلكتروني. أدخله لإتمام التفعيل.',
            });
        }
    }

    async function handleVerifyOtp() {
        if (!verificationEmail || otpCode.trim().length !== 6) {
            toast.error('أدخل كود التحقق المكوّن من 6 أرقام');
            return;
        }

        setIsOtpLoading(true);
        const { error } = await verifyOtp(verificationEmail, otpCode.trim(), false);
        setIsOtpLoading(false);

        if (error) {
            toast.error('فشل التحقق من الكود', {
                description: error.message || 'الكود غير صحيح أو انتهت صلاحيته.',
            });
            return;
        }

        toast.success('تم تفعيل الحساب بنجاح');
    }

    async function handleResendOtp() {
        if (!verificationEmail) {
            return;
        }

        setIsResendingOtp(true);
        const { error } = await requestOtp(verificationEmail);
        setIsResendingOtp(false);

        if (error) {
            toast.error('تعذر إعادة إرسال الكود', {
                description: error.message || 'حاول مرة أخرى بعد قليل.',
            });
            return;
        }

        toast.success('تم إرسال كود جديد إلى بريدك الإلكتروني');
    }

    const getStrengthColor = (score: number) => {
        if (score <= 30) return 'bg-red-500';
        if (score <= 70) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="grid gap-6">
            {verificationEmail ? (
                <div className="grid gap-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-right">
                        <div className="mb-2 flex items-center justify-end gap-2 text-primary">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-sm font-bold">تأكيد البريد الإلكتروني</span>
                        </div>
                        <p className="text-sm leading-7 text-muted-foreground">
                            أنشأنا الحساب بنجاح وأرسلنا كود OTP إلى
                            {' '}
                            <span className="font-bold text-foreground">{verificationEmail}</span>
                            . أدخل الكود لتفعيل الحساب وإتمام تسجيل الدخول.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="otpCode">كود التحقق</Label>
                        <div className="relative">
                            <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="otpCode"
                                placeholder="123456"
                                inputMode="numeric"
                                maxLength={6}
                                disabled={isOtpLoading}
                                value={otpCode}
                                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="pr-9 text-right font-sans tracking-[0.35em]"
                            />
                        </div>
                    </div>

                    <Button type="button" onClick={handleVerifyOtp} disabled={isOtpLoading} className="mt-2 text-base h-11">
                        {isOtpLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        تأكيد الكود وتفعيل الحساب
                    </Button>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={handleResendOtp} disabled={isResendingOtp} className="flex-1">
                            {isResendingOtp && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            إعادة إرسال الكود
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => {
                                setVerificationEmail('');
                                setOtpCode('');
                            }}
                        >
                            <RotateCcw className="ml-2 h-4 w-4" />
                            تعديل البريد أو البيانات
                        </Button>
                    </div>
                </div>
            ) : (
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                    {/* Full Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">الاسم الكامل</Label>
                        <div className="relative">
                            <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="fullName"
                                placeholder="محمد أحمد"
                                type="text"
                                autoCapitalize="words"
                                disabled={isLoading}
                                className={cn(
                                    "pr-9 text-right",
                                    form.formState.errors.fullName && "border-destructive focus-visible:ring-destructive"
                                )}
                                {...form.register('fullName')}
                            />
                            {form.formState.errors.fullName && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.fullName.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                disabled={isLoading}
                                className={cn(
                                    "pr-9 text-right",
                                    form.formState.errors.email && "border-destructive focus-visible:ring-destructive"
                                )}
                                {...form.register('email')}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                disabled={isLoading}
                                className={cn(
                                    "pr-9 text-right font-sans",
                                    form.formState.errors.password && "border-destructive focus-visible:ring-destructive"
                                )}
                                {...form.register('password')}
                            />
                        </div>
                        {/* Strength Meter */}
                        {passwordValue && (
                            <div className="space-y-1 mt-1">
                                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                                        style={{ width: `${passwordStrength}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-left font-sans">
                                    قوة كلمة المرور: {passwordStrength}%
                                </p>
                            </div>
                        )}
                        {form.formState.errors.password && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                placeholder="••••••••"
                                type="password"
                                disabled={isLoading}
                                className="pr-9 text-right font-sans"
                                {...form.register('confirmPassword')}
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="mt-2 text-base h-11">
                        {isLoading && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                        إنشاء حساب
                    </Button>
                </div>
            </form>
            )}
        </div>
    );
}
