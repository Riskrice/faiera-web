import { getCourseById, Course, Module as CourseModule, Lesson } from '@/lib/api';
import { getCourseProgress } from '@/lib/progress';
import { VideoPlayer } from '@/components/player/video-player';
import { QuizPlayer } from '@/components/player/quiz-player';
import { PlaylistSidebar } from '@/components/player/playlist-sidebar';
import { LessonTabs } from '@/components/player/lesson-tabs';
import { MobilePlaylistDrawer } from '@/components/player/mobile-playlist-drawer';
import { notFound } from 'next/navigation';
import { ChevronRight, Flag } from 'lucide-react';
import Link from 'next/link';

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

type LearnLesson = {
    id: string;
    title: string;
    duration: string;
    type: string;
    isFree: boolean;
    articleContent?: string;
    assessmentId?: string;
    attachments?: Array<{ id: string; name: string; url: string; size?: string }>;
};

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ lessonId?: string }>;
}

export default async function LearnPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { lessonId } = await searchParams;


    // Fetch course and progress from API
    let apiCourse: Course;
    let progressData: { totalLessons: number; completedLessons: number; overallProgress: number } = { totalLessons: 0, completedLessons: 0, overallProgress: 0 };
    try {
        const [courseRes, progressRes] = await Promise.all([
            getCourseById(slug),
            getCourseProgress(slug)
        ]);
        apiCourse = courseRes.data;
        progressData = progressRes.data || progressData;
    } catch (error) {
        notFound();
        return;
    }

    if (!apiCourse) notFound();

    // Build curriculum structure from API modules/lessons
    const curriculum = (apiCourse.modules || []).map((mod: CourseModule) => ({
        id: mod.id,
        title: mod.titleAr || mod.titleEn,
        lessons: (mod.lessons || []).map((lesson: Lesson) => ({
            id: lesson.id,
            title: lesson.titleAr || lesson.titleEn,
            duration: `${lesson.durationMinutes || 0} دقيقة`,
            type: (lesson.type as any) || 'video',
            isFree: lesson.isFree,
            articleContent: (lesson as any).contentAr || (lesson as any).contentEn || '',
            assessmentId: (lesson as any).assessmentId,
            attachments: Array.isArray((lesson as any).attachments)
                ? (lesson as any).attachments.map((attachment: any, index: number) => ({
                    id: attachment?.id || `${lesson.id}-att-${index}`,
                    name: attachment?.name || 'مرفق',
                    url: attachment?.url || '',
                    size: attachment?.size,
                })).filter((attachment: any) => !!attachment.url)
                : [],
        })),
    }));

    // Find the requested lesson or default to the first one
    let activeLesson: LearnLesson | undefined = curriculum[0]?.lessons?.[0] as LearnLesson | undefined;

    if (lessonId) {
        for (const chapter of curriculum) {
            const found = chapter.lessons.find((l: any) => l.id === lessonId) as LearnLesson | undefined;
            if (found) {
                activeLesson = found;
                break;
            }
        }
    }

    if (!activeLesson) {
        return <div className="p-8 text-center text-white">عفوا، لا يوجد محتوى لهذا الكورس حالياً.</div>;
    }

    const courseTitle = apiCourse.titleAr || apiCourse.titleEn;
    const isQuiz = activeLesson.type === 'quiz';
    const isArticle = activeLesson.type === 'article';

    const instructorName = (apiCourse as any).teacher?.user
        ? `${(apiCourse as any).teacher.user.firstName || ''} ${(apiCourse as any).teacher.user.lastName || ''}`.trim()
        : 'Faiera Instructor';

    const instructorAvatarRaw =
        (apiCourse as any).teacher?.user?.metadata?.avatar ||
        (apiCourse as any).teacher?.user?.metadata?.avatarUrl ||
        (apiCourse as any).teacher?.user?.metadata?.avatar_url ||
        (apiCourse as any).teacher?.user?.metadata?.picture ||
        (apiCourse as any).teacher?.user?.avatarUrl ||
        '';

    const instructorAvatar = await resolveInstructorAvatarUrl(instructorAvatarRaw, instructorName);

    // Build compatible course object for PlaylistSidebar and LessonTabs
    const course = {
        ...apiCourse,
        curriculum,
        author: {
            id: (apiCourse as any).teacher?.id || (apiCourse as any).createdBy || 'unknown',
            name: instructorName || 'Faiera Instructor',
            avatar: instructorAvatar,
            role: 'Instructor',
        },
    } as any;

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Slim Header for Learn Mode */}
            <header className="h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center px-4 md:px-6 sticky top-0 z-50">
                <Link href={`/courses/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                    <span className="hidden sm:inline">عودة للرئيسية</span>
                </Link>
                <div className="mr-3 md:mr-6 border-r border-border pr-3 md:pr-6 h-8 flex items-center min-w-0 flex-1">
                    <h1 className="font-bold text-foreground text-sm md:text-base truncate max-w-full md:max-w-md">{courseTitle}</h1>
                </div>
                <MobilePlaylistDrawer course={course} currentLessonId={activeLesson.id} />
            </header>

            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
                {/* Main Content (Video + Tabs OR Quiz) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 h-full">
                        {isQuiz ? (
                            <QuizPlayer
                                assessmentId={activeLesson.assessmentId || activeLesson.id}
                                title={activeLesson.title}
                            />
                        ) : isArticle ? (
                            <>
                                <div className="space-y-4 rounded-2xl border border-border bg-card p-5 md:p-8">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h2 className="text-lg md:text-2xl font-bold text-foreground font-cairo leading-8">{activeLesson.title}</h2>
                                        <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline self-start sm:self-auto">
                                            <Flag className="w-4 h-4" />
                                            الإبلاغ عن مشكلة
                                        </button>
                                    </div>
                                    <div className="prose prose-sm md:prose-base max-w-none text-foreground/90 leading-8 whitespace-pre-wrap font-cairo">
                                        {activeLesson.articleContent || 'لا يوجد محتوى مكتوب متاح لهذا المقال حالياً.'}
                                    </div>
                                </div>

                                <LessonTabs lesson={activeLesson as any} course={course} />
                            </>
                        ) : (
                            <>
                                {/* Video Player Box */}
                                <div className="space-y-4">
                                    <VideoPlayer title={activeLesson.title} lessonId={activeLesson.id} />

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h2 className="text-lg md:text-2xl font-bold text-foreground font-cairo leading-8">{activeLesson.title}</h2>
                                        <button className="inline-flex items-center gap-2 text-sm text-primary hover:underline self-start sm:self-auto">
                                            <Flag className="w-4 h-4" />
                                            الإبلاغ عن مشكلة
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <LessonTabs lesson={activeLesson as any} course={course} />
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar (Desktop) */}
                <aside className="w-[350px] hidden lg:block border-r border-border shrink-0">
                    <PlaylistSidebar
                        course={course}
                        currentLessonId={activeLesson.id}
                        progress={Math.round(progressData.overallProgress)}
                        completedLessons={progressData.completedLessons}
                        totalLessons={progressData.totalLessons}
                    />
                </aside>
            </div>
        </main>
    );
}
