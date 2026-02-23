'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, UserCheck, Star } from 'lucide-react';

const stats = [
    { label: 'طلاب نشطون', value: '+15,000', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'دورة تدريبية', value: '+200', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'مدرب محترف', value: '+50', icon: UserCheck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'نسبة رضا', value: '4.9/5', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
];

export function StatsSection() {
    return (
        <section className="py-12 border-y border-border bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-black font-cairo text-foreground mb-1">{stat.value}</h3>
                            <p className="text-muted-foreground font-medium text-sm">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
