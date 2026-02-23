import { getCourseById, Course, Module as CourseModule, Lesson } from '@/lib/api';
import { VideoPlayer } from '@/components/player/video-player';
import { QuizPlayer } from '@/components/player/quiz-player';
import { PlaylistSidebar } from '@/components/player/playlist-sidebar';
import { LessonTabs } from '@/components/player/lesson-tabs';
import { Navbar } from '@/components/layout';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ lessonId?: string }>;
}

export default async function LearnPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { lessonId } = await searchParams;

    // Fetch course from API instead of static mock data
    let apiCourse: Course;
    try {
        const res = await getCourseById(slug);
        apiCourse = res.data;
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
        })),
    }));

    // Find the requested lesson or default to the first one
    let activeLesson = curriculum[0]?.lessons?.[0];

    if (lessonId) {
        for (const chapter of curriculum) {
            const found = chapter.lessons.find((l: any) => l.id === lessonId);
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

    // Build compatible course object for PlaylistSidebar and LessonTabs
    const course = {
        ...apiCourse,
        curriculum,
    } as any;

    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Slim Header for Learn Mode */}
            <header className="h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 flex items-center px-6 sticky top-0 z-50">
                <Link href={`/courses/${slug}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                    <span>عودة للرئيسية</span>
                </Link>
                <div className="mr-6 border-r border-border pr-6 h-8 flex items-center">
                    <h1 className="font-bold text-foreground text-sm md:text-base truncate max-w-md">{courseTitle}</h1>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
                {/* Main Content (Video + Tabs OR Quiz) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                    <div className="max-w-5xl mx-auto p-6 space-y-8 h-full">
                        {isQuiz ? (
                            <QuizPlayer
                                assessmentId={activeLesson.id}
                                title={activeLesson.title}
                            />
                        ) : (
                            <>
                                {/* Video Player Box */}
                                <div className="space-y-4">
                                    <VideoPlayer title={activeLesson.title} lessonId={activeLesson.id} />

                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl md:text-2xl font-bold text-foreground font-cairo">{activeLesson.title}</h2>
                                        <button className="text-sm text-primary hover:underline">الإبلاغ عن مشكلة</button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <LessonTabs lesson={activeLesson} course={course} />
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar (Desktop) */}
                <aside className="w-[350px] hidden lg:block border-r border-border shrink-0">
                    <PlaylistSidebar course={course} currentLessonId={activeLesson.id} />
                </aside>
            </div>
        </main>
    );
}
