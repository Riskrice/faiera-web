'use client';

import { Course } from '@/data/courses';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, Play, ShieldCheck, Share2, Heart, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SecurePlayer } from '@/components/video/secure-player';

interface EnrollmentCardProps {
    course: Course;
}

export function EnrollmentCard({ course }: EnrollmentCardProps) {
    const router = useRouter();
    const { user, accessToken, loading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    // Console log for debug
    console.log('EnrollmentCard Auth State:', { user: user?.email, hasToken: !!accessToken, authLoading });

    const [isSaved, setIsSaved] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Find first free video lesson for preview
    const previewLessonId = course.curriculum?.find(chapter =>
        chapter.lessons.some(l => l.isFree && l.type === 'video')
    )?.lessons.find(l => l.isFree && l.type === 'video')?.id;

    useEffect(() => {
        // Check if course is saved in localStorage
        const savedCourses = JSON.parse(localStorage.getItem('faiera_saved_courses') || '[]');
        setIsSaved(savedCourses.includes(course.id));
    }, [course.id]);

    const handleShare = async () => {
        const shareData = {
            title: course.titleEn || course.titleAr,
            text: course.descriptionEn || course.descriptionAr,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
            toast.success('تم نسخ رابط الكورس');
        }
    };

    const handleSave = () => {
        const savedCourses = JSON.parse(localStorage.getItem('faiera_saved_courses') || '[]');

        if (isSaved) {
            const newSaved = savedCourses.filter((id: string) => id !== course.id);
            localStorage.setItem('faiera_saved_courses', JSON.stringify(newSaved));
            setIsSaved(false);
            toast.success('تم إزالة الكورس من المحفوظات');
        } else {
            savedCourses.push(course.id);
            localStorage.setItem('faiera_saved_courses', JSON.stringify(savedCourses));
            setIsSaved(true);
            toast.success('تم حفظ الكورس بنجاح');
        }
    };

    const handleEnroll = async () => {
        if (authLoading) return; // Wait for auth check

        // Check if user is logged in
        if (!user || !accessToken) {
            console.log('User not logged in, redirecting...');
            toast.error('يجب تسجيل الدخول أولاً');
            router.push(`/login?redirect=/courses/${course.id}`);
            return;
        }

        // If course is free, go directly to learn page
        if (!course.price || course.price <= 0) {
            router.push(`/courses/${course.id}/learn`);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/payments/checkout/course/${course.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'حدث خطأ' }));
                throw new Error(error.message || 'فشل في بدء عملية الدفع');
            }

            const result = await response.json();
            const paymentUrl = result.data?.paymentUrl;

            if (paymentUrl) {
                // Redirect to payment gateway
                window.location.href = paymentUrl;
            } else {
                throw new Error('لم يتم إرجاع رابط الدفع');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error(error.message || 'فشل في بدء عملية الدفع');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl sticky top-24 z-30"
        >
            {/* Video Thumbnail Area */}
            <div
                className="relative aspect-video w-full group cursor-pointer overflow-hidden"
                onClick={() => {
                    if (previewLessonId) {
                        setShowPreview(true);
                    } else {
                        toast.info('لا توجد مقدمة مجانية متاحة لهذا الكورس حالياً');
                    }
                }}
            >
                <Image
                    src={course.thumbnail || course.thumbnailUrl || '/assets/login-illustration.png'}
                    alt={course.titleAr || course.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="text-white font-bold drop-shadow-md">مشاهدة المقدمة</span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Price */}
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-foreground font-sans">{course.price} {course.currency || 'EGP'}</span>
                    <span className="text-lg text-muted-foreground line-through font-sans decoration-destructive/50 mb-1">
                        {(course.price * 1.5).toFixed(0)} {course.currency || 'EGP'}
                    </span>
                    <span className="mr-auto text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                        خصم 33% لفترة محدودة
                    </span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={handleEnroll}
                        disabled={isLoading || authLoading}
                        className="w-full text-lg h-12 font-bold font-cairo bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        {isLoading || authLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                {authLoading ? 'جاري التحقق...' : 'جاري تحميل صفحة الدفع...'}
                            </>
                        ) : (
                            'اشترك الآن'
                        )}
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={handleSave}
                            className="w-full border-border text-foreground hover:bg-muted hover:text-foreground bg-transparent"
                        >
                            <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                            {isSaved ? 'محفوظ' : 'حفظ'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleShare}
                            className="w-full border-border text-foreground hover:bg-muted hover:text-foreground bg-transparent"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            مشاركة
                        </Button>
                    </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-foreground font-cairo text-sm">مميزات الكورس:</h4>
                    <ul className="space-y-2">
                        {(course.features || []).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{feature}</span>
                            </li>
                        ))}
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>صلاحية دخول مدى الحياة</span>
                        </li>
                    </ul>
                </div>

                {/* Guarantee */}
                <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ضمان استرجاع الأموال خلال 14 يوم</span>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-5xl bg-black border-white/10 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent flex flex-row items-center justify-between">
                        <DialogTitle className="text-white text-lg font-cairo pointer-events-none">
                            مقدمة الكورس
                        </DialogTitle>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-50 pointer-events-auto"
                        >
                            <span className="sr-only">إغلاق</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </DialogHeader>
                    <div className="aspect-video w-full bg-black flex items-center justify-center relative mt-12 mb-6">
                        {showPreview && previewLessonId && (
                            <SecurePlayer
                                lessonId={previewLessonId}
                                autoPlay
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
