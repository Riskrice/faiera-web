'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body style={{ backgroundColor: '#050a05', color: '#ecfdf5', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>حدث خطأ</h2>
                        <p style={{ color: '#6ee7b7', marginBottom: '1.5rem' }}>{error.message}</p>
                        <button
                            onClick={reset}
                            style={{
                                backgroundColor: '#10B981',
                                color: '#fff',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                            }}
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
