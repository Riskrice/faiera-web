'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';
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

const egyptianPhoneRegex = /^1[0125]\d{8}$/;

const registerSchema = z.object({
    fullName: z.string().min(3, { message: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل' }),
    phone: z.string().regex(egyptianPhoneRegex, { message: 'أدخل رقم موبايل مصري صحيح (10 أرقام بعد الـ +20)' }),
    email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
    password: z.string().min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const { signUp } = useAuth();
    const router = useRouter();

    // Watch password for strength meter
    const [passwordStrength, setPasswordStrength] = React.useState(0);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            phone: '',
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
        // Ensure phone starts with +20
        const formattedPhone = `+20${data.phone}`;
        const { error } = await signUp(data.email, data.password, { name: data.fullName, phone: formattedPhone });
        setIsLoading(false);

        if (error) {
            toast.error('خطأ في إنشاء الحساب', {
                description: error.message || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
            });
        } else {
            toast.success('تم إنشاء الحساب', {
                description: 'تم إنشاء الحساب بنجاح. تم إرسال رسالة ترحيب إلى بريدك الإلكتروني.',
            });
            form.reset();
            router.push('/login');
        }
    }

    const getStrengthColor = (score: number) => {
        if (score <= 30) return 'bg-red-500';
        if (score <= 70) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="grid gap-6">
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

                    {/* Phone */}
                    <div className="grid gap-2">
                        <Label htmlFor="phone">رقم الموبايل</Label>
                        <div className="relative flex rtl:flex-row-reverse border rounded-md border-input bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow overflow-hidden">
                            {/* Prefix Container */}
                            <div className="flex items-center gap-2 px-3 bg-muted/60 border-l border-input select-none" dir="ltr">
                                <span className="text-lg">🇪🇬</span>
                                <span className="text-sm font-bold text-muted-foreground">+20</span>
                            </div>
                            
                            {/* Input Field */}
                            <div className="relative flex-1 group">
                                <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="phone"
                                    placeholder="1012345678"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    disabled={isLoading}
                                    className={cn(
                                        "pr-9 border-0 focus-visible:ring-0 text-right font-sans",
                                        form.formState.errors.phone && "text-destructive"
                                    )}
                                    {...form.register('phone', {
                                        onChange: (e) => {
                                            // Auto-remove leading 0 if someone types it
                                            const val = e.target.value;
                                            if (val.startsWith('0')) {
                                                form.setValue('phone', val.substring(1));
                                            }
                                        }
                                    })}
                                />
                            </div>
                        </div>
                        {form.formState.errors.phone && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.phone.message}</p>
                        )}
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
                        <p className="text-xs text-muted-foreground">الحد الأدنى 8 أحرف.</p>
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

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        أو تواصل باستخدام
                    </span>
                </div>
            </div>

            <Button 
                variant="outline" 
                type="button" 
                disabled={isLoading} 
                className="h-11"
                onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/google`;
                }}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </Button>
        </div>
    );
}
