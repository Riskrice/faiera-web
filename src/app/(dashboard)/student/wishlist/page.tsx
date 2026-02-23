'use client';

import { CourseCard } from '@/components/ui/course-card';
import { COURSES, Course } from '@/data/courses';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StudentWishlistPage() {
    const [savedCourses, setSavedCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
        window.addEventListener('storage', loadSavedCourses);
        return () => window.removeEventListener('storage', loadSavedCourses);
    }, []);

    const removeFromWishlist = (courseId: string) => {
        const currentSaved = JSON.parse(localStorage.getItem('faiera_saved_courses') || '[]');
        const newSaved = currentSaved.filter((id: string) => id !== courseId);
        localStorage.setItem('faiera_saved_courses', JSON.stringify(newSaved));
        setSavedCourses(prev => prev.filter(c => c.id !== courseId));
        toast.success('تم إزالة الكورس');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-cairo text-foreground">المحفوظات</h1>
                    <p className="text-muted-foreground">الكورسات التي قمت بحفظها للمشاهدة لاحقاً</p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-full h-[360px] bg-muted/20 animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : savedCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-card border border-border rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">قائمة المفضلة فارغة</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            لم تقم بحفظ أي كورسات بعد. استكشف مكتبة الكورسات.
                        </p>
                    </div>
                    <Link href="/explore">
                        <Button className="rounded-full gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            تصفح الكورسات
                        </Button>
                    </Link>
                </div>
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
    );
}
