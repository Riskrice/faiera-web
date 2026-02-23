import { RegisterForm } from '@/components/auth/register-form';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'إنشاء حساب - Faiera',
    description: 'انضم إلى منصة فاير التعليمية وابدأ رحلة التفوق',
};

export default function RegisterPage() {
    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight font-cairo">حساب جديد 🚀</h1>
                <p className="text-sm text-muted-foreground">
                    أدخل بياناتك لإنشاء حساب والبدء في التعلم
                </p>
            </div>
            <RegisterForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
                لديك حساب بالفعل؟{' '}
                <Link
                    href="/login"
                    className="underline hover:text-primary underline-offset-4"
                >
                    تسجيل الدخول
                </Link>
            </p>
        </div>
    );
}
