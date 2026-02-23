"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts"
import { getAssessments, Assessment, AssessmentStatus } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function StudentAssessmentsPage() {
    const { accessToken } = useAuth()
    const [assessments, setAssessments] = useState<Assessment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAssessments = async () => {
            if (!accessToken) return

            try {
                // Fetch published assessments
                // We might need a specific endpoint for student assessments that are published and relevant to them
                // For now, using the general list and filtering client side or hoping backend does it
                // Assuming we have an endpoint or filter for published items.
                // Reusing getAssessments but ideally we need getStudentAssessments
                // Let's assume getAssessments returns what is allowed.
                const response = await getAssessments()
                if (response.data) {
                    // Filter for published only if the API returns mixed
                    const published = response.data.filter(a => a.status === AssessmentStatus.PUBLISHED)
                    setAssessments(published)
                }
            } catch (error) {
                console.error("Failed to fetch assessments", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssessments()
    }, [accessToken])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-cairo">الاختبارات والواجبات</h1>
                <p className="text-muted-foreground">جميع الاختبارات المتاحة لك لأدائها</p>
            </div>

            {assessments.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border-dashed border-2">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-semibold">لا توجد اختبارات متاحة حالياً</h3>
                    <p className="text-muted-foreground">عند نشر اختبارات جديدة ستظهر هنا.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map((assessment) => (
                        <Card key={assessment.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant={assessment.type === 'exam' ? "destructive" : "secondary"}>
                                        {assessment.type === 'exam' ? 'اختبار' : 'واجب'}
                                    </Badge>
                                    <Badge variant="outline">{assessment.totalPoints} درجة</Badge>
                                </div>
                                <CardTitle className="line-clamp-1 text-lg">{assessment.titleAr}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {assessment.descriptionAr || "لا يوجد وصف"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} دقيقة` : 'وقت مفتوح'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{assessment.maxAttempts > 0 ? `${assessment.maxAttempts} محاولات` : 'محاولات غير محدودة'}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full gap-2" asChild>
                                    <Link href={`/dashboard/assessments/${assessment.id}/take`}>
                                        بدء الاختبار
                                        <ChevronLeft className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
