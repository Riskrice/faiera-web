'use client';

import { Suspense } from 'react';
import { Navbar, Footer } from '@/components/layout';
import { CourseCard } from '@/components/ui/course-card';
import { Button } from '@/components/ui/button';
import { SearchHeader } from '@/components/explore/search-header';
import { FilterSidebar } from '@/components/explore/filter-sidebar';
import { ActiveFilters } from '@/components/explore/active-filters';
import { useSearchParams } from 'next/navigation';
import { getCourses, Course } from '@/lib/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, COURSES as demoCourses } from '@/data/courses';
import { isDemoContentEnabled } from '@/lib/demo-content';

const categoryLabelMap = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

const getCategoryLabel = (category?: string) => {
    if (!category) {
        return 'عام';
    }

    return categoryLabelMap[category] || category;
};

const demoApiCourses: Course[] = demoCourses.map((course) => ({
    id: `demo-${course.id}`,
    titleAr: course.title,
    titleEn: course.title,
    descriptionAr: course.description,
    descriptionEn: course.description,
    thumbnailUrl: course.thumbnail,
    status: 'PUBLISHED',
    rating: course.rating,
    price: course.price,
    currency: course.currency,
    lessonsCount: course.lessonsCount,
    totalDurationMinutes: undefined,
    category: course.category,
    level: course.level,
}));

function filterDemoCourses(query: string, category: string, level: string) {
    const normalizedQuery = query.trim().toLowerCase();

    return demoApiCourses.filter((course) => {
        const title = `${course.titleAr || ''} ${course.titleEn || ''}`.toLowerCase();
        const description = `${course.descriptionAr || ''} ${course.descriptionEn || ''}`.toLowerCase();
        const categoryLabel = getCategoryLabel(course.category).toLowerCase();

        const matchesQuery = !normalizedQuery
            || title.includes(normalizedQuery)
            || description.includes(normalizedQuery)
            || categoryLabel.includes(normalizedQuery);
        const matchesCategory = !category || course.category === category;
        const matchesLevel = !level || course.level === level;

        return matchesQuery && matchesCategory && matchesLevel;
    });
}

function enrichCourses(courses: Course[], fallbackCourses: Course[]) {
    if (courses.length === 0) {
        return fallbackCourses;
    }

    const normalizedCourses = courses.map((course, index) => {
        const fallback = fallbackCourses.find((candidate) => candidate.category === course.category)
            || fallbackCourses[index % Math.max(fallbackCourses.length, 1)];

        return {
            ...course,
            titleAr: course.titleAr || fallback?.titleAr,
            titleEn: course.titleEn || fallback?.titleEn,
            descriptionAr: course.descriptionAr || fallback?.descriptionAr,
            descriptionEn: course.descriptionEn || fallback?.descriptionEn,
            thumbnailUrl: course.thumbnailUrl || fallback?.thumbnailUrl,
            rating: course.rating ?? fallback?.rating ?? 0,
            lessonsCount: course.lessonsCount ?? fallback?.lessonsCount ?? 0,
            category: course.category || fallback?.category,
            level: course.level || fallback?.level,
        };
    });

    const existingIds = new Set(normalizedCourses.map((course) => course.id));
    const missingCourses = fallbackCourses.filter((course) => !existingIds.has(course.id));

    return [...normalizedCourses, ...missingCourses].slice(0, 12);
}

function ExploreContent() {
    const searchParams = useSearchParams();
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    useEffect(() => {
        async function fetchCourses() {
            setLoading(true);
            try {
                const query = searchParams.get('q') || '';
                const category = searchParams.get('category') || '';
                const level = searchParams.get('level') || '';
                const teacherId = searchParams.get('teacherId') || undefined;
                const fallbackCourses = isDemoContentEnabled ? filterDemoCourses(query, category, level) : [];

                const res = await getCourses({
                    search: query,
                    category: category,
                    teacherId: teacherId,
                });

                setFilteredCourses(
                    isDemoContentEnabled
                        ? enrichCourses(res.data || [], fallbackCourses)
                        : (res.data || [])
                );
            } catch (err) {
                console.error(err);
                const query = searchParams.get('q') || '';
                const category = searchParams.get('category') || '';
                const level = searchParams.get('level') || '';
                setFilteredCourses(isDemoContentEnabled ? filterDemoCourses(query, category, level) : []);
            } finally {
                setLoading(false);
            }
        }

        fetchCourses();
    }, [searchParams]);

    // Removed client-side filtering logic as we now fetch

    return (
        <>
            <div className="border-b border-border/60 bg-background/92 backdrop-blur-xl">
                <div className="container mx-auto px-4 md:px-6 pt-2.5 md:pt-5 pb-3 md:pb-5">
                    <div className="md:mx-auto md:max-w-3xl xl:max-w-4xl">
                        <SearchHeader />
                    </div>

                    <div className="lg:hidden flex items-center justify-between gap-3 pt-1">
                        <div className="text-right">
                            <p className="text-xs font-bold text-primary">نتائج الاستكشاف</p>
                            <h2 className="font-cairo text-lg font-bold text-foreground">{filteredCourses.length} نتيجة بحث</h2>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-full gap-2 border-border bg-background/80 px-4 shrink-0"
                            onClick={() => setIsMobileFiltersOpen(true)}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>الفلاتر</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 container mx-auto px-4 md:px-6 pt-5 md:pt-8 pb-14 md:pb-20">
                <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:items-start lg:gap-10">
                    {/* Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-[270px] xl:w-[280px] flex-shrink-0">
                        <FilterSidebar className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto rounded-[28px] border border-border/70 bg-card/80 p-5 pb-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm scrollbar-hide" />
                    </aside>

                    {/* Main Content */}
                    <div className="w-full flex-1 min-w-0">
                        <ActiveFilters />

                        <div className="mb-7 hidden lg:flex items-center justify-between border-b border-border/60 pb-4">
                            <h2 className="text-2xl font-bold font-cairo text-foreground">
                                {filteredCourses.length} نتيجة بحث
                            </h2>
                            <p className="text-sm text-muted-foreground">اختيارات مرتبة حسب المادة والصف</p>
                        </div>

                        {/* Course Grid */}
                        {filteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 justify-items-stretch md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-7">
                                {filteredCourses.map((course, index) => (
                                    <div key={course.id} className="h-full w-full flex justify-center md:block">
                                        <CourseCard
                                            title={course.titleAr || course.titleEn}
                                            category={getCategoryLabel(course.category)}
                                            rating={course.rating || 0}
                                            duration={`${course.lessonsCount || 0} درس`}
                                            image={course.thumbnailUrl || '/placeholder.jpg'}
                                            delay={index * 0.05}
                                            courseId={course.id}
                                            className="w-full max-w-none sm:max-w-[360px] md:max-w-none md:w-[280px] lg:w-[300px] h-[360px] sm:h-[400px] md:h-[360px] lg:h-[380px]"
                                        />
                                    </div>
                                ))}
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

            <AnimatePresence>
                {isMobileFiltersOpen && (
                    <>
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[70] bg-black/35 lg:hidden"
                            onClick={() => setIsMobileFiltersOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                            className="fixed inset-x-0 bottom-0 z-[71] max-h-[82vh] overflow-y-auto rounded-t-[28px] border border-border bg-background p-5 shadow-2xl lg:hidden"
                        >
                            <div className="mb-5 flex items-center justify-between">
                                <button
                                    onClick={() => setIsMobileFiltersOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-primary">تخصيص النتائج</div>
                                    <h3 className="font-cairo text-xl font-bold text-foreground">الفلاتر</h3>
                                </div>
                            </div>

                            <FilterSidebar />

                            <Button className="mt-6 w-full rounded-full" onClick={() => setIsMobileFiltersOpen(false)}>
                                عرض النتائج
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
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
