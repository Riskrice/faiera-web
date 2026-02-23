import { getCourseById, Course as ApiCourse } from '@/lib/api';
import { Course as UICourse } from '@/data/courses';
import { CourseHero } from '@/components/course/course-hero';
import { EnrollmentCard } from '@/components/course/enrollment-card';
import { CurriculumList } from '@/components/course/curriculum-list';
import { Navbar, Footer } from '@/components/layout';
import { notFound } from 'next/navigation';
import { CheckCircle2, UserCheck, PlayCircle } from 'lucide-react';
import Image from 'next/image';

import { cookies } from 'next/headers';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params }: PageProps) {
    const { slug } = await params;

    // Extract the token to authenticate the server-side request
    // We use headers as a fallback because Next.js Turbopack sometimes drops cookies() parsing for dynamic routes
    const { headers: nextHeaders, cookies } = await import('next/headers');
    const cookieStore = await cookies();
    let token = cookieStore.get('faiera_session')?.value;

    if (!token) {
        const headersList = await nextHeaders();
        const cookieHeader = headersList.get('cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)faiera_session=([^;]*)/);
        if (match?.[1]) {
            token = match[1];
        }
    }

    let apiCourse: ApiCourse | undefined;

    let debugError = '';
    try {
        const res = await getCourseById(slug, token);
        apiCourse = res.data;
    } catch (error: any) {
        debugError = error?.message || 'Unknown error';
    }

    if (!apiCourse) {
        return (
            <div style={{ padding: '50px', color: 'black', backgroundColor: '#f0f0f0', borderRadius: '8px', margin: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Debug Info</h1>
                <p><strong>Token Present:</strong> {token ? 'YES (' + token.substring(0, 15) + '...)' : 'NO'}</p>
                <p><strong>Error:</strong> {debugError}</p>
            </div>
        );
    }

    // Map API course to UI course
    const course: UICourse = {
        id: apiCourse.id,
        title: apiCourse.titleAr || apiCourse.titleEn,
        description: apiCourse.descriptionAr || apiCourse.descriptionEn || '',
        longDescription: apiCourse.descriptionAr || apiCourse.descriptionEn || '',
        thumbnail: apiCourse.thumbnailUrl || 'https://placehold.co/600x400/png?text=Faiera+Course',
        videoTrailer: '',
        author: {
            id: (apiCourse as any).teacher?.id || (apiCourse as any).createdBy || 'unknown',
            name: (apiCourse as any).teacher?.user
                ? `${(apiCourse as any).teacher.user.firstName} ${(apiCourse as any).teacher.user.lastName}`
                : 'Faiera Instructor',
            avatar: (apiCourse as any).teacher?.user?.metadata?.avatar || '/avatars/01.png',
            role: 'Instructor'
        },
        price: Number(apiCourse.price) || 0,
        currency: apiCourse.currency || 'EGP',
        rating: apiCourse.rating || 0,
        reviewsCount: 0,
        students: 0,
        level: (apiCourse.level as any) || '3rd Secondary',
        category: apiCourse.category || 'General',
        tags: [],
        duration: apiCourse.totalDurationMinutes ? `${(apiCourse.totalDurationMinutes / 60).toFixed(1)} hours` : '0 hours',
        lessonsCount: apiCourse.lessonsCount || 0,
        curriculum: apiCourse.modules?.map(module => ({
            id: module.id,
            title: module.titleAr || module.titleEn,
            duration: `${module.lessons?.reduce((acc, l) => acc + (l.durationMinutes || 0), 0) || 0} دقيقة`,
            lessons: module.lessons?.map(lesson => ({
                id: lesson.id,
                title: lesson.titleAr || lesson.titleEn,
                duration: `${lesson.durationMinutes || 0} دقيقة`,
                type: (lesson.type === 'video' || lesson.type === 'live_session') ? 'video' : 'quiz', // Simplified mapping
                isFree: lesson.isFree
            })) || []
        })) || [],
        features: []
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* 1. Hero Section */}
            <CourseHero course={course} />

            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12 relative">

                    {/* 2. Main Content Column */}
                    <div className="flex-1 space-y-12">

                        {/* What you'll learn */}
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <h3 className="text-2xl font-bold font-cairo text-foreground mb-6">ماذا ستتعلم في هذا الكورس؟</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    'فهم كامل لأساسيات ونظريات المادة العلمية',
                                    'حل أكثر من 500 سؤال من امتحانات سابقة',
                                    'تعلم استراتيجيات الحل الذكي والسريع',
                                    'الحصول على ملخصات وخرائط ذهنية للمراجعة',
                                    'تطبيق عملي على كل وحدة دراسية',
                                    'متابعة دورية وتقييم مستمر لمستواك'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Curriculum */}
                        <CurriculumList course={course} />

                        {/* Instructor Bio (Expanded) */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold font-cairo text-foreground">عن المحاضر</h3>
                            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-primary/10">
                                    <Image src={course.author.avatar} alt={course.author.name} fill className="object-cover" unoptimized />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-foreground mb-1">{course.author.name}</h4>
                                        <p className="text-primary text-sm font-medium">{course.author.role}</p>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        يتميز الأستاذ {course.author.name} بخبرة طويلة في تدريس المادة وتخريج أوائل الجمهورية. يعتمد في شرحه على تبسيط المعلومة وربطها بالواقع، مما يجعل الدراسة ممتعة وفعالة.
                                    </p>
                                    <div className="flex items-center gap-6 pt-4 text-sm font-bold text-foreground">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-emerald-500" />
                                            <span>{course.rating} تقييم المحاضر</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PlayCircle className="w-4 h-4 text-emerald-500" />
                                            <span>{course.lessonsCount} درس</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* 3. Sticky Sidebar Column */}
                    <div className="lg:w-[380px] shrink-0 relative">
                        {/* We put a negative margin top to pull it up over the Hero section ONLY on desktop */}
                        <div className="lg:-mt-[400px]">
                            <EnrollmentCard course={course} />
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </main>
    );
}
