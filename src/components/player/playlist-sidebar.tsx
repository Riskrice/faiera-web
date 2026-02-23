'use client';

import { Course, Chapter, Lesson } from '@/data/courses';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { CheckCircle2, PlayCircle, Lock, Circle } from 'lucide-react';

interface PlaylistSidebarProps {
    course: Course;
    currentLessonId: string;
}

export function PlaylistSidebar({ course, currentLessonId }: PlaylistSidebarProps) {
    const chapters = course.curriculum || [];

    // Find chapter containing current lesson to open it by default
    const activeChapter = chapters.find(ch => ch.lessons.some(l => l.id === currentLessonId))?.id || chapters[0]?.id;

    return (
        <div className="bg-card border-l border-border h-full flex flex-col w-full">
            <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
                <h3 className="font-bold text-foreground font-cairo">محتوى الكورس</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>{course.lessonsCount} درس</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        12% مكتمل
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="w-[12%] h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <Accordion type="single" collapsible defaultValue={activeChapter} className="space-y-2">
                    {chapters.map((chapter) => (
                        <AccordionItem key={chapter.id} value={chapter.id} className="border-none">
                            <AccordionTrigger className="px-3 py-2 bg-muted/30 data-[state=open]:bg-muted/50 rounded-lg hover:bg-muted/50 transition-colors text-sm font-bold text-foreground">
                                <div className="flex-1 text-right truncate pl-2">{chapter.title}</div>
                                <span className="text-xs font-normal text-muted-foreground ml-2 px-2 py-0.5 bg-background rounded-full border border-border">{chapter.lessons.length}</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2">
                                <div className="space-y-1 mt-1">
                                    {chapter.lessons.map((lesson) => {
                                        const isActive = lesson.id === currentLessonId;
                                        const isLocked = !lesson.isFree && !isActive && false; // Disable locking for testing

                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/courses/${course.id}/learn?lessonId=${lesson.id}`}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-md transition-all cursor-pointer text-sm font-cairo border",
                                                    isActive
                                                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                                        : "hover:bg-muted/50 text-muted-foreground border-transparent hover:text-foreground"
                                                )}
                                            >
                                                {isActive ? (
                                                    <PlayCircle className="w-4 h-4 shrink-0 fill-current animate-pulse" />
                                                ) : isLocked ? (
                                                    <Lock className="w-4 h-4 shrink-0 opacity-50" />
                                                ) : lesson.type === 'quiz' ? (
                                                    <Circle className="w-4 h-4 shrink-0 text-emerald-500/50" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500/50" />
                                                )}

                                                <div className="flex-1 truncate">
                                                    {lesson.title}
                                                </div>

                                                <span className="text-[10px] opacity-50 font-mono">
                                                    {lesson.duration.replace(' دقيقة', 'm')}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
