'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts';

// Simple Label component if missing
const Label = ({ className, htmlFor, ...props }: React.ComponentProps<'label'>) => (
    <label
        htmlFor={htmlFor}
        className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
        {...props}
    />
);

const loginSchema = z.object({
    email: z.string().email({ message: 'البريد الإلكتروني غير صحيح' }),
    password: z.string().min(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }),
    remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const { signIn } = useAuth();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    async function onSubmit(data: LoginValues) {
        setIsLoading(true);
        const { error } = await signIn(data.email, data.password, data.remember);
        setIsLoading(false);

        if (error) {
            toast.error('خطأ في تسجيل الدخول', {
                description: error.message || 'تأكد من صحة البريد الإلكتروني وكلمة المرور',
            });
        } else {
            toast.success('تم تسجيل الدخول بنجاح', {
                description: 'جاري تحويلك للصفحة الرئيسية...',
            });
        }
    }

    return (
        <div className="grid gap-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                    {/* Email Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
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

                    {/* Password Field */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                placeholder="••••••••"
                                type="password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                className={cn(
                                    "pr-9 text-right font-sans", // font-sans for dots consistency
                                    form.formState.errors.password && "border-destructive focus-visible:ring-destructive"
                                )}
                                {...form.register('password')}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Remember & Forgot */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            {/* Checkbox implementation might vary if using native or radix. 
                                 Using standard input type checkbox for simplicity if UI component missing, 
                                 but user mentioned Shadcn which usually has Radix Checkbox.
                                 Assume native for stability if component not guaranteed, or attempt imports.
                                 Since I am importing Checkbox from @/components/ui/checkbox, I should use it.
                            */}
                            {/* Checkbox Controller would be better with React Hook Form, 
                                 but register works with native inputs mostly. 
                                 If Shadcn Checkbox is used, we need Controller.
                                 Let's use a standard wrapper for now to avoid complexity without Controller.
                            */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    {...form.register('remember')}
                                />
                                <span className="text-sm text-muted-foreground">تذكرني</span>
                            </label>
                        </div>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            نسيت كلمة المرور؟
                        </Link>
                    </div>

                    <Button type="submit" disabled={isLoading} className="mt-2 text-base h-11">
                        {isLoading && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                        تسجيل الدخول
                    </Button>
                </div>
            </form>




        </div>
    );
}
