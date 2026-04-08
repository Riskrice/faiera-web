'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';

export default function WelcomePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [countdown, setCountdown] = useState(4);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const timeout = setTimeout(() => {
            if (!user) {
                router.replace('/student');
                return;
            }
            switch (user.role) {
                case 'admin':
                case 'super_admin':
                    router.replace('/dashboard');
                    break;
                case 'teacher':
                    router.replace('/teacher');
                    break;
                case 'student':
                default:
                    router.replace('/student');
            }
        }, 4000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [user, router]);

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
                fontFamily: "'Cairo', 'Segoe UI', sans-serif",
                direction: 'rtl',
                padding: '2rem',
            }}
        >
            {/* Animated background circles */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            >
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(99,102,241,${0.08 + i * 0.02}) 0%, transparent 70%)`,
                            width: `${200 + i * 100}px`,
                            height: `${200 + i * 100}px`,
                            top: `${10 + i * 12}%`,
                            left: `${5 + i * 15}%`,
                            animation: `pulse-${i} ${3 + i}s ease-in-out infinite alternate`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleIn {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.15); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes checkDraw {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes ringPulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.12); opacity: 0.2; }
                }
                @keyframes countdownShrink {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 220; }
                }
                .card {
                    animation: fadeInUp 0.7s ease-out both;
                }
                .checkmark-circle {
                    animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
                }
                .check-path {
                    stroke-dasharray: 60;
                    stroke-dashoffset: 60;
                    animation: checkDraw 0.5s ease-out 0.85s forwards;
                }
                .ring-pulse {
                    animation: ringPulse 2s ease-in-out infinite;
                }
                .text-line-1 { animation: fadeInUp 0.5s ease-out 1s both; }
                .text-line-2 { animation: fadeInUp 0.5s ease-out 1.15s both; }
                .text-line-3 { animation: fadeInUp 0.5s ease-out 1.3s both; }
                .countdown-ring { animation: countdownShrink 4s linear 0.5s forwards; }
            `}</style>

            <div
                className="card"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '2rem',
                    padding: '3.5rem 3rem',
                    maxWidth: '480px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                }}
            >
                {/* Checkmark Icon */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                    {/* Pulsing ring */}
                    <div
                        className="ring-pulse"
                        style={{
                            position: 'absolute',
                            inset: '-12px',
                            borderRadius: '50%',
                            border: '2px solid rgba(110, 231, 183, 0.5)',
                        }}
                    />
                    <div
                        className="checkmark-circle"
                        style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
                        }}
                    >
                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                            <path
                                className="check-path"
                                d="M10 22 L18 31 L34 14"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-line-1"
                    style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: '#fff',
                        margin: '0 0 0.5rem',
                        lineHeight: 1.2,
                    }}
                >
                    أهلاً بك في فايرة! 🎉
                </h1>

                {/* Subtitle */}
                <p
                    className="text-line-2"
                    style={{
                        fontSize: '1.05rem',
                        color: 'rgba(255,255,255,0.7)',
                        margin: '0 0 2rem',
                        lineHeight: 1.7,
                    }}
                >
                    تم تفعيل حسابك بنجاح. مرحباً بك في منصتنا التعليمية،
                    <br />
                    ابدأ رحلتك التعليمية الآن!
                </p>

                {/* Countdown */}
                <div
                    className="text-line-3"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                    }}
                >
                    {/* SVG Countdown ring */}
                    <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="26" cy="26" r="22" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                            <circle
                                className="countdown-ring"
                                cx="26"
                                cy="26"
                                r="22"
                                stroke="#6366f1"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray="138"
                                strokeDashoffset="0"
                            />
                        </svg>
                        <span
                            style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                            }}
                        >
                            {countdown}
                        </span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
                        جاري تحويلك للوحة التحكم...
                    </span>
                </div>
            </div>
        </div>
    );
}
