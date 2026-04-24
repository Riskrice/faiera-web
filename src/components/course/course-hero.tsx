'use client';

import { Course } from '@/data/courses';
import { motion } from 'framer-motion';
import { BarChart, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseHeroProps {
    course: Course;
    isDashboard?: boolean;
}

export function CourseHero({ course, isDashboard = false }: CourseHeroProps) {
    return (
        <section className="relative w-full min-h-[420px] md:min-h-[500px] lg:min-h-[560px] flex items-center pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden bg-background">
            {/* Background Blur Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover opacity-10 blur-xl"
                    priority
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="lg:pl-[420px] xl:pl-[450px]">
                    <div className="max-w-3xl space-y-5 md:space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-medium mb-3 md:mb-4">
                            <Link href="/explore" className="hover:text-primary transition-colors">تصفح الكورسات</Link>
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-foreground">{course.category}</span>
                        </div>

                        {/* Title & Badge */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider"
                            >
                                <BarChart className="w-3.5 h-3.5" />
                                {course.level === '3rd Secondary' ? 'الصف الثالث الثانوي' : course.level}
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-[2rem] md:text-4xl lg:text-[3.35rem] font-black font-cairo leading-[1.35] md:leading-tight text-foreground"
                            >
                                {course.title}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-[15px] md:text-lg text-muted-foreground leading-7 md:leading-relaxed max-w-2xl"
                            >
                                {course.longDescription || course.description}
                            </motion.p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
