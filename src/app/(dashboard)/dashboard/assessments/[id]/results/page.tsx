"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    getAssessment,
    getAssessmentAttempts,
    Assessment,
    AssessmentAttempt
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"
import { Eye, ArrowRight, Download } from "lucide-react"

export default function AssessmentResultsPage() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params.id as string

    const [assessment, setAssessment] = useState<Assessment | null>(null)
    const [attempts, setAttempts] = useState<AssessmentAttempt[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const [assessmentRes, attemptsRes] = await Promise.all([
                    getAssessment(assessmentId),
                    getAssessmentAttempts(assessmentId)
                ])
                setAssessment(assessmentRes.data)
                setAttempts(attemptsRes.data)
            } catch (error) {
                console.error(error)
                toast.error("فشل تحميل النتائج")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [assessmentId])

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
    }

    if (!assessment) return <div className="p-8">Assessment not found</div>

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
            case 'GRADED':
                return <Badge className="bg-emerald-500">تم التسليم</Badge>
            case 'IN_PROGRESS':
                return <Badge variant="secondary">جاري الحل</Badge>
            case 'SUBMITTED':
                return <Badge className="bg-yellow-500">بانتظار التصحيح</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">نتائج الاختبار: {assessment.titleAr}</h1>
                    <p className="text-muted-foreground text-lg">
                        عدد المحاولات: {attempts.length}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowRight className="w-4 h-4 ml-2" /> عودة
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()}>
                        <Download className="w-4 h-4 ml-2" /> طباعة تقرير
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>قائمة الطلاب</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الطالب</TableHead>
                                <TableHead>تاريخ البدء</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>الدرجة</TableHead>
                                <TableHead>النسبة</TableHead>
                                <TableHead className="text-left">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attempts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        لا توجد محاولات حتى الآن
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attempts.map((attempt) => (
                                    <TableRow key={attempt.id}>
                                        <TableCell className="font-medium">
                                            {/* Ideally fetch user name, but for now showing ID or mock */}
                                            {attempt.userId}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(attempt.startedAt), "PPP p", { locale: ar })}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                                        <TableCell>
                                            {attempt.score !== undefined ? `${attempt.score} / ${assessment.totalPoints}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {attempt.score !== undefined
                                                ? `${Math.round((attempt.score / assessment.totalPoints) * 100)}%`
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
