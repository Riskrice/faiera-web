'use client';

import { useState } from 'react';
import { Course, Chapter, Lesson } from '@/data/courses';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle, Lock, FileText, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SecurePlayer } from '@/components/video/secure-player';

interface CurriculumListProps {
    course: Course;
}

export function CurriculumList({ course }: CurriculumListProps) {
    const chapters = course.curriculum || [];
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    const handlePlayLesson = (lesson: Lesson) => {
        if (!lesson.isFree || lesson.type !== 'video') return;
        setSelectedLesson(lesson);
    };

    if (chapters.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-muted-foreground">محتوى المنهج سيتم إضافته قريباً.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold font-cairo text-foreground">محتوى الكورس</h3>
                    <div className="text-sm text-muted-foreground flex gap-4">
                        <span>{course.curriculum?.length || 0} أبواب</span>
                        <span>•</span>
                        <span>{course.lessonsCount} درس</span>
                        <span>•</span>
                        <span>{course.duration} إجمالي</span>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <Accordion type="single" collapsible className="w-full" defaultValue={chapters[0]?.id}>
                        {chapters.map((chapter) => (
                            <AccordionItem key={chapter.id} value={chapter.id} className="border-border/50 px-2">
                                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 rounded-lg transition-colors group">
                                    <div className="flex flex-col items-start gap-1 w-full text-right">
                                        <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors font-cairo">
                                            {chapter.title}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                                            <span>{chapter.lessons.length} دروس</span>
                                            <span>•</span>
                                            <span>{chapter.duration}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4 px-2">
                                    <div className="space-y-1">
                                        {chapter.lessons.map((lesson) => (
                                            <div
                                                key={lesson.id}
                                                onClick={() => handlePlayLesson(lesson)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                                                    lesson.isFree ? "bg-primary/5 hover:bg-primary/10 cursor-pointer group/lesson" : "hover:bg-muted/50 opacity-80"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                        lesson.isFree ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {lesson.type === 'video' ? <PlayCircle className="w-4 h-4 fill-current icon-filled" /> :
                                                            lesson.type === 'quiz' ? <HelpCircle className="w-4 h-4" /> :
                                                                <FileText className="w-4 h-4" />}
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-medium truncate font-cairo",
                                                        lesson.isFree ? "text-foreground group-hover/lesson:text-primary" : "text-muted-foreground"
                                                    )}>
                                                        {lesson.title}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    {lesson.isFree && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                                                            مجاني
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-300 transition-colors min-w-[60px] justify-end">
                                                        {lesson.type === 'video' && lesson.isFree && <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-primary mr-2">تشغيل <PlayCircle className="w-3 h-3" /></span>}
                                                        <span>{lesson.duration}</span>
                                                        {!lesson.isFree && <Lock className="w-3.5 h-3.5 ml-1 text-gray-500 group-hover:text-gray-400 transition-colors" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div >

            <Dialog open={!!selectedLesson} onOpenChange={(open) => {
                if (!open) {
                    setSelectedLesson(null);
                }
            }}>
                <DialogContent className="sm:max-w-4xl bg-black border-white/10 p-0 overflow-hidden">
                    <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                        <DialogTitle className="text-white text-lg font-cairo pointer-events-auto">
                            {selectedLesson?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video w-full bg-black flex items-center justify-center">
                        {selectedLesson && (
                            <SecurePlayer
                                lessonId={selectedLesson.id}
                                autoPlay
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
