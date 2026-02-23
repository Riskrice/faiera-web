'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/ui/course-card';
import { Navbar, Footer } from '@/components/layout';
import { ArrowLeft, PlayCircle, Zap, X } from 'lucide-react';
import { getCourses, Course } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
  const [newCourses, setNewCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromoVideo, setShowPromoVideo] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, newRes] = await Promise.all([
          getCourses({ limit: 4 }), // Removed unsupported sort param
          getCourses({ limit: 4 })  // Removed unsupported sort param
        ]);

        // Handle response structure { data: [], meta: ... }
        setTrendingCourses(trendingRes.data || []);
        setNewCourses(newRes.data || []);
      } catch (error) {
        console.error('Failed to fetch courses', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>

        <div className="container mx-auto px-6 z-10 relative pt-20">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border backdrop-blur-md mb-8"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-muted-foreground font-cairo">المنصة التعليمية الأسرع نمواً في الشرق الأوسط</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black font-cairo leading-tight mb-6 text-foreground"
            >
              تعلم. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">تطور.</span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground">اصنع مستقبلك.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-muted-foreground font-sans max-w-2xl mb-10 leading-relaxed"
            >
              انضم إلى نخبة المتعلمين في شبكة Faiera. اكتسب مهارات القرن الحادي والعشرين مع أفضل الخبراء في تجربة تعليمية سينمائية لا مثيل لها.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
              <Button
                size="lg"
                variant="glow"
                className="h-16 px-10 text-xl rounded-full w-full sm:w-auto flex items-center gap-3"
                onClick={() => {
                  if (user) {
                    const role = user.role;
                    if (role === 'admin' || role === 'super_admin') router.push('/dashboard');
                    else if (role === 'teacher') router.push('/teacher');
                    else router.push('/student');
                  } else {
                    router.push('/register');
                  }
                }}
              >
                <span>{user ? 'ادخل لوحة التحكم' : 'ابدأ رحلتك المجانية'}</span>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 text-xl rounded-full border-input hover:bg-accent text-foreground shadow-sm w-full sm:w-auto flex items-center gap-3"
                onClick={() => setShowPromoVideo(true)}
              >
                <span>شاهد العرض التشويقي</span>
                <PlayCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Fade to content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      </section>

      {/* --- TRENDING SECTION (Netflix Style Slider) --- */}
      <section className="py-20 relative z-20">
        <div className="container mx-auto px-6 mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold font-cairo flex items-center gap-3 text-foreground">
              <Zap className="text-primary fill-current" />
              الأكثر رواجاً هذا الأسبوع
            </h2>
            <p className="text-muted-foreground mt-2 font-sans">دورات يتابعها الآلاف الآن</p>
          </div>
          <Link href="/explore" className="text-primary hover:text-foreground transition-colors font-bold text-sm">عرض الكل</Link>
        </div>

        <div className="overflow-x-auto pt-4 pb-12 hide-scrollbar px-6">
          <div className="flex gap-6 w-max">
            {trendingCourses.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id}>
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={course.category || 'General'}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`} // Or duration if available
                  image={course.thumbnailUrl || '/placeholder.jpg'}
                  delay={i * 0.1}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEW RELEASES --- */}
      <section className="py-10 relative z-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6 mb-8">
          <h2 className="text-3xl font-bold font-cairo text-foreground">جديد على Faiera</h2>
        </div>
        <div className="overflow-x-auto pt-4 pb-12 hide-scrollbar px-6">
          <div className="flex gap-6 w-max">
            {newCourses.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id}>
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={course.category || 'General'}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`}
                  image={course.thumbnailUrl || '/placeholder.jpg'}
                  delay={i * 0.1}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* --- PROMO VIDEO MODAL --- */}
      <AnimatePresence>
        {showPromoVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPromoVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-[90vw] max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPromoVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                title="Faiera - العرض التشويقي"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
