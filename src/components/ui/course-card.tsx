'use client';

import { motion } from 'framer-motion';
import { Play, Star, Clock, GraduationCap, UserRound, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CourseCardProps {
    title: string;
    category: string;
    rating: number;
    duration: string;
    image: string;
    delay?: number;
    courseId?: string;
    level?: string;
    instructor?: string;
    priceLabel?: string;
    className?: string;
}

export function CourseCard({ title, category, rating, duration, image, delay = 0, courseId, level, instructor, priceLabel, className }: CourseCardProps) {
    const Wrapper = courseId ? Link : 'div';
    const wrapperProps = courseId
        ? { href: `/courses/${courseId}`, className: 'block w-full' }
        : { className: 'block w-full' };

    return (
        <Wrapper {...wrapperProps as any}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, duration: 0.5 }}
                className={cn(
                    "relative flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[300px] h-[340px] sm:h-[360px] lg:h-[380px] rounded-[20px] sm:rounded-[26px] overflow-hidden cursor-pointer group border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.14)] hover:shadow-[0_28px_80px_rgba(0,0,0,0.22)] hover:-translate-y-2 transition-all duration-300",
                    className,
                )}
            >
            {(image.startsWith('http') || image.startsWith('/')) ? (
                <Image
                    src={image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 260px, (max-width: 1024px) 280px, 300px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${image} transition-transform duration-700 group-hover:scale-110`} />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 opacity-95 group-hover:opacity-90 transition-opacity" />
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/45 to-transparent" />

            <div className="absolute top-3 right-3 left-3 sm:top-4 sm:right-4 sm:left-4 flex items-start justify-between gap-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-primary bg-black/45 backdrop-blur-md px-2.5 py-1.5 sm:px-3 rounded-full border border-white/10">
                    {category}
                </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex flex-col justify-end h-full transform transition-transform duration-300 group-hover:-translate-y-2 text-right">
                {level ? (
                    <div className="mb-2.5 sm:mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 sm:px-3 text-[10px] sm:text-[11px] font-medium text-white backdrop-blur-md border border-white/10">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                        <span>{level}</span>
                    </div>
                ) : null}

                <h3 className="text-[1.2rem] sm:text-[1.5rem] lg:text-[1.65rem] font-bold font-cairo text-white leading-snug mb-2.5 sm:mb-3 drop-shadow-md line-clamp-2">
                    {title}
                </h3>

                {instructor ? (
                    <div className="mb-2.5 sm:mb-3 flex items-center gap-2 text-[13px] sm:text-sm text-white/85 font-sans">
                        <UserRound className="w-4 h-4 text-primary/90" />
                        <span className="line-clamp-1">{instructor}</span>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-gray-100 text-[11px] sm:text-xs font-sans opacity-95 mb-2">
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>{rating}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                    </div>
                    {priceLabel ? (
                        <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                            <Wallet className="w-3 h-3 text-primary" />
                            <span>{priceLabel}</span>
                        </div>
                    ) : null}
                </div>

                <div className="h-11 opacity-100 md:h-0 md:opacity-0 md:group-hover:h-12 md:group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden w-full mt-3 md:mt-0 md:group-hover:mt-4 flex justify-center">
                    <button className="flex items-center gap-2 bg-white text-black hover:bg-primary hover:text-white px-5 py-2 rounded-full text-sm font-bold transition-all w-full max-w-none md:max-w-[200px] justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current" />
                        <span>شاهد الآن</span>
                    </button>
                </div>
            </div>
            </motion.div>
        </Wrapper>
    );
}
