import { getCourseById, Course as ApiCourse } from '@/lib/api';
import { Course as UICourse, COURSES as demoCourses } from '@/data/courses';
import { CourseHero } from '@/components/course/course-hero';
import { EnrollmentCard } from '@/components/course/enrollment-card';
import { CurriculumList } from '@/components/course/curriculum-list';
import { Navbar, Footer } from '@/components/layout';
import { CheckCircle2, UserCheck, PlayCircle, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';
import { isDemoContentEnabled } from '@/lib/demo-content';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.faiera.com/api/v1';
const API_ORIGIN = (() => {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return 'https://api.faiera.com';
    }
})();

function getGeneratedAvatar(name: string): string {
    const encoded = encodeURIComponent(name || 'Faiera Instructor');
    return `https://ui-avatars.com/api/?name=${encoded}&background=10b981&color=ffffff&size=256&bold=true`;
}

function normalizeAvatarUrl(raw?: string): string | null {
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `${API_ORIGIN}${raw}`;
    return null;
}

async function resolveInstructorAvatarUrl(rawAvatar: string | undefined, instructorName: string): Promise<string> {
    const normalized = normalizeAvatarUrl(rawAvatar);
    const fallback = getGeneratedAvatar(instructorName);

    if (!normalized) return fallback;

    try {
        const res = await fetch(normalized, { method: 'HEAD', cache: 'no-store' });
        return res.ok ? normalized : fallback;
    } catch {
        return fallback;
    }
}

export default async function CoursePage({ params }: PageProps) {
    const { slug } = await params;

    if (slug.startsWith('demo-')) {
        if (!isDemoContentEnabled) {
            notFound();
        }

        const demoCourseId = slug.replace('demo-', '');
        const demoCourse = demoCourses.find((course) => course.id === demoCourseId);

        if (!demoCourse) {
            notFound();
        }

        return (
            <main className="min-h-screen bg-background text-foreground">
                <Navbar />

                <CourseHero course={demoCourse} />

                <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
                    <div className="flex flex-col lg:flex-row-reverse gap-6 md:gap-12 relative items-start">
                        <div className="order-first lg:order-none lg:w-[380px] shrink-0 relative">
                            <div className="lg:-mt-[400px]">
                                <EnrollmentCard course={demoCourse} />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-8 md:space-y-12">
                            <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8">
                                <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground mb-5 md:mb-6">ماذا ستتعلم في هذا الكورس؟</h3>
                                <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                                    {[
                                        'فهم كامل لأساسيات ونظريات المادة العلمية',
                                        'حل أكثر من 500 سؤال من امتحانات سابقة',
                                        'تعلم استراتيجيات الحل الذكي والسريع',
                                        'الحصول على ملخصات وخرائط ذهنية للمراجعة',
                                        'تطبيق عملي على كل وحدة دراسية',
                                        'متابعة دورية وتقييم مستمر لمستواك'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 md:bg-transparent md:p-0">
                                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                                            <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <CurriculumList course={demoCourse} />

                            <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8 space-y-5 md:space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground">معلومات سريعة عن الكورس</h3>

                                <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <Avatar className="w-14 h-14 border-2 border-primary/20 shrink-0">
                                            <AvatarImage src={demoCourse.author.avatar} alt={demoCourse.author.name} className="object-cover" />
                                            <AvatarFallback className="text-sm font-bold">{demoCourse.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xs md:text-sm text-muted-foreground">مقدم الكورس</p>
                                            <p className="font-bold text-foreground text-sm md:text-base">{demoCourse.author.name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2.5 md:gap-3 w-full md:w-auto">
                                        <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border/70 text-sm text-foreground/80">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-bold text-yellow-500">{demoCourse.rating}</span>
                                            <span className="text-muted-foreground">({demoCourse.reviewsCount || 100})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground">عن المحاضر</h3>
                                <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8 flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start text-center md:text-right">
                                    <Avatar className="w-24 h-24 md:w-32 md:h-32 shrink-0 border-4 border-primary/10">
                                        <AvatarImage src={demoCourse.author.avatar} alt={demoCourse.author.name} className="object-cover" />
                                        <AvatarFallback className="text-2xl font-bold">{demoCourse.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h4 className="text-lg md:text-xl font-bold text-foreground mb-1">{demoCourse.author.name}</h4>
                                            <p className="text-primary text-sm font-medium">{demoCourse.author.role}</p>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed text-sm">
                                            يتميز الأستاذ {demoCourse.author.name} بخبرة طويلة في تدريس المادة وتخريج أوائل الجمهورية. يعتمد في شرحه على تبسيط المعلومة وربطها بالواقع، مما يجعل الدراسة ممتعة وفعالة.
                                        </p>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-3 sm:gap-6 pt-2 md:pt-4 text-sm font-bold text-foreground">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                                <span>{demoCourse.rating} تقييم المحاضر</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PlayCircle className="w-4 h-4 text-emerald-500" />
                                                <span>{demoCourse.lessonsCount} درس</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </main>
        );
    }

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

    try {
        const res = await getCourseById(slug, token);
        apiCourse = res.data;
    } catch {
        notFound();
    }

    if (!apiCourse) {
        notFound();
    }

    const instructorName = (apiCourse as any).teacher?.user
        ? `${(apiCourse as any).teacher.user.firstName} ${(apiCourse as any).teacher.user.lastName}`
        : 'Faiera Instructor';

    const rawAvatar =
        (apiCourse as any).teacher?.user?.metadata?.avatar ||
        (apiCourse as any).teacher?.user?.metadata?.avatarUrl ||
        (apiCourse as any).teacher?.user?.metadata?.avatar_url ||
        (apiCourse as any).teacher?.user?.metadata?.picture ||
        (apiCourse as any).teacher?.user?.avatarUrl;

    const resolvedAvatar = await resolveInstructorAvatarUrl(rawAvatar, instructorName);

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
            name: instructorName,
            avatar: resolvedAvatar,
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

            <div className="container mx-auto px-4 md:px-6 py-6 md:py-12">
                <div className="flex flex-col lg:flex-row-reverse gap-6 md:gap-12 relative items-start">

                    {/* 3. Sticky Sidebar Column */}
                    <div className="order-first lg:order-none lg:w-[380px] shrink-0 relative">
                        <div className="lg:-mt-[400px]">
                            <EnrollmentCard course={course} />
                        </div>
                    </div>

                    {/* 2. Main Content Column */}
                    <div className="flex-1 min-w-0 space-y-8 md:space-y-12">

                        {/* What you'll learn */}
                        <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8">
                            <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground mb-5 md:mb-6">ماذا ستتعلم في هذا الكورس؟</h3>
                            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                                {[
                                    'فهم كامل لأساسيات ونظريات المادة العلمية',
                                    'حل أكثر من 500 سؤال من امتحانات سابقة',
                                    'تعلم استراتيجيات الحل الذكي والسريع',
                                    'الحصول على ملخصات وخرائط ذهنية للمراجعة',
                                    'تطبيق عملي على كل وحدة دراسية',
                                    'متابعة دورية وتقييم مستمر لمستواك'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 md:bg-transparent md:p-0">
                                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground text-sm leading-relaxed">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Curriculum */}
                        <CurriculumList course={course} />

                        <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8 space-y-5 md:space-y-6">
                            <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground">معلومات سريعة عن الكورس</h3>

                            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <Avatar className="w-14 h-14 border-2 border-primary/20 shrink-0">
                                        <AvatarImage src={course.author.avatar} alt={course.author.name} className="object-cover" />
                                        <AvatarFallback className="text-sm font-bold">{course.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs md:text-sm text-muted-foreground">مقدم الكورس</p>
                                        <p className="font-bold text-foreground text-sm md:text-base">{course.author.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 md:gap-3 w-full md:w-auto">
                                    <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border/70 text-sm text-foreground/80">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold text-yellow-500">{course.rating}</span>
                                        <span className="text-muted-foreground">({course.reviewsCount || 100})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructor Bio (Expanded) */}
                        <div className="space-y-6">
                            <h3 className="text-xl md:text-2xl font-bold font-cairo text-foreground">عن المحاضر</h3>
                            <div className="bg-card border border-border rounded-[20px] md:rounded-2xl p-5 md:p-8 flex flex-col md:flex-row gap-5 md:gap-8 items-center md:items-start text-center md:text-right">
                                <Avatar className="w-24 h-24 md:w-32 md:h-32 shrink-0 border-4 border-primary/10">
                                    <AvatarImage src={course.author.avatar} alt={course.author.name} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold">{course.author.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h4 className="text-lg md:text-xl font-bold text-foreground mb-1">{course.author.name}</h4>
                                        <p className="text-primary text-sm font-medium">{course.author.role}</p>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        يتميز الأستاذ {course.author.name} بخبرة طويلة في تدريس المادة وتخريج أوائل الجمهورية. يعتمد في شرحه على تبسيط المعلومة وربطها بالواقع، مما يجعل الدراسة ممتعة وفعالة.
                                    </p>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-3 sm:gap-6 pt-2 md:pt-4 text-sm font-bold text-foreground">
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

                </div>
            </div>

            <Footer />
        </main>
    );
}
