"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    ArrowRight,
    BookOpen,
    Clock,
    DollarSign,
    MoreHorizontal,
    PlayCircle,
    Star,
    Users,
    Video,
    FileText,
    Pencil,
    Loader2
} from "lucide-react"
import Link from "next/link"
import { AddCourseWizard } from "@/components/courses/add-course-wizard"
import { useAuth } from "@/contexts"

interface Course {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    thumbnailUrl?: string;
    status: string;
    subject?: string;
    grade?: string;
    price?: number;
    currency?: string;
    lessonCount?: number;
    enrolledCount?: number;
    modules?: any[];
}

export default function CourseDetailPage() {
    const params = useParams()
    const { accessToken } = useAuth()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

    useEffect(() => {
        const fetchCourse = async () => {
            if (!accessToken || !params.courseId) {
                setLoading(false)
                return
            }

            try {
                const response = await fetch(`${apiUrl}/content/courses/${params.courseId}?includeModules=true`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (!response.ok) {
                    if (response.status === 404) {
                        setError('الكورس غير موجود')
                    } else {
                        throw new Error('فشل في تحميل الكورس')
                    }
                    return
                }

                const result = await response.json()
                setCourse(result.data || result)
            } catch (err: any) {
                setError(err.message || 'حدث خطأ')
            } finally {
                setLoading(false)
            }
        }

        fetchCourse()
    }, [accessToken, params.courseId, apiUrl])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-2xl font-bold text-muted-foreground">{error || 'الكورس غير موجود'}</h2>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/courses">عودة للكورسات</Link>
                </Button>
            </div>
        )
    }

    const title = course.titleAr || course.titleEn || 'بدون عنوان'
    const description = course.descriptionAr || course.descriptionEn || ''

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/dashboard/courses" className="hover:text-foreground transition-colors">
                            الكورسات
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{title}</span>
                    </div>
                    <h1 className="text-3xl font-bold font-cairo tracking-tight">{title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <AddCourseWizard course={{
                        title: title,
                        subject: course.subject || '',
                        grade: course.grade || '',
                        term: '',
                        price: course.price || 0,
                        currency: course.currency || 'EGP',
                        sections: []
                    }}>
                        <Button variant="outline" className="gap-2">
                            <Pencil className="w-4 h-4" />
                            تعديل الكورس
                        </Button>
                    </AddCourseWizard>
                    <Button variant="default" asChild>
                        <Link href={`/courses/${course.id}`} target="_blank">
                            سجل الان (معاينة)
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-1">
                        <Users className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-2xl font-bold">{course.enrolledCount || 0}</span>
                        <span className="text-xs text-muted-foreground">طالب مشترك</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-1">
                        <BookOpen className="w-8 h-8 text-amber-500 mb-2" />
                        <span className="text-2xl font-bold">{course.lessonCount || 0}</span>
                        <span className="text-xs text-muted-foreground">درس</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-1">
                        <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="mb-2 text-sm">
                            {course.status === 'published' ? 'منشور' : 'مسودة'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">حالة الكورس</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center gap-1">
                        <DollarSign className="w-8 h-8 text-emerald-500 mb-2" />
                        <span className="text-2xl font-bold">{(course.price || 0) > 0 ? `${course.price} ${course.currency || 'EGP'}` : 'مجاني'}</span>
                        <span className="text-xs text-muted-foreground">سعر البيع</span>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="curriculum" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-6">
                                محتوى الكورس
                            </TabsTrigger>
                            <TabsTrigger value="students" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-6">
                                الطلاب المسجلين
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="curriculum" className="pt-6 space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map((module: any) => (
                                    <Card key={module.id} className="overflow-hidden">
                                        <CardHeader className="bg-muted/30 py-4 px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-lg">{module.titleAr || module.titleEn}</span>
                                                    <Badge variant="secondary" className="text-xs">{module.lessons?.length || 0} دروس</Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {module.lessons?.map((lesson: any, index: number) => (
                                                <div
                                                    key={lesson.id}
                                                    className={`flex items-center justify-between p-4 hover:bg-muted/20 transition-colors ${index !== (module.lessons?.length || 0) - 1 ? 'border-b' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                            {lesson.type === 'video' && <PlayCircle className="w-4 h-4" />}
                                                            {lesson.type === 'quiz' && <FileText className="w-4 h-4" />}
                                                            {lesson.type === 'article' && <BookOpen className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">{lesson.titleAr || lesson.titleEn}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {lesson.type === 'video' ? 'فيديو' : lesson.type === 'quiz' ? 'اختبار' : 'مقال'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {lesson.isFree && <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-xs">مجاني</Badge>}
                                                        {lesson.durationMinutes && <span className="text-sm font-mono text-muted-foreground">{lesson.durationMinutes} د</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>لم يتم إضافة محتوى لهذا الكورس بعد.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="students" className="pt-6">
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>قائمة الطلاب غير متاحة في النسخة التجريبية.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>عن الكورس</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {course.thumbnailUrl && (
                                <div className="aspect-video w-full rounded-md overflow-hidden bg-muted relative group">
                                    <img
                                        src={course.thumbnailUrl}
                                        alt={title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                            )}

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {description || 'لا يوجد وصف لهذا الكورس.'}
                            </p>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {course.subject && <Badge variant="secondary">{course.subject}</Badge>}
                                {course.grade && <Badge variant="outline">{course.grade}</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

