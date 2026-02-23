"use client";

import api from "@/lib/api";
import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts";
import { toast } from "sonner";

type OverviewStats = {
    totalRevenue: number
    revenueGrowth: number
    totalUsers: number
    userGrowth: number
    completedCourses: number
    courseGrowth: number
    activeNow: number
}

type RevenueDataPoint = {
    name: string
    total: number
}

type UserGrowthPoint = {
    name: string
    active: number
    new: number
}

const engagementData = [
    { name: 'نشط جداً', value: 400, color: '#10b981' },
    { name: 'نشط', value: 300, color: '#3b82f6' },
    { name: 'خامل', value: 300, color: '#ef4444' },
    { name: 'جديد', value: 200, color: '#f59e0b' },
];

export default function AnalyticsPage() {
    const { accessToken } = useAuth()
    const [stats, setStats] = useState<OverviewStats>({
        totalRevenue: 0,
        revenueGrowth: 0,
        totalUsers: 0,
        userGrowth: 0,
        completedCourses: 0,
        courseGrowth: 0,
        activeNow: 0
    })
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
    const [userGrowthData, setUserGrowthData] = useState<UserGrowthPoint[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!accessToken) {
                setLoading(false)
                return
            }

            try {
                // Fetch overview stats
                const overviewData = await api.get<any>('/analytics/overview')
                if (overviewData) {
                    // DTO might return data wrapped or direct
                    const data = overviewData.data || overviewData
                    setStats({
                        totalRevenue: data.totalRevenue || 0,
                        revenueGrowth: data.revenueGrowth || 0,
                        totalUsers: data.totalUsers || 0,
                        userGrowth: data.userGrowth || 0,
                        completedCourses: data.completedCourses || 0,
                        courseGrowth: data.courseGrowth || 0,
                        activeNow: data.activeUsersToday || 0 // Backend returns activeUsersToday
                    })
                }

                // Fetch revenue data
                const revenueResult = await api.get<any>('/analytics/revenue')
                if (revenueResult) {
                    // Fix: Backend returns revenueTrend, not monthly
                    const revenueTrend = revenueResult.revenueTrend || revenueResult.data?.revenueTrend || []
                    setRevenueData(revenueTrend.map((m: any) => ({
                        name: m.date,
                        total: m.count || 0
                    })))
                }

                // Fetch user stats
                const usersResult = await api.get<any>('/analytics/users')
                if (usersResult) {
                    // Fix: Backend returns registrationTrend, not weeklyGrowth
                    // Also backend DTO structure is different from what was expected
                    const registrationTrend = usersResult.registrationTrend || usersResult.data?.registrationTrend || []
                    setUserGrowthData(registrationTrend.map((w: any) => ({
                        name: w.date,
                        active: 0, // Backend doesn't provide active users trend yet
                        new: w.count || 0
                    })))
                }

            } catch (error) {
                console.error("Error fetching analytics:", error)
                // toast.error("فشل في تحميل بيانات التحليلات")
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [accessToken])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">التحليلات</h2>
                    <p className="text-muted-foreground">نظرة عميقة على أداء المنصة وتفاعل الطلاب</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="outline" className="px-3 py-1">آخر 30 يوم</Badge>
                    <Badge variant="default" className="px-3 py-1 cursor-pointer">تحميل التقرير</Badge>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} EGP</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% من الشهر الماضي
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الطلاب الجدد</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}% من الشهر الماضي
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">كورسات مكتملة</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.completedCourses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.courseGrowth >= 0 ? '+' : ''}{stats.courseGrowth}% من الشهر الماضي
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">نشط الآن</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeNow}</div>
                        <p className="text-xs text-muted-foreground">
                            مستخدم نشط حالياً
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>نظرة عامة على الإيرادات</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={revenueData}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                لا توجد بيانات إيرادات بعد
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Engagement Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>تفاعل الطلاب</CardTitle>
                        <CardDescription>
                            توزيع الطلاب حسب نشاطهم في آخر 30 يوم
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={engagementData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {engagementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-4">
                            {engagementData.map((item, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                    <span>{item.name} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Growth Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>نمو الطلاب</CardTitle>
                    <CardDescription>مقارنة بين الطلاب النشطين والجدد أسبوعياً</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {userGrowthData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} name="طلاب جدد" />
                                <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} name="طلاب نشطين" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            لا توجد بيانات نمو بعد
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
