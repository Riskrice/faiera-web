'use client';

import { motion } from 'framer-motion';
import { Play, Star, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
    title: string;
    category: string;
    rating: number;
    duration: string;
    image: string;
    delay?: number;
    courseId?: string;
}

export function CourseCard({ title, category, rating, duration, image, delay = 0, courseId }: CourseCardProps) {
    const Wrapper = courseId ? Link : 'div';
    const wrapperProps = courseId ? { href: `/courses/${courseId}` } : {};

    return (
        <Wrapper {...wrapperProps as any}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay, duration: 0.5 }}
                className="relative flex-shrink-0 w-[280px] h-[360px] rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
            {/* Background Image / Placeholder */}
            {/* Background Image / Placeholder */}
            {(image.startsWith('http') || image.startsWith('/')) ? (
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${image} transition-transform duration-700 group-hover:scale-110`} />
            )}

            {/* Overlay Gradient (Netflix Style) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col items-center justify-end h-full transform transition-transform duration-300 group-hover:-translate-y-2 text-center">
                <span className="text-xs font-bold text-primary mb-2 uppercase tracking-wider bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">{category}</span>
                <h3 className="text-xl font-bold font-cairo text-white leading-tight mb-3 drop-shadow-md">
                    {title}
                </h3>

                {/* Meta details */}
                <div className="flex items-center gap-3 text-gray-100 text-xs font-sans opacity-95 mb-1">
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span>{rating}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                    </div>
                </div>

                {/* Play Button (Appears on Hover) */}
                <div className="h-0 opacity-0 group-hover:h-12 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden w-full mt-0 group-hover:mt-4 flex justify-center">
                    <button className="flex items-center gap-2 bg-white text-black hover:bg-primary hover:text-white px-6 py-2 rounded-full text-sm font-bold transition-all w-full max-w-[200px] justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current" />
                        <span>شاهد الآن</span>
                    </button>
                </div>
            </div>
            </motion.div>
        </Wrapper>
    );
}
