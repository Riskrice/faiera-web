"use client"

import { useState, useEffect } from 'react'
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { StatsCard } from '@/components/dashboard/stats-card'
import { DollarSign, Users, BookOpen, Activity, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface OverviewStats {
    totalRevenue: number
    revenueGrowth: number
    activeStudents: number
    newStudentsThisWeek: number
    coursesSold: number
    salesGrowth: number
    activeUsersNow: number
}

interface RevenueDataPoint {
    name: string
    total: number
}

interface RecentSale {
    id: string
    studentName: string
    studentEmail: string
    amount: number
    currency: string
    date: string
    avatarUrl?: string
}

export default function DashboardPage() {
    const { accessToken } = useAuth()
    const [stats, setStats] = useState<OverviewStats | null>(null)
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
    const [recentSales, setRecentSales] = useState<RecentSale[]>([])
    const [loading, setLoading] = useState(true)

    // Default stats when API returns no data
    const defaultStats: OverviewStats = {
        totalRevenue: 0,
        revenueGrowth: 0,
        activeStudents: 0,
        newStudentsThisWeek: 0,
        coursesSold: 0,
        salesGrowth: 0,
        activeUsersNow: 0,
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!accessToken) {
                setStats(defaultStats)
                setLoading(false)
                return
            }

            try {
                // Fetch overview stats
                const overviewData = await api.get<any>('/analytics/overview')
                const overview = overviewData?.data || overviewData;
                if (overview) {
                    // Map backend DTO to frontend interface
                    setStats({
                        totalRevenue: overview.totalRevenue || 0,
                        revenueGrowth: overview.revenueGrowth || 0,
                        activeStudents: overview.totalStudents || 0,
                        newStudentsThisWeek: overview.activeUsersThisWeek || 0,
                        coursesSold: overview.totalSubscriptions || 0,
                        salesGrowth: overview.subscriptionGrowth || 0,
                        activeUsersNow: overview.activeUsersToday || 0,
                    })
                } else {
                    setStats(defaultStats)
                }

                // Fetch revenue data for chart
                const revenueResult = await api.get<any>('/analytics/revenue')
                const revenue = revenueResult?.data || revenueResult;
                if (revenue?.revenueTrend) {
                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
                    setRevenueData(revenue.revenueTrend.map((item: any) => ({
                        name: monthNames[parseInt(item.date.split('-')[1]) - 1] || item.date,
                        total: item.count || 0
                    })))
                }

                // Fetch recent sales
                const salesResult = await api.get<any>('/analytics/recent-sales')
                const salesData = salesResult?.data || salesResult;
                if (salesData && Array.isArray(salesData)) {
                    setRecentSales(salesData)
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
                setStats(defaultStats)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [accessToken])

    // Format currency
    // Format currency
    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;
    }

    // Format percentage
    const formatPercentage = (value: number | undefined) => {
        if (value === undefined || value === null) return '+0.0%'
        const sign = value >= 0 ? '+' : ''
        return `${sign}${value.toFixed(1)}%`
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-cairo">نظرة عامة</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="إجمالي الإيرادات"
                    value={stats ? formatCurrency(stats.totalRevenue) : "0.00 ج.م"}
                    description={stats ? `${formatPercentage(stats.revenueGrowth)} من الشهر الماضي` : "جار التحميل..."}
                    icon={DollarSign}
                />
                <StatsCard
                    title="الطلاب النشطين"
                    value={stats ? `+${stats.activeStudents.toLocaleString()}` : "+0"}
                    description={stats ? `+${stats.newStudentsThisWeek} طالب جديد هذا الأسبوع` : "جار التحميل..."}
                    icon={Users}
                />
                <StatsCard
                    title="الكورسات المباعة"
                    value={stats ? `+${stats.coursesSold.toLocaleString()}` : "+0"}
                    description={stats ? `${formatPercentage(stats.salesGrowth)} زيادة في المبيعات` : "جار التحميل..."}
                    icon={BookOpen}
                />
                <StatsCard
                    title="معدل النشاط"
                    value={stats ? `+${stats.activeUsersNow}` : "+0"}
                    description="مستخدم نشط الآن"
                    icon={Activity}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="font-cairo">نظرة عامة على الإيرادات</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={revenueData} />
                    </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="font-cairo">المبيعات الأخيرة</CardTitle>
                        <CardDescription>
                            {stats ? `تم بيع ${stats.coursesSold} كورس هذا الشهر.` : "جار تحميل البيانات..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentSales data={recentSales} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
