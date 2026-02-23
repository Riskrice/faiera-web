'use client';

import { motion } from 'framer-motion';
import { PlayCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface StudentCourseCardProps {
    id: string;
    title: string;
    thumbnail: string;
    progress: number; // 0 to 100
    lastLesson: string;
    totalLessons: number;
    completedLessons: number;
}

export function StudentCourseCard({
    id,
    title,
    thumbnail,
    progress,
    lastLesson,
    totalLessons,
    completedLessons
}: StudentCourseCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="relative h-40 w-full overflow-hidden">
                <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/courses/${id}/learn`}>
                        <div className="bg-primary/90 text-primary-foreground p-3 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                            <PlayCircle className="w-8 h-8 fill-current" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-bold font-cairo text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                <div className="flex items-center text-xs text-muted-foreground mb-4 font-sans">
                    <Clock className="w-3 h-3 mr-1 ml-1" />
                    <span>آخر درس: {lastLesson}</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">التقدم</span>
                        <span>{progress}% ({completedLessons}/{totalLessons})</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Button className="w-full font-cairo font-bold group-hover:translate-x-1 transition-transform" asChild>
                        <Link href={`/courses/${id}/learn`}>
                            {progress > 0 ? 'أكمل المذاكرة' : 'ابدأ الكورس'}
                        </Link>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
