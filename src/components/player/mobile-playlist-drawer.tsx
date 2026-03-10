'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListVideo, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaylistSidebar } from '@/components/player/playlist-sidebar';
import { Course } from '@/data/courses';

interface MobilePlaylistDrawerProps {
    course: Course;
    currentLessonId: string;
}

export function MobilePlaylistDrawer({ course, currentLessonId }: MobilePlaylistDrawerProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                className="lg:hidden h-10 rounded-full border-border bg-background/90 px-4 text-sm"
                onClick={() => setOpen(true)}
            >
                <ListVideo className="w-4 h-4 ml-2" />
                الدروس
            </Button>

            <AnimatePresence>
                {open ? (
                    <>
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[70] bg-black/45 lg:hidden"
                            onClick={() => setOpen(false)}
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.28, ease: 'easeOut' }}
                            className="fixed inset-x-0 bottom-0 z-[71] h-[78vh] rounded-t-[24px] border border-border bg-background shadow-2xl lg:hidden overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-primary">التنقل داخل الكورس</p>
                                    <h3 className="font-cairo text-lg font-bold text-foreground">قائمة الدروس</h3>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="h-[calc(100%-4.5rem)] overflow-hidden">
                                <PlaylistSidebar course={course} currentLessonId={currentLessonId} />
                            </div>
                        </motion.div>
                    </>
                ) : null}
            </AnimatePresence>
        </>
    );
}