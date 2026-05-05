"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    getAssessment,
    startAttempt,
    getAttempt,
    saveAnswer,
    submitAttempt,
    getUserAttempts,
    Assessment,
    AssessmentAttempt,
    Question,
    SubmitAnswerPayload
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Clock, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft } from "lucide-react"

export default function AssessmentTakerPage() {
    const params = useParams()
    const router = useRouter()
    const assessmentId = params.id as string

    // Data State
    const [assessment, setAssessment] = useState<Assessment | null>(null)
    const [activeAttempt, setActiveAttempt] = useState<AssessmentAttempt | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])

    // UI State
    const [isLoading, setIsLoading] = useState(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, SubmitAnswerPayload>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | null>(null) // in seconds

    // Initial Fetch
    useEffect(() => {
        async function init() {
            try {
                // 1. Fetch Assessment
                const res = await getAssessment(assessmentId)
                setAssessment(res.data)

                // 2. Check for active attempts
                const attemptsRes = await getUserAttempts(assessmentId)
                const inProgress = attemptsRes.data.find(a => a.status === 'in_progress')

                if (inProgress) {
                    await resumeAttempt(inProgress.id)
                }
            } catch (error) {
                console.error(error)
                toast.error("فشل تحميل البيانات")
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [assessmentId])

    // Timer Logic
    useEffect(() => {
        if (!activeAttempt || !assessment?.timeLimitMinutes || activeAttempt.status !== 'in_progress') return

        const startTime = new Date(activeAttempt.startedAt).getTime()
        const endTime = startTime + (assessment.timeLimitMinutes * 60 * 1000)

        const timer = setInterval(() => {
            const now = Date.now()
            const diff = Math.floor((endTime - now) / 1000)

            if (diff <= 0) {
                setTimeLeft(0)
                clearInterval(timer)
                handleSubmitAttempt(false) // Auto submit
            } else {
                setTimeLeft(diff)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [activeAttempt, assessment])

    const resumeAttempt = async (attemptId: string) => {
        try {
            const res = await getAttempt(attemptId)
            setActiveAttempt(res.data.attempt)
            setQuestions(res.data.questions)

            // Rehydrate answers
            const initialAnswers: Record<string, SubmitAnswerPayload> = {}
            res.data.attempt.answers?.forEach(ans => {
                initialAnswers[ans.questionId] = {
                    textAnswer: ans.textAnswer,
                    selectedOptions: ans.selectedOptions,
                    orderedItems: ans.orderedItems,
                    matchedPairs: ans.matchedPairs,
                    booleanAnswer: ans.answerData?.booleanAnswer as boolean | undefined,
                    timeSpentSeconds: ans.timeSpentSeconds,
                    flaggedForReview: ans.flaggedForReview,
                }
            })
            setAnswers(initialAnswers)

            toast.info("تم استئناف المحاولة الحالية")
        } catch (error) {
            toast.error("فشل استئناف المحاولة")
        }
    }

    const handleStart = async () => {
        try {
            setIsLoading(true)
            const res = await startAttempt(assessmentId)
            await resumeAttempt(res.data.id)
        } catch (error) {
            toast.error("فشل بدء المحاولة")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAnswerChange = (questionId: string, val: SubmitAnswerPayload) => {
        setAnswers(prev => ({ ...prev, [questionId]: val }))
        // Debounce save? Or save on navigation. For now, we save on navigation.
    }

    const saveCurrentAnswer = async () => {
        if (!activeAttempt || !questions[currentQuestionIndex]) return

        const qId = questions[currentQuestionIndex].id
        const ans = answers[qId]
        if (!ans) return

        try {
            await saveAnswer(activeAttempt.id, qId, ans)
        } catch (error) {
            console.error("Failed to save answer", error)
            // Silent fail or toast? Silent optimal for UX, maybe small indicator
        }
    }

    const handleNext = async () => {
        await saveCurrentAnswer()
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const handlePrev = async () => {
        await saveCurrentAnswer()
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const handleSubmitAttempt = async (confirmBeforeSubmit = true) => {
        if (!activeAttempt) return
        if (confirmBeforeSubmit && !confirm("هل أنت متأكد من تسليم الإجابات؟ لن يمكنك التعديل بعد ذلك.")) return

        await saveCurrentAnswer() // Save last Question
        setIsSubmitting(true)
        try {
            const result = await submitAttempt(activeAttempt.id)
            router.push(`/dashboard/assessments/${assessmentId}/results`)
            toast.success("تم تسليم الاختبار بنجاح!")
            if (result.data.status === "submitted") {
                toast.info("المحاولة بانتظار التصحيح اليدوي")
            }
        } catch (error) {
            toast.error("فشل تسليم الاختبار")
            setIsSubmitting(false)
        }
    }

    // --- Renders ---

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>
    }

    if (!assessment) return <div className="p-8">Assessment not found</div>

    // 1. Intro Screen
    if (!activeAttempt) {
        return (
            <div className="container max-w-2xl py-12">
                <Card>
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-3xl">{assessment.titleAr}</CardTitle>
                        <p className="text-muted-foreground">{assessment.descriptionAr}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <span className="block text-2xl font-bold text-slate-700">{assessment.timeLimitMinutes || '∞'}</span>
                                <span className="text-sm text-slate-500">دقيقة</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <span className="block text-2xl font-bold text-slate-700">{assessment.assessmentQuestions?.length || 0}</span>
                                <span className="text-sm text-slate-500">سؤال</span>
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg flex gap-3 text-yellow-800 text-sm">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p>تنبيه: بمجرد بدء الاختبار، سيبدأ العد التنازلي ولن يمكنك إيقافه. تأكد من استقرار اتصال الإنترنت.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full text-lg py-6" onClick={handleStart}>
                            ابدأ الاختبار الآن
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // 2. Exam Screen
    const currentQuestion = questions[currentQuestionIndex]
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="container py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg hidden md:block">{assessment.titleAr}</h1>
                        <span className="text-sm text-muted-foreground">سؤال {currentQuestionIndex + 1} من {questions.length}</span>
                    </div>

                    {timeLeft !== null && (
                        <div className={`font-mono text-xl font-bold px-4 py-2 rounded-lg flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeLeft)}
                        </div>
                    )}

                    <Button variant={isSubmitting ? "outline" : "emerald"} onClick={() => handleSubmitAttempt()} disabled={isSubmitting}>
                        تسليم الاختبار
                    </Button>
                </div>
                <Progress value={questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0} className="h-1 rounded-none" />
            </header>

            {/* Main Content */}
            <main className="flex-1 container max-w-4xl py-8">
                {currentQuestion && (
                    <Card className="min-h-[400px] flex flex-col">
                        <CardContent className="p-8 flex-1 space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold leading-relaxed">{currentQuestion.questionAr || currentQuestion.questionEn || currentQuestion.text}</h2>
                                {(currentQuestion.type === 'mcq' || currentQuestion.type === 'mcq_multi') && (
                                    <div className="space-y-3 mt-6">
                                        {(currentQuestion.answerData as any[])?.map((opt: any) => {
                                            const selectedOptions = answers[currentQuestion.id]?.selectedOptions || [];
                                            const isSelected = selectedOptions.includes(opt.id);
                                            // Handle textAr/textEn based on locale or just text if normalized
                                            const text = opt.text || opt.textAr || opt.textEn;
                                            return (
                                                <div
                                                    key={opt.id}
                                                    onClick={() => {
                                                        if (currentQuestion.type === 'mcq_multi') {
                                                            const nextSelected = isSelected
                                                                ? selectedOptions.filter(id => id !== opt.id)
                                                                : [...selectedOptions, opt.id]
                                                            handleAnswerChange(currentQuestion.id, { selectedOptions: nextSelected })
                                                            return
                                                        }

                                                        handleAnswerChange(currentQuestion.id, { selectedOptions: [opt.id] })
                                                    }}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3
                                                        ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                        ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                    </div>
                                                    <span className="text-lg">{text}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                {currentQuestion.type === 'true_false' && (
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        {['true', 'false'].map((val) => {
                                            const opt = { id: val, text: val === 'true' ? 'صحيح' : 'خاطأ' };
                                            const booleanValue = val === 'true';
                                            const isSelected = answers[currentQuestion.id]?.booleanAnswer === booleanValue;

                                            return (
                                                <div
                                                    key={val}
                                                    onClick={() => handleAnswerChange(currentQuestion.id, { booleanAnswer: booleanValue })}
                                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2
                                                        ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50'}`}
                                                >
                                                    <span className="text-2xl font-bold">{opt.text || (val === 'true' ? 'صحيح' : 'خاطأ')}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                                    <Textarea
                                        placeholder="اكتب إجابتك هنا..."
                                        className="min-h-[200px] text-lg p-4"
                                        value={answers[currentQuestion.id]?.textAnswer || ''}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })}
                                    />
                                )}
                                {!['mcq', 'mcq_multi', 'true_false', 'short_answer', 'essay'].includes(currentQuestion.type) && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                                        هذا النوع من الأسئلة يحتاج واجهة إجابة متخصصة قبل استخدامه في الاختبارات.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 border-t bg-slate-50 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="gap-2"
                            >
                                <ChevronRight className="w-4 h-4" /> السابق
                            </Button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <Button variant="emerald" onClick={() => handleSubmitAttempt()} className="gap-2 px-8">
                                    <CheckCircle2 className="w-4 h-4" /> تسليم
                                </Button>
                            ) : (
                                <Button onClick={handleNext} className="gap-2 px-8">
                                    التالي <ChevronLeft className="w-4 h-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )}
            </main>
        </div>
    )
}
