"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, BookOpen, Flame, ArrowRight, PlayCircle, Star, Loader2, Calendar } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip } from "recharts"
import Link from "next/link"
import { getStudentStats, getStudentProgress, getStudentActivity } from "@/lib/api"
import { useAuth } from "@/contexts"

export default function StudentProgressPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>(null)
    const [activity, setActivity] = useState<any[]>([])
    const [activeCourses, setActiveCourses] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activityRes, progressRes] = await Promise.all([
                    getStudentStats(),
                    getStudentActivity(),
                    getStudentProgress(10)
                ])

                setStats(statsRes.data)
                setActivity(activityRes.data)
                setActiveCourses(progressRes.data)
            } catch (error) {
                console.error("Failed to fetch progress data", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchData()
        }
    }, [user])

    if (loading) {
        return (
            <div className="flex bg-background min-h-[500px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const statCards = [
        { label: "كورس مكتمل", value: stats?.completedCourses || 0, icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" },
        { label: "ساعة تعلم", value: stats?.hoursLearned || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "كورس حالي", value: stats?.activeCourses || 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100" },
        { label: "يوم متواصل", value: stats?.streakDays || 0, icon: Flame, color: "text-orange-600", bg: "bg-orange-100" },
    ]

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 max-w-7xl mx-auto font-cairo">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">تقدمي التعليمي</h2>
                    <p className="text-muted-foreground mt-1">تابع إنجازاتك واحصائيات تعلمك في مكان واحد</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-7">

                {/* Active Courses List (Main Content) */}
                <Card className="col-span-7 md:col-span-4 border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-primary" />
                            دورات قيد التعلم
                        </CardTitle>
                        <CardDescription>
                            استكمل رحلتك التعليمية من حيث توقفت
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {activeCourses.length === 0 ? (
                            <div className="text-center py-10 opacity-70">
                                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p>لا توجد دورات قيد التقدم حالياً</p>
                                <Button variant="link" asChild>
                                    <Link href="/student/courses">تصفح الكورسات</Link>
                                </Button>
                            </div>
                        ) : (
                            activeCourses.map((item) => (
                                <div key={item.id} className="group flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
                                    <div className={`w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
                                        <PlayCircle className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                    {item.content?.titleAr || item.content?.titleEn || 'درس تعليمي'}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    آخر نشاط: {new Date(item.lastAccessedAt).toLocaleDateString('ar-EG')}
                                                </p>
                                            </div>
                                            <Link href={`/student/courses/${item.content?.courseId || '1'}/learn/${item.contentId}`}>
                                                <Button size="sm" variant="ghost" className="gap-1 text-primary hover:text-primary hover:bg-primary/10">
                                                    تابع
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                        <div className="space-y-1">
                                            <Progress value={50} className="h-2" />
                                            {/* Note: Real max progress calc needs course context, putting placeholder 50% or using stored percent */}
                                            <p className="text-xs text-right text-muted-foreground font-medium">قيد التقدم</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <Link href="/student/courses" className="block">
                            <Button variant="outline" className="w-full gap-2">
                                تصفح كل دوراتي
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Sidebar Charts */}
                <div className="col-span-7 md:col-span-3 space-y-6">

                    {/* Activity Chart */}
                    <Card className="border-none shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                نشاط التعلم الأسبوعي
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={activity}>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar
                                            dataKey="hours"
                                            radius={[4, 4, 0, 0]}
                                            className="fill-primary"
                                            barSize={30}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
