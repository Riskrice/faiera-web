'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/ui/course-card';
import { Navbar, Footer } from '@/components/layout';
import { ArrowLeft, BookOpen, Layers3, PlayCircle, Sparkles, Zap, X } from 'lucide-react';
import { getCourses, Course } from '@/lib/api';
import { CATEGORIES, COURSES as demoCourses } from '@/data/courses';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { isDemoContentEnabled } from '@/lib/demo-content';
import { getCourseInstructorName } from '@/lib/course-instructor';

const buildFallbackCourses = (courseIds: string[]): Course[] => {
  return courseIds
    .map((courseId) => demoCourses.find((course) => course.id === courseId))
    .filter((course): course is NonNullable<typeof course> => Boolean(course))
    .map((course) => ({
      id: `demo-${course.id}`,
      titleAr: course.title,
      titleEn: course.title,
      descriptionAr: course.description,
      descriptionEn: course.description,
      thumbnailUrl: course.thumbnail,
      rating: course.rating,
      lessonsCount: course.lessonsCount,
      category: course.category,
      level: course.level,
      price: course.price,
      currency: course.currency,
      author: course.author,
      status: 'PUBLISHED',
    }));
};

const trendingFallback = buildFallbackCourses(['1', '2', '3', '5', '7', '9']);
const newFallback = buildFallbackCourses(['4', '6', '10', '11', '12', '8']);
const categoryLabelMap = Object.fromEntries(CATEGORIES.map((category) => [category.id, category.label]));

const getCategoryLabel = (category?: string) => {
  if (!category) {
    return 'عام';
  }

  return categoryLabelMap[category] || category;
};

const levelLabelMap: Record<string, string> = {
  '1st Secondary': 'الأول الثانوي',
  '2nd Secondary': 'الثاني الثانوي',
  '3rd Secondary': 'الثالث الثانوي',
};

const getLevelLabel = (level?: string) => {
  if (!level) {
    return 'جميع المستويات';
  }

  return levelLabelMap[level] || level;
};

const formatPrice = (price?: number, currency?: string) => {
  if (!price) {
    return 'مجاني';
  }

  return `${price} ${currency || 'EGP'}`;
};

const getInstructorName = (course: Course) => {
  if (typeof course.author === 'object' && course.author?.name) {
    return course.author.name as string;
  }

  return 'مدرس معتمد على فايرا';
};

const pickFallbackCourse = (course: Course, index: number, fallbackCourses: Course[]) => {
  const categoryMatch = fallbackCourses.find((fallbackCourse) => fallbackCourse.category === course.category);
  return categoryMatch || fallbackCourses[index % fallbackCourses.length];
};

const subjectSections = [
  {
    id: 'physics',
    title: 'مسارات الفيزياء',
    subtitle: 'ميكانيكا، كهربية، فيزياء حديثة، وتدريب امتحاني.',
  },
  {
    id: 'math',
    title: 'مسارات الرياضيات',
    subtitle: 'تفاضل وتكامل، جبر، هندسة، ومسائل مستوى عالٍ.',
  },
  {
    id: 'chemistry',
    title: 'مسارات الكيمياء',
    subtitle: 'عضوية وتحليلية ومراجعات مركزة قبل الامتحان.',
  },
  {
    id: 'biology',
    title: 'مسارات الأحياء',
    subtitle: 'وراثة، جهاز عصبي، ورسومات توضيحية مبسطة.',
  },
].map((section) => ({
  ...section,
  courses: demoCourses.filter((course) => course.category === section.id).slice(0, 4),
}));

const heroCategoryShortcuts = CATEGORIES.slice(0, 6);
const heroLevelShortcuts = [
  { id: '1st Secondary', label: 'الأول الثانوي' },
  { id: '2nd Secondary', label: 'الثاني الثانوي' },
  { id: '3rd Secondary', label: 'الثالث الثانوي' },
];

const homepageCarouselCardClass = 'w-[242px] h-[328px] sm:w-[280px] sm:h-[360px] lg:w-[300px] lg:h-[380px]';

const enrichCourses = (courses: Course[], fallbackCourses: Course[]): Course[] => {
  if (courses.length === 0) {
    return fallbackCourses;
  }

  return courses.map((course, index) => {
    const fallback = pickFallbackCourse(course, index, fallbackCourses);

    return {
      ...course,
      titleAr: course.titleAr || fallback?.titleAr,
      titleEn: course.titleEn || fallback?.titleEn,
      thumbnailUrl: course.thumbnailUrl || fallback?.thumbnailUrl,
      rating: course.rating ?? fallback?.rating,
      lessonsCount: course.lessonsCount ?? fallback?.lessonsCount,
      category: course.category || fallback?.category,
      level: course.level || fallback?.level,
    };
  });
};

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
          getCourses({ limit: 6 }),
          getCourses({ limit: 6 })
        ]);

        setTrendingCourses(
          isDemoContentEnabled
            ? enrichCourses(trendingRes.data || [], trendingFallback)
            : (trendingRes.data || [])
        );
        setNewCourses(
          isDemoContentEnabled
            ? enrichCourses(newRes.data || [], newFallback)
            : (newRes.data || [])
        );
      } catch (error) {
        console.error('Failed to fetch courses', error);
        setTrendingCourses(isDemoContentEnabled ? trendingFallback : []);
        setNewCourses(isDemoContentEnabled ? newFallback : []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />

      <section className="relative flex items-center overflow-hidden pb-6 pt-16 md:min-h-[84vh] md:pb-10 md:pt-28">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,_rgba(16,185,129,0.12),_transparent_30%),radial-gradient(circle_at_82%_24%,_rgba(15,23,42,0.08),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.98)_100%)]" />
          <div className="absolute top-[-10%] right-[-12%] h-[360px] w-[360px] rounded-full bg-primary/10 blur-[130px]" />
          <div className="absolute bottom-[-18%] left-[-8%] h-[320px] w-[320px] rounded-full bg-emerald-950/10 blur-[140px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>

        <div className="container mx-auto px-4 md:px-6 z-10 relative">
          <div className="pointer-events-auto rounded-[24px] md:rounded-[40px] border border-slate-200/80 bg-white/72 p-3.5 shadow-[0_35px_100px_rgba(15,23,42,0.10)] backdrop-blur-md md:p-7 lg:p-8">
            <div className="grid items-stretch gap-3 md:gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="rounded-[20px] md:rounded-[32px] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,252,0.88)_100%)] p-4 text-center md:p-6 lg:p-8 lg:text-right"
              >
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </span>
                  <span className="text-sm font-medium text-slate-600 font-cairo">منصة مرتبة حسب المادة والصف</span>
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.72 }}
                  className="py-2 md:py-4 text-[2.2rem] md:text-6xl lg:text-[4.7rem] font-black font-cairo leading-[1.34] md:leading-[1.22] tracking-normal text-slate-950"
                >
                  ابنِ خطتك الدراسية
                  <span className="mt-2 block pt-2 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-primary to-slate-900">مع أول اختيار صح.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 }}
                  className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-lg lg:mx-0"
                >
                  ادخل من المادة أو من الصف مباشرة، ثم انتقل إلى المسارات المناسبة بسرعة ووضوح بدل البحث المشتت بين الكورسات.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                  className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center lg:justify-start"
                >
                  <Button
                    size="lg"
                    variant="glow"
                    className="h-12 md:h-14 rounded-full px-5 md:px-8 text-sm md:text-lg w-full sm:w-auto flex items-center gap-3"
                    onClick={() => {
                      if (user) {
                        const role = user.role;
                        if (role === 'admin' || role === 'super_admin') router.push('/dashboard');
                        else if (role === 'teacher') router.push('/teacher');
                        else router.push('/student');
                      } else {
                        router.push('/explore');
                      }
                    }}
                  >
                    <span>{user ? 'اذهب إلى لوحتك' : 'ابدأ التصفح الآن'}</span>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 md:h-14 rounded-full border-slate-200 bg-white/90 px-5 md:px-8 text-sm md:text-lg text-slate-900 shadow-sm w-full sm:w-auto flex items-center gap-3 hover:bg-white"
                    onClick={() => setShowPromoVideo(true)}
                  >
                    <span>شاهد كيف تعمل المنصة</span>
                    <PlayCircle className="h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.65 }}
                className="rounded-[20px] md:rounded-[32px] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(248,250,252,0.96)_0%,rgba(238,246,243,0.92)_100%)] p-3.5 md:p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary">ابدأ من اختيار أوضح</div>
                    <div className="font-cairo text-lg md:text-xl font-bold text-slate-900">اختر طريق البداية</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="rounded-[18px] md:rounded-[26px] border border-slate-200 bg-white/90 p-3.5 md:p-5 text-right shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">حسب المادة</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mb-3 text-[13px] leading-6 text-slate-500 md:text-sm md:leading-7">ادخل مباشرة إلى المسارات المناسبة لكل مادة.</p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {heroCategoryShortcuts.map((category) => (
                        <Link
                          key={category.id}
                          href={`/explore?category=${category.id}`}
                          className="rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-3 md:px-4 py-2.5 md:py-3 text-right transition-all hover:border-primary hover:bg-white hover:shadow-sm"
                        >
                          <div className="text-[13px] md:text-sm font-bold text-slate-900 leading-6">{category.label}</div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] md:rounded-[26px] border border-slate-200 bg-white/90 p-3.5 md:p-5 text-right shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">حسب الصف</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Layers3 className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mb-3 text-[13px] leading-6 text-slate-500 md:text-sm md:leading-7">ابدأ من المرحلة الدراسية ثم شاهد الكورسات المناسبة.</p>
                    <div className="flex flex-col gap-2.5 md:gap-3">
                      {heroLevelShortcuts.map((level) => (
                        <Link
                          key={level.id}
                          href={`/explore?level=${encodeURIComponent(level.id)}`}
                          className="flex items-center justify-between rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:py-3 transition-all hover:border-primary hover:bg-white hover:shadow-sm"
                        >
                          <ArrowLeft className="h-4 w-4 text-slate-400" />
                          <div className="text-right text-sm font-bold text-slate-900">{level.label}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      </section>

      <section className="relative z-20 pb-5 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="rounded-[20px] md:rounded-[32px] border border-border/70 bg-card/60 px-4 py-4 shadow-sm backdrop-blur-sm md:px-8 md:py-5">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:flex-wrap md:justify-between md:text-right">
              <div className="text-center md:text-right">
                <p className="text-sm font-bold text-primary">ابدأ من الطريق الأقصر</p>
                <h2 className="font-cairo text-2xl font-bold text-foreground">استكشف حسب المادة</h2>
              </div>
              <div className="-mx-1 flex w-[calc(100%+0.5rem)] gap-2 overflow-x-auto px-1 pb-1 hide-scrollbar md:mx-0 md:w-auto md:flex-wrap md:justify-center md:overflow-visible md:px-0 md:pb-0 md:gap-3">
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.id}
                    href={`/explore?category=${category.id}`}
                    className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 relative z-20">
        <div className="container mx-auto px-4 md:px-6 mb-5 flex flex-col gap-2 md:flex-row md:justify-between md:items-end">
          <div className="text-center md:text-right">
            <h2 className="text-[1.55rem] md:text-3xl font-bold font-cairo flex items-center justify-center md:justify-start gap-3 text-foreground">
              <Zap className="text-primary fill-current" />
              الأكثر رواجاً هذا الأسبوع
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm md:text-base font-sans">دورات يتابعها الآلاف الآن</p>
          </div>
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span className="text-xs font-medium text-muted-foreground md:hidden">اسحب للمزيد</span>
            <Link href="/explore" className="text-primary hover:text-foreground transition-colors font-bold text-sm text-center md:text-right">عرض الكل</Link>
          </div>
        </div>

        <div className="overflow-x-auto pt-3 pb-7 hide-scrollbar px-4 md:px-6">
          <div className="flex gap-3 md:gap-6 w-max snap-x snap-mandatory">
            {trendingCourses.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id} className="block snap-center md:snap-start first:pr-0 last:pl-4 md:last:pl-0">
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={getCategoryLabel(course.category)}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`}
                  image={course.thumbnailUrl || '/assets/course-placeholder.svg'}
                  level={getLevelLabel(course.level)}
                  instructor={getCourseInstructorName(course)}
                  priceLabel={formatPrice(course.price, course.currency)}
                  className={homepageCarouselCardClass}
                  delay={i * 0.1}
                />
              </Link>
            ))}
            {isDemoContentEnabled && !loading && trendingCourses.length === 0 && trendingFallback.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id} className="block snap-center md:snap-start first:pr-0 last:pl-4 md:last:pl-0">
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={getCategoryLabel(course.category)}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`}
                  image={course.thumbnailUrl || '/assets/course-placeholder.svg'}
                  level={getLevelLabel(course.level)}
                  instructor={getCourseInstructorName(course)}
                  priceLabel={formatPrice(course.price, course.currency)}
                  className={homepageCarouselCardClass}
                  delay={i * 0.1}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 relative z-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 md:px-6 mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-right">
            <h2 className="text-[1.55rem] md:text-3xl font-bold font-cairo text-foreground">جديد على Faiera</h2>
            <p className="mt-1.5 text-sm md:text-base text-muted-foreground font-sans">دفعة جديدة من الكورسات الجاهزة للبدء الآن.</p>
          </div>
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <span className="text-xs font-medium text-muted-foreground md:hidden">اسحب للمزيد</span>
            <Link href="/explore" className="text-primary hover:text-foreground transition-colors font-bold text-sm text-center md:text-right">كل الإضافات</Link>
          </div>
        </div>
        <div className="overflow-x-auto pt-3 pb-7 hide-scrollbar px-4 md:px-6">
          <div className="flex gap-3 md:gap-6 w-max snap-x snap-mandatory">
            {newCourses.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id} className="block snap-center md:snap-start first:pr-0 last:pl-4 md:last:pl-0">
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={getCategoryLabel(course.category)}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`}
                  image={course.thumbnailUrl || '/assets/course-placeholder.svg'}
                  level={getLevelLabel(course.level)}
                  instructor={getCourseInstructorName(course)}
                  priceLabel={formatPrice(course.price, course.currency)}
                  className={homepageCarouselCardClass}
                  delay={i * 0.1}
                />
              </Link>
            ))}
            {isDemoContentEnabled && !loading && newCourses.length === 0 && newFallback.map((course, i) => (
              <Link href={`/courses/${course.id}`} key={course.id} className="block snap-center md:snap-start first:pr-0 last:pl-4 md:last:pl-0">
                <CourseCard
                  title={course.titleAr || course.titleEn}
                  category={getCategoryLabel(course.category)}
                  rating={course.rating || 0}
                  duration={`${course.lessonsCount || 0} درس`}
                  image={course.thumbnailUrl || '/assets/course-placeholder.svg'}
                  level={getLevelLabel(course.level)}
                  instructor={getCourseInstructorName(course)}
                  priceLabel={formatPrice(course.price, course.currency)}
                  className={homepageCarouselCardClass}
                  delay={i * 0.1}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isDemoContentEnabled && subjectSections.map((section) => (
        <section key={section.id} className="py-7 md:py-10 relative z-20">
          <div className="container mx-auto px-4 md:px-6 mb-5 flex flex-col gap-2 md:flex-row md:justify-between md:items-end">
            <div className="text-center md:text-right">
              <h2 className="text-[1.45rem] md:text-3xl font-bold font-cairo text-foreground">{section.title}</h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1.5 font-sans">{section.subtitle}</p>
            </div>
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <span className="text-xs font-medium text-muted-foreground md:hidden">اسحب للمزيد</span>
              <Link href="/explore" className="text-primary hover:text-foreground transition-colors font-bold text-sm text-center md:text-right">عرض المزيد</Link>
            </div>
          </div>

          <div className="overflow-x-auto pt-3 pb-6 hide-scrollbar px-4 md:px-6">
            <div className="flex gap-3 md:gap-6 w-max snap-x snap-mandatory">
              {section.courses.map((course, index) => (
                <Link href="/explore" key={`${section.id}-${course.id}`} className="block snap-center md:snap-start first:pr-0 last:pl-4 md:last:pl-0">
                  <CourseCard
                    title={course.title}
                    category={getCategoryLabel(course.category)}
                    rating={course.rating}
                    duration={`${course.lessonsCount} درس`}
                    image={course.thumbnail}
                    level={getLevelLabel(course.level)}
                    instructor={course.author.name}
                    priceLabel={formatPrice(course.price, course.currency)}
                    className={homepageCarouselCardClass}
                    delay={index * 0.08}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

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
