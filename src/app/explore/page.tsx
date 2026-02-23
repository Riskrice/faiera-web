'use client';

import { Suspense, useMemo } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { CourseCard } from '@/components/ui/course-card';
import { SearchHeader } from '@/components/explore/search-header';
import { FilterSidebar } from '@/components/explore/filter-sidebar';
import { ActiveFilters } from '@/components/explore/active-filters';
import { useSearchParams } from 'next/navigation';
import { getCourses, Course } from '@/lib/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ExploreContent() {
    const searchParams = useSearchParams();
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchCourses() {
            setLoading(true);
            try {
                const query = searchParams.get('q') || '';
                const category = searchParams.get('category') || '';
                const level = searchParams.get('level') || '';
                const teacherId = searchParams.get('teacherId') || undefined;

                // Construct API params
                // Backend might expect single string or handle comma separation if we implemented partial matching?
                // For simplicity, passing values directly. If multiple cats, API logic needs to support it. 
                // Our current generic findAllCourses uses simple equality for category/level.
                // If frontend sends comma separated, it won't match "math,physics".
                // Assuming single selection or backend update needed for multiselect.
                // For now, passing straight through.

                const res = await getCourses({
                    search: query,
                    category: category,
                    teacherId: teacherId,
                    // level support if needed
                });

                // Since our backend findAllCourses is simple, it filters by exact matches.
                // Frontend might need to do clientside filtering if backend is limited?
                // Let's rely on backend returning results.

                setFilteredCourses(res.data);
            } catch (err) {
                console.error(err);
                setFilteredCourses([]);
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, [searchParams]);

    // Removed client-side filtering logic as we now fetch

    return (
        <>
            <div className="container mx-auto px-6 pt-8 pb-4">
                <SearchHeader />
            </div>

            <div className="flex-1 container mx-auto px-6 pb-20">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <FilterSidebar />
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <ActiveFilters />

                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold font-cairo text-foreground">
                                {filteredCourses.length} نتيجة بحث
                            </h2>
                        </div>

                        {/* Course Grid */}
                        {filteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredCourses.map((course, index) => (
                                        <motion.div
                                            key={course.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className="h-full"
                                        >
                                            <CourseCard
                                                title={course.titleAr || course.titleEn}
                                                category={course.category || 'General'}
                                                rating={course.rating || 0}
                                                duration={`${course.lessonsCount || 0} درس`}
                                                image={course.thumbnailUrl || '/placeholder.jpg'}
                                                delay={0}
                                                courseId={course.id}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold mb-2 font-cairo">لا توجد نتائج مطابقة</h3>
                                <p className="text-muted-foreground">جرب تغيير كلمات البحث أو إزالة بعض الفلاتر.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function ExplorePage() {
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col pt-20">
            <Navbar />
            <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}>
                <ExploreContent />
            </Suspense>
            <Footer />
        </main>
    );
}
