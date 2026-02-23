'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CourseCard } from '@/components/ui/course-card';
import { COURSES, Course } from '@/data/courses';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function WishlistPage() {
    const [savedCourses, setSavedCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load saved courses from localStorage
        const loadSavedCourses = () => {
            try {
                const savedIds = JSON.parse(localStorage.getItem('faiera_saved_courses') || '[]');
                const courses = COURSES.filter(course => savedIds.includes(course.id));
                setSavedCourses(courses);
            } catch (error) {
                console.error('Error loading wishlist:', error);
                setSavedCourses([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSavedCourses();

        // Listen for storage events (if user changes tabs)
        window.addEventListener('storage', loadSavedCourses);
        return () => window.removeEventListener('storage', loadSavedCourses);
    }, []);

    const clearWishlist = () => {
        if (confirm('هل أنت متأكد من حذف جميع الكورسات المحفوظة؟')) {
            localStorage.setItem('faiera_saved_courses', '[]');
            setSavedCourses([]);
            toast.success('تم إفراغ المحفوظات');
        }
    };

    const removeFromWishlist = (courseId: string) => {
        const currentSaved = JSON.parse(localStorage.getItem('faiera_saved_courses') || '[]');
        const newSaved = currentSaved.filter((id: string) => id !== courseId);
        localStorage.setItem('faiera_saved_courses', JSON.stringify(newSaved));
        setSavedCourses(prev => prev.filter(c => c.id !== courseId));
        toast.success('تم إزالة الكورس');
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-cairo">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2">
                                الكورسات المحفوظة
                            </h1>
                            <p className="text-muted-foreground">
                                قائمة بالكورسات التي تود دراستها وتتابعها
                            </p>
                        </div>

                        {savedCourses.length > 0 && (
                            <Button variant="destructive" onClick={clearWishlist} className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                حذف الكل
                            </Button>
                        )}
                    </motion.div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-full h-[360px] bg-muted/20 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : savedCourses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-card/30 border border-white/5 rounded-3xl p-10 backdrop-blur-sm"
                        >
                            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
                                <Heart className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">قائمة المفضلة فارغة</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    لم تقم بحفظ أي كورسات بعد. استكشف مكتبة الكورسات وابدأ رحلة التعلم!
                                </p>
                            </div>
                            <Link href="/explore">
                                <Button size="lg" className="rounded-full px-8 gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    تصفح الكورسات
                                </Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {savedCourses.map((course, index) => (
                                <div key={course.id} className="relative group">
                                    <Link href={`/courses/${course.id}`}>
                                        <CourseCard
                                            title={course.titleAr || course.title}
                                            category={course.category}
                                            rating={course.rating}
                                            duration={course.duration}
                                            image={course.thumbnailUrl || course.thumbnail}
                                            delay={index * 0.1}
                                        />
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            removeFromWishlist(course.id);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
