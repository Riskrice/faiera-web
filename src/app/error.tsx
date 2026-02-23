'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground" dir="rtl">
            <div className="text-center space-y-6 p-8">
                <div className="text-6xl">⚠️</div>
                <h2 className="text-2xl font-bold font-cairo">حدث خطأ غير متوقع</h2>
                <p className="text-muted-foreground font-cairo max-w-md">
                    {error.message || 'حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.'}
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-cairo font-bold hover:opacity-90 transition-opacity"
                >
                    حاول مرة أخرى
                </button>
            </div>
        </div>
    );
}
