'use client';

import { Mentor } from '@/data/mentors';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Globe, Star, Users, Briefcase } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './button';

interface MentorCardProps {
    mentor: Mentor;
    delay?: number;
}

export function MentorCard({ mentor, delay = 0 }: MentorCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="group relative bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-500"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-6 flex flex-col items-center text-center relative z-10">
                {/* Avatar with Ring */}
                <div className="relative mb-4 group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-emerald-400 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-primary/50 to-transparent relative">
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <Image
                                src={mentor.image}
                                alt={mentor.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    </div>
                </div>

                {/* Name & Role */}
                <h3 className="text-xl font-bold font-cairo text-foreground mb-1 group-hover:text-primary transition-colors">{mentor.name}</h3>
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-3">{mentor.role}</p>

                {/* Company Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs text-muted-foreground mb-4">
                    <Briefcase className="w-3 h-3" />
                    {mentor.company}
                </span>

                {/* Bio */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 min-h-[60px]">
                    {mentor.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 w-full gap-4 mb-6 border-t border-border pt-4">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 text-yellow-500 font-bold">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{mentor.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">تقييم المدرب</span>
                    </div>
                    <div className="flex flex-col items-center border-r border-border">
                        <div className="flex items-center gap-1 text-foreground font-bold">
                            <Users className="w-4 h-4 text-primary" />
                            <span>{(mentor.students / 1000).toFixed(1)}k</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">طالب</span>
                    </div>
                </div>

                {/* Action */}
                <Link href={`/explore?teacherId=${mentor.id}`} className="w-full">
                    <Button variant="outline" className="w-full rounded-xl border-border text-foreground hover:bg-muted hover:text-foreground group-hover:border-primary/50 group-hover:text-primary transition-all">
                        عرض الكورسات
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}
