'use client';

import { Navbar, Footer } from '@/components/layout';
import { MentorCard } from '@/components/ui/mentor-card';
import { MENTORS } from '@/data/mentors';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Teacher {
    id: string;
    userId: string;
    specialization: string;
    specializations: string[];
    bio?: string;
    rating: number;
    totalReviews: number;
    totalStudents: number;
    isVerified: boolean;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function MentorsPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTeachers() {
            try {
                const res = await api.get<any>('/teachers');
                const data = res?.data || res;
                if (Array.isArray(data)) {
                    setTeachers(data);
                } else if (data?.items) {
                    setTeachers(data.items);
                }
            } catch (error) {
                console.error('Failed to fetch teachers, falling back to static data');
                // Fallback to static data if API fails
                setTeachers([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTeachers();
    }, []);

    // Convert API teachers to mentor card format, fallback to static MENTORS if empty
    const mentorsToShow = teachers.length > 0
        ? teachers.map(t => ({
            id: t.id,
            name: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'مدرس',
            subject: t.specialization || t.specializations?.[0] || 'متعدد المواد',
            rating: t.rating || 0,
            students: t.totalStudents || 0,
            image: (t.user as any)?.metadata?.avatar || '/avatars/01.png',
            bio: t.bio || '',
            role: 'معلم',
            company: 'Faiera',
            courses: 0,
            social: {}
        }))
        : MENTORS;
    return (
        <main className="min-h-screen bg-background text-foreground flex flex-col pt-20">
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto text-center relative z-10 max-w-3xl">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-sm font-bold mb-6 font-cairo"
                    >
                        نخبة الخبراء
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black font-cairo mb-6 leading-tight"
                    >
                        تعلم من <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">عمالقة المواد</span><br /> للثانوية العامة
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-muted-foreground leading-relaxed"
                    >
                        فريقنا يضم نخبة من كبار المعلمين ومؤلفي الكتب الخارجية ومستشاري المواد، لنضمن لك التفوق والدرجة النهائية في كل المواد.
                    </motion.p>
                </div>
            </section>

            {/* Grid Section */}
            <section className="container mx-auto px-6 pb-20">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {mentorsToShow.map((mentor, index) => (
                            <MentorCard key={mentor.id} mentor={mentor} delay={index * 0.1} />
                        ))}
                    </div>
                )}
            </section>

            <Footer />
        </main>
    );
}
