"use client"

import { useState, useEffect } from "react"
import { StudentCourseCard } from "@/components/dashboard/student-course-card"
import { Loader2, BookOpen } from "lucide-react"
import { useAuth } from "@/contexts"
import { toast } from "sonner"

type Course = {
    id: string
    title: string
    thumbnail: string
    progress: number
    lastLesson: string
    totalLessons: number
    completedLessons: number
}

type Program = {
    id: string
    nameAr: string
    nameEn: string
    descriptionAr?: string
    thumbnailUrl?: string
    grade: string
    status: string
    courses?: {
        id: string
        nameAr: string
        thumbnailUrl?: string
        modules?: {
            lessons?: { id: string }[]
        }[]
    }[]
}

export default function StudentCoursesPage() {
    const { accessToken } = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    useEffect(() => {
        const fetchCourses = async () => {
            if (!accessToken) {
                setLoading(false)
                return
            }

            try {
                // 1. Fetch user's subscriptions
                const subResponse = await fetch(`${apiUrl}/subscriptions/my`, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                })
                const subData = await subResponse.json()
                const subscriptions: any[] = subData.data || []

                // 2. Fetch all published courses (with program info)
                // Note: ideally we should have an endpoint /content/my-courses, 
                // but we will filter client-side for now based on subscription access.
                const coursesResponse = await fetch(`${apiUrl}/content/courses?status=published`, {
                    headers: { "Authorization": `Bearer ${accessToken}` }
                })
                const coursesData = await coursesResponse.json()
                const allCourses: any[] = coursesData.data || []

                // 3. Filter courses based on access
                const enrolledCourses = allCourses.filter(course => {
                    const program = course.program
                    if (!program) return false

                    // Check if user has active subscription covering this program's grade and subject
                    return subscriptions.some(sub =>
                        sub.status === 'active' &&
                        sub.grade === program.grade &&
                        sub.subjects.includes(program.subject)
                    )
                })

                // 4. Fetch progress for these courses
                let progressMap: Record<string, any> = {}
                try {
                    const progressResponse = await fetch(`${apiUrl}/progress/my`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                    })
                    if (progressResponse.ok) {
                        const progressData = await progressResponse.json()
                        if (progressData.data) {
                            progressData.data.forEach((p: any) => {
                                if (p.courseId) progressMap[p.courseId] = p
                            })
                        }
                    }
                } catch (e) { console.warn('Progress fetch failed', e) }

                // 5. Transform to UI model
                const transformed = enrolledCourses.map(course => {
                    const prog = progressMap[course.id]
                    const totalLessons = course.lessonCount || 0
                    const completed = prog?.completedLessons || 0
                    const progressPercent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0

                    return {
                        id: course.id,
                        title: course.titleAr || course.titleEn,
                        thumbnail: course.thumbnailUrl || "/images/placeholder-course.jpg",
                        progress: progressPercent,
                        lastLesson: prog?.lastLessonTitle || "ابدأ الكورس",
                        totalLessons,
                        completedLessons: completed
                    }
                })

                setCourses(transformed)
            } catch (error: any) {
                console.error("Error fetching courses:", error)
                toast.error(error.message || "حدث خطأ أثناء تحميل الكورسات")
            } finally {
                setLoading(false)
            }
        }

        fetchCourses()
    }, [accessToken, apiUrl])

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold font-cairo">كورساتي</h2>
                <p className="text-muted-foreground">تابع تقدمك في الكورسات التي أنت مشترك فيها.</p>
            </div>

            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg">لا توجد كورسات متاحة حالياً.</p>
                    <p className="text-sm text-muted-foreground mt-2">اشترك في باقة للوصول للكورسات.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <StudentCourseCard
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            thumbnail={course.thumbnail}
                            progress={course.progress}
                            lastLesson={course.lastLesson}
                            totalLessons={course.totalLessons}
                            completedLessons={course.completedLessons}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
