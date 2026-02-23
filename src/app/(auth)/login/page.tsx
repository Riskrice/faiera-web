import { LoginForm } from '@/components/auth/login-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'تسجيل الدخول - Faiera',
    description: 'قم بتسجيل الدخول إلى حسابك في منصة فاير التعليمية',
};

export default function LoginPage() {
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight font-cairo">مرحباً بعودتك 👋</h1>
                <p className="text-sm text-muted-foreground">
                    أدخل بريدك الإلكتروني للدخول إلى حسابك
                </p>
            </div>
            <LoginForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
                ليس لديك حساب؟{' '}
                <Link
                    href="/register"
                    className="underline hover:text-primary underline-offset-4"
                >
                    إنشاء حساب جديد
                </Link>
            </p>
        </div>
    );
}
