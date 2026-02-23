'use client';

import { Course } from '@/data/courses';
import { motion } from 'framer-motion';
import { Star, Clock, Users, PlayCircle, BarChart, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseHeroProps {
    course: Course;
}

export function CourseHero({ course }: CourseHeroProps) {
    return (
        <section className="relative w-full min-h-[500px] flex items-center pt-24 pb-12 overflow-hidden bg-background">
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

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left: Content */}
                    <div className="flex-1 space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-4">
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
                                className="text-4xl lg:text-5xl font-black font-cairo leading-tight text-foreground"
                            >
                                {course.title}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-muted-foreground leading-relaxed max-w-2xl"
                            >
                                {course.longDescription || course.description}
                            </motion.p>
                        </div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap items-center gap-6 text-sm text-foreground/80"
                        >
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-yellow-500">{course.rating}</span>
                                <span className="text-muted-foreground">({course.reviewsCount || 100} تقييم)</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span>{course.students.toLocaleString()} طالب</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <span>آخر تحديث: يناير 2026</span>
                            </div>
                        </motion.div>

                        {/* Author Mini Profile */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 pt-4 border-t border-white/10 mt-2"
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                                <Image src={course.author.avatar} alt={course.author.name} fill className="object-cover" unoptimized />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">مقدم الكورس</p>
                                <p className="font-bold text-foreground text-base">{course.author.name}</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Trailer Placeholder (Desktop only - Mobile has sticky bottom) */}
                    {/* We leave this space for the sticky Enrollment Card which will overlap slightly */}
                    <div className="hidden lg:block w-[400px]"></div>
                </div>
            </div>
        </section>
    );
}
