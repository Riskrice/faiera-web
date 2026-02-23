"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
    getAssessment,
    updateAssessment,
    addQuestionsToAssessment,
    removeQuestionFromAssessment,
    reorderAssessmentQuestions,
    publishAssessment, // Import added
    Assessment,
    AssessmentQuestion,
    AssessmentType,
    AssessmentStatus,
    ShuffleMode
} from "@/lib/api"
import { SubjectEnum, EducationalStageEnum } from "@/lib/schemas/question"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import {
    Settings,
    List,
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    Clock,
    Calendar,
    Award,
    Shuffle,
    Loader2,
    CheckCircle // Added CheckCircle for published state visuals if needed
} from "lucide-react"
import { toast } from "sonner"
import { QuestionPicker } from "@/components/questions/question-picker"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function AssessmentBuilderPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultTab = searchParams.get('tab') || 'questions'
    const id = params.id as string

    const { loading: authLoading } = useAuth()
    const [assessment, setAssessment] = useState<Assessment | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isPickerOpen, setIsPickerOpen] = useState(false)

    // Form States
    const [formData, setFormData] = useState<Partial<Assessment>>({})

    useEffect(() => {
        if (!authLoading) {
            fetchAssessment()
        }
    }, [id, authLoading])

    const fetchAssessment = async () => {
        try {
            setIsLoading(true)
            const res = await getAssessment(id)
            setAssessment(res.data)
            setFormData(res.data)
        } catch (error) {
            toast.error("فشل تحميل الاختبار")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        try {
            setIsSaving(true)
            // Filter payload to only include allowed fields in UpdateAssessmentDto
            const payload = {
                titleAr: formData.titleAr,
                titleEn: formData.titleEn,
                descriptionAr: formData.descriptionAr,
                descriptionEn: formData.descriptionEn,
                instructionsAr: formData.instructionsAr,
                instructionsEn: formData.instructionsEn,
                timeLimitMinutes: formData.timeLimitMinutes,
                startDate: formData.startDate,
                endDate: formData.endDate,
                maxAttempts: formData.maxAttempts,
                passingScore: formData.passingScore,
                showScoreImmediately: formData.showScoreImmediately,
                showCorrectAnswers: formData.showCorrectAnswers,
                showExplanations: formData.showExplanations,
                shuffleMode: formData.shuffleMode,
                grade: formData.grade,
                subject: formData.subject
            }
            await updateAssessment(id, payload)
            toast.success("تم حفظ الإعدادات بنجاح")
            fetchAssessment() // Refresh
        } catch (error) {
            console.error("Save settings error:", error)
            toast.error("فشل حفظ الإعدادات")
        } finally {
            setIsSaving(false)
        }
    }

    const handlePublish = async () => {
        if (!confirm("هل أنت متأكد من نشر هذا الاختبار؟ لن تتمكن من تعديل الأسئلة بعد النشر.")) return

        try {
            setIsPublishing(true)
            await publishAssessment(id)
            toast.success("تم نشر الاختبار بنجاح")
            fetchAssessment()
        } catch (error) {
            console.error("Publish error:", error)
            toast.error("فشل نشر الاختبار")
        } finally {
            setIsPublishing(false)
        }
    }

    const handleAddQuestions = async (questions: any[]) => {
        try {
            const questionIds = questions.map(q => q.id!)
            await addQuestionsToAssessment(id, questionIds)
            toast.success("تم إضافة الأسئلة بنجاح")
            fetchAssessment()
        } catch (error) {
            toast.error("فشل إضافة الأسئلة")
        }
    }

    const handleRemoveQuestion = async (questionId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السؤال من الاختبار؟")) return

        try {
            await removeQuestionFromAssessment(id, questionId)
            toast.success("تم حذف السؤال")
            fetchAssessment()
        } catch (error) {
            toast.error("فشل حذف السؤال")
        }
    }

    const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
        if (!assessment) return
        const questions = [...assessment.assessmentQuestions]
            .sort((a, b) => a.sortOrder - b.sortOrder)

        if (direction === 'up' && index > 0) {
            [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]]
        } else if (direction === 'down' && index < questions.length - 1) {
            [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]
        } else {
            return
        }

        // Optimistic UI could be done here, but let's just save
        const orderedIds = questions.map(q => q.questionId)
        try {
            await reorderAssessmentQuestions(id, orderedIds)
            fetchAssessment()
        } catch (error) {
            toast.error("فشل إعادة الترتيب")
        }
    }

    const getSubjectLabel = (subject: string) => {
        const labels: Record<string, string> = {
            arabic: "اللغة العربية",
            english: "اللغة الإنجليزية",
            math: "الرياضيات",
            science: "العلوم",
            physics: "الفيزياء",
            chemistry: "الكيمياء",
            biology: "الأحياء",
            history: "التاريخ",
            geography: "الجغرافيا",
            computer_science: "الحاسب الآلي"
        }
        return labels[subject] || subject
    }

    const getGradeLabel = (grade: string) => {
        const labels: Record<string, string> = {
            primary: "المرحلة الابتدائية",
            preparatory: "المرحلة الإعدادية",
            secondary: "المرحلة الثانوية",
            university: "المرحلة الجامعية"
        }
        return labels[grade] || grade
    }

    if (isLoading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    }

    if (!assessment) return <div>Assessment not found</div>

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 ml-2" />
                        عودة
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{assessment.titleAr}</h1>
                        <p className="text-muted-foreground">{assessment.grade} - {assessment.subject}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {assessment.status === AssessmentStatus.DRAFT ? (
                        <>
                            <Button variant="outline" onClick={() => fetchAssessment()}>
                                تحديث البيانات
                            </Button>
                            <Button
                                onClick={handlePublish}
                                disabled={isPublishing || assessment.assessmentQuestions.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                نشر الاختبار
                            </Button>
                        </>
                    ) : (
                        <Badge variant={assessment.status === AssessmentStatus.PUBLISHED ? "default" : "secondary"} className="text-sm px-3 py-1">
                            {assessment.status === AssessmentStatus.PUBLISHED ? "منشور" : assessment.status}
                        </Badge>
                    )}
                </div>
            </div>

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                    <TabsTrigger value="settings" className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                        <Settings className="w-4 h-4 ml-2" />
                        الإعدادات
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                        <List className="w-4 h-4 ml-2" />
                        الأسئلة ({assessment.assessmentQuestions.length})
                    </TabsTrigger>
                </TabsList>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>بيانات الاختبار</CardTitle>
                                <CardDescription>المعلومات الأساسية والعناوين</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>العنوان (عربي)</Label>
                                    <Input
                                        value={formData.titleAr || ''}
                                        onChange={e => setFormData({ ...formData, titleAr: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>العنوان (إنجليزي)</Label>
                                    <Input
                                        value={formData.titleEn || ''}
                                        onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>الوصف</Label>
                                    <Textarea
                                        value={formData.descriptionAr || ''}
                                        onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>المرحلة</Label>
                                        <Select
                                            value={formData.grade || ""}
                                            onValueChange={(val) => setFormData({ ...formData, grade: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المرحلة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EducationalStageEnum.options.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                        {getGradeLabel(opt)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>المادة</Label>
                                        <Select
                                            value={formData.subject || ""}
                                            onValueChange={(val) => setFormData({ ...formData, subject: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر المادة" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SubjectEnum.options.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                        {getSubjectLabel(opt)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>الإعدادات المتقدمة</CardTitle>
                                <CardDescription>التقييم، الوقت، والمحاولات</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            المدة (دقائق)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.timeLimitMinutes || ''}
                                            onChange={e => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Award className="w-4 h-4" />
                                            درجة النجاح
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.passingScore || ''}
                                            onChange={e => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>عدد المحاولات</Label>
                                    <Select
                                        value={String(formData.maxAttempts)}
                                        onValueChange={v => setFormData({ ...formData, maxAttempts: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">محاولة واحدة</SelectItem>
                                            <SelectItem value="2">محاولتين</SelectItem>
                                            <SelectItem value="3">3 محاولات</SelectItem>
                                            <SelectItem value="100">غير محدود</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label>إظهار النتيجة فوراً</Label>
                                        <Switch
                                            checked={formData.showScoreImmediately}
                                            onCheckedChange={c => setFormData({ ...formData, showScoreImmediately: c })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>خلط الأسئلة (Randomize)</Label>
                                        <Switch
                                            checked={formData.shuffleMode === ShuffleMode.QUESTIONS || formData.shuffleMode === ShuffleMode.BOTH}
                                            onCheckedChange={c => setFormData({
                                                ...formData,
                                                shuffleMode: c ? ShuffleMode.QUESTIONS : ShuffleMode.NONE
                                            })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleSaveSettings} disabled={isSaving}>
                                    {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                                    <Save className="w-4 h-4 mr-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions" className="mt-6 space-y-6">
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                        <div className="flex gap-4 text-sm">
                            <div>
                                <span className="font-bold text-lg">{assessment.assessmentQuestions.length}</span>
                                <span className="text-muted-foreground mr-1">سؤال</span>
                            </div>
                            <div>
                                <span className="font-bold text-lg">{assessment.totalPoints}</span>
                                <span className="text-muted-foreground mr-1">درجة</span>
                            </div>
                        </div>
                        <Button onClick={() => setIsPickerOpen(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            إضافة أسئلة
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {assessment.assessmentQuestions
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((aq, index) => (
                                <Card key={aq.id} className="relative group hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4 flex gap-4 items-start">
                                        {/* Sort Controls */}
                                        <div className="flex flex-col gap-1 mt-1">
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6"
                                                disabled={index === 0}
                                                onClick={() => handleMoveQuestion(index, 'up')}
                                            >
                                                <MoveUp className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="h-6 w-6"
                                                disabled={index === assessment.assessmentQuestions.length - 1}
                                                onClick={() => handleMoveQuestion(index, 'down')}
                                            >
                                                <MoveDown className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Question Content */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline">{index + 1}</Badge>
                                                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">{aq.question.type}</Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{aq.overridePoints || aq.question.points} درجة</Badge>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                        onClick={() => handleRemoveQuestion(aq.questionId)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="font-medium text-lg leading-relaxed">{aq.question.questionAr || aq.question.questionEn || aq.question.text}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                        {assessment.assessmentQuestions.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                <List className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>لا توجد أسئلة مضافة بعد</p>
                                <Button variant="link" onClick={() => setIsPickerOpen(true)}>اضغط لإضافة أسئلة</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <QuestionPicker
                open={isPickerOpen}
                onOpenChange={setIsPickerOpen}
                onSelect={handleAddQuestions}
            />
        </div>
    )
}
