'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function OAuthRedirectHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleOAuth = async () => {
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken'); // if provided

            if (accessToken) {
                // Here we store the token. 
                // Since our AuthContext relies on cookies or localStorage, we should set it.
                // Assuming standard token structure:
                localStorage.setItem('faiera_backend_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('faiera_refresh_token', refreshToken);        
                }
                
                // Set the cookie as well for server-side auth
                document.cookie = `faiera_session=${accessToken}; path=/; max-age=604800`;
                if (refreshToken) {
                    document.cookie = `faiera_refresh=${refreshToken}; path=/; max-age=604800`;
                }

                toast.success('تم تسجيل الدخول بنجاح', {      
                    description: 'جاري تحويلك للصفحة الرئيسية...',
                });

                // Use window.location.href to force a full reload and re-initialize AuthContext
                window.location.href = '/dashboard';
            } else {
                toast.error('حدث خطأ أثناء تسجيل الدخول', {
                    description: 'لم يتم العثور على بيانات الاعتماد',
                });
                router.push('/login');
            }
        };

        handleOAuth();
    }, [router, searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-medium text-foreground">جاري التحقق من تسجيل الدخول...</h2>
            <p className="text-sm text-muted-foreground mt-2">يرجى الانتظار لحظات</p>
        </div>
    );
}

export default function OAuthRedirectPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <OAuthRedirectHandler />
        </Suspense>
    );
}