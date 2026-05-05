"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Timer, RotateCcw, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Question {
    id: string;
    text: string;
    type: string;
    options: { id: string; text: string }[];
    extraData?: any;
    points: number;
}

interface Assessment {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    passingScore: number;
    questions: Question[];
}

interface QuizPlayerProps {
    assessmentId: string;
    title: string;
    onComplete?: (score: number, passed: boolean) => void;
}

export function QuizPlayer({ assessmentId, title, onComplete }: QuizPlayerProps) {
    const [status, setStatus] = useState<"loading" | "intro" | "active" | "submitting" | "result" | "error">("loading");
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [result, setResult] = useState<{ score: number; passed: boolean; correctCount: number } | null>(null);

    // Fetch Assessment logic
    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const response: any = await api.get(`/assessments/${assessmentId}`);
                const data = response.data || response;

                // Map Backend Entity to Frontend Interface
                const mappedQuestions = (data.assessmentQuestions || []).map((aq: any) => {
                    const q = aq.question;
                    let options: any[] = [];
                    let extraData: any = {};

                    if (q.type === 'mcq' || q.type === 'mcq_multi') {
                        options = (q.options || q.answerData?.options || []).map((opt: any) => ({
                            id: opt.id,
                            text: opt.textAr || opt.textEn
                        }));
                    } else if (q.type === 'true_false') {
                        options = [
                            { id: 'true', text: 'صواب' },
                            { id: 'false', text: 'خطأ' }
                        ];
                    } else if (q.type === 'matching') {
                        extraData.matchingPairs = (q.matchingPairs || q.answerData?.matchingPairs || []).map((m: any) => ({
                            id: m.id || m.leftAr, left: m.leftAr || m.leftEn, right: m.rightAr || m.rightEn
                        }));
                        extraData.shuffledRight = [...extraData.matchingPairs].map((m: any) => m.right).sort(() => Math.random() - 0.5);
                    } else if (q.type === 'ordering') {
                        extraData.orderItems = [...(q.correctOrder || q.answerData?.correctOrder || [])].sort(() => Math.random() - 0.5);
                    } else if (q.type === 'fill_blank') {
                        extraData.blankCount = (q.blankAnswers || q.answerData?.blankAnswers || []).length;
                    }

                    return {
                        id: q.id,
                        text: q.questionAr || q.questionEn,
                        type: q.type,
                        options,
                        extraData,
                        points: aq.overridePoints || q.points || 1
                    };
                });

                setAssessment({
                    id: data.id,
                    title: data.titleAr || data.titleEn || title,
                    description: data.descriptionAr || data.descriptionEn || "اختبار لقياس مستواك.",
                    durationMinutes: data.timeLimitMinutes || 30,
                    passingScore: data.passingScore || 50,
                    questions: mappedQuestions
                });

                // Mocking questions if empty for demo purposes (robustness)
                if (mappedQuestions.length === 0) {
                    setAssessment((prev: any) => ({
                        ...prev,
                        questions: [
                            { id: "q1", text: "ما هو الجسيم المسؤول عن الشحنة السالبة؟", type: "mcq", points: 10, options: [{ id: "o1", text: "البروتون" }, { id: "o2", text: "الإلكترون" }, { id: "o3", text: "النيوترون" }] },
                            { id: "q2", text: "السرعة هي كمية قياسية.", type: "true_false", points: 5, options: [{ id: "true", text: "صح" }, { id: "false", text: "خطأ" }] }
                        ]
                    }));
                }

                setTimeLeft((data.timeLimitMinutes || 30) * 60);
                setStatus("intro");
            } catch (error) {
                console.error("Failed to fetch assessment", error);

                setAssessment({
                    id: assessmentId,
                    title: title,
                    description: "اختبار تجريبي لقياس مستواك.",
                    durationMinutes: 15,
                    passingScore: 50,
                    questions: [
                        { id: "q1", text: "ما وحدة قياس القوة؟", type: "mcq", points: 10, options: [{ id: "opt1", text: "الجول" }, { id: "opt2", text: "النيوتن" }, { id: "opt3", text: "الواط" }] },
                        { id: "q2", text: "سرعة الضوء ثابتة في الفراغ.", type: "true_false", points: 10, options: [{ id: "true", text: "صواب" }, { id: "false", text: "خطأ" }] }
                    ]
                });
                setTimeLeft(15 * 60);
                setStatus("intro");
            }
        };
        fetchAssessment();
    }, [assessmentId, title]);

    // Timer Logic
    useEffect(() => {
        if (status !== "active") return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    const handleStart = () => {
        setStatus("active");
    };

    const handleAnswer = (value: any) => {
        if (!assessment) return;
        setAnswers(prev => ({
            ...prev,
            [assessment.questions[currentQuestionIndex].id]: value
        }));
    };

    const handleNext = () => {
        if (!assessment) return;
        if (currentQuestionIndex < assessment.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!assessment) return;
        setStatus("submitting");

        try {
            const attemptResponse: any = await api.post('/attempts/start', { assessmentId });
            const attempt = attemptResponse.data;

            await Promise.all(
                assessment.questions.map(q => {
                    const studentAnswer = answers[q.id];
                    if (!studentAnswer) return Promise.resolve();

                    let payload: any = { questionId: q.id };
                    if (q.type === 'true_false') {
                        payload.booleanAnswer = studentAnswer === 'true';
                    } else if (q.type === 'mcq' || q.type === 'mcq_multi') {
                        payload.selectedOptions = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
                    } else if (q.type === 'short_answer' || q.type === 'essay') {
                        payload.textAnswer = studentAnswer;
                    } else if (q.type === 'matching') {
                        payload.matchingData = studentAnswer;
                    } else if (q.type === 'ordering') {
                        payload.orderedList = studentAnswer;
                    } else if (q.type === 'fill_blank') {
                        payload.blankAnswers = studentAnswer;
                    }

                    return api.post(`/attempts/${attempt.id}/answers`, payload);
                }),
            );

            const submitResponse: any = await api.post(`/attempts/${attempt.id}/submit`);
            const attemptResult = submitResponse.data;
            const score = Math.round(attemptResult.percentageScore || 0);
            const passed = Boolean(attemptResult.passed);
            const correctCount = Number(attemptResult.correctAnswers || 0);

            setResult({ score, passed, correctCount });
            setStatus("result");

            if (onComplete) onComplete(score, passed);

            toast.success("تم إرسال الاختبار بنجاح");

        } catch (error) {
            toast.error("حدث خطأ أثناء إرسال الاختبار");
            setStatus("active");
        }
    };

    // Format Time: MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-20 h-full bg-muted/10 rounded-xl">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">جاري تحميل الاختبار...</p>
            </div>
        );
    }

    if (status === "intro" && assessment) {
        return (
            <div className="flex items-center justify-center p-4 md:p-8 h-full">
                <Card className="w-full max-w-2xl text-center border-t-4 border-t-primary shadow-lg">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                            <AlertCircle className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold font-cairo text-primary">{assessment.title}</CardTitle>
                        <p className="text-muted-foreground mt-2">{assessment.description}</p>
                    </CardHeader>
                    <CardContent className="grid gap-6 py-6 text-sm md:text-base">
                        <div className="grid grid-cols-3 divide-x divide-x-reverse border rounded-lg py-4 bg-muted/30">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-muted-foreground">عدد الأسئلة</span>
                                <span className="font-bold text-lg">{assessment.questions.length}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-muted-foreground">المدة الزمنية</span>
                                <span className="font-bold text-lg">{assessment.durationMinutes} دقيقة</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-muted-foreground">درجة النجاح</span>
                                <span className="font-bold text-lg">{assessment.passingScore}%</span>
                            </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-right">
                            <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> تعليمات هامة:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                <li>بمجرد البدء، لا يمكنك إيقاف المؤقت.</li>
                                <li>سيتم إرسال الإجابات تلقائياً عند انتهاء الوقت.</li>
                                <li>تأكد من اتصالك بالإنترنت طوال فترة الاختبار.</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" className="w-full font-bold text-lg h-12" onClick={handleStart}>
                            بدء الاختبار الآن
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (status === "result" && result && assessment) {
        return (
            <div className="flex items-center justify-center p-4 md:p-8 h-full animate-in zoom-in duration-300">
                <Card className="w-full max-w-xl text-center shadow-xl border-t-8 border-t-emerald-500 relative overflow-hidden">
                    <div className={cn("absolute inset-0 opacity-10 pointer-events-none", result.passed ? "bg-emerald-500" : "bg-red-500")} />
                    <CardHeader className="pt-8 pb-2">
                        <div className={cn(
                            "mx-auto p-4 rounded-full w-fit mb-4 border-4",
                            result.passed ? "bg-emerald-100 border-emerald-200" : "bg-red-100 border-red-200"
                        )}>
                            {result.passed ? (
                                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                            ) : (
                                <XCircle className="w-12 h-12 text-red-600" />
                            )}
                        </div>
                        <CardTitle className="text-3xl font-black font-cairo">
                            {result.passed ? "مبروك! لقد اجتزت الاختبار" : "للأسف، لم تنجح هذه المرة"}
                        </CardTitle>
                        <p className="text-muted-foreground mt-2">
                            {result.passed ? "أداء ممتاز، يمكنك الانتقال للدرس التالي." : "حاول مراجعة المحتوى وإعادة المحاولة."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                        <div className="flex items-center justify-center">
                            <div className="relative w-40 h-40">
                                {/* Simple CSS Ring or just big text */}
                                <div className={cn(
                                    "w-full h-full rounded-full border-8 flex items-center justify-center bg-card shadow-inner",
                                    result.passed ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"
                                )}>
                                    <div>
                                        <div className="text-4xl font-black font-numeric">{result.score}%</div>
                                        <div className="text-sm font-medium text-muted-foreground mt-1">النتيجة النهائية</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-muted p-3 rounded-lg flex flex-col items-center">
                                <span className="text-muted-foreground">الإجابات الصحيحة</span>
                                <span className={cn("font-bold text-lg", result.passed ? "text-emerald-600" : "text-foreground")}>
                                    {result.correctCount} / {assessment.questions.length}
                                </span>
                            </div>
                            <div className="bg-muted p-3 rounded-lg flex flex-col items-center">
                                <span className="text-muted-foreground">الحالة</span>
                                <span className={cn("font-bold text-lg", result.passed ? "text-emerald-600" : "text-red-500")}>
                                    {result.passed ? "ناجح" : "راسوب"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        {!result.passed && (
                            <Button variant="outline" className="w-full gap-2" onClick={() => {
                                setStatus("intro");
                                setCurrentQuestionIndex(0);
                                setAnswers({});
                                setTimeLeft((assessment.durationMinutes || 30) * 60);
                            }}>
                                <RotateCcw className="w-4 h-4" />
                                إعادة المحاولة
                            </Button>
                        )}
                        <Button className="w-full" asChild>
                            <a href="/courses">العودة للكورسات</a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if ((status === "active" || status === "submitting") && assessment) {
        const question = assessment.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

        return (
            <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-6">
                {/* Header: Timer & Progress */}
                <div className="flex items-center justify-between mb-6 bg-card border px-4 py-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4 text-primary font-bold font-mono text-xl">
                        <Timer className={cn("w-5 h-5", timeLeft < 60 && "text-red-500 animate-pulse")} />
                        <span className={cn(timeLeft < 60 && "text-red-500")}>{formatTime(timeLeft)}</span>
                    </div>
                    <div className="flex-1 mx-6 flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>السؤال {currentQuestionIndex + 1} من {assessment.questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleSubmit()}>
                        إنهاء
                    </Button>
                </div>

                {/* Question Area */}
                <div className="flex-1 flex flex-col justify-center">
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <h2 className="text-xl md:text-2xl font-bold leading-relaxed font-cairo text-foreground">
                                {question.text}
                            </h2>
                        </CardHeader>
                        <CardContent className="px-0 py-6">
                            {(question.type === 'mcq' || question.type === 'true_false') && (
                            <RadioGroup
                                value={answers[question.id] || ""}
                                onValueChange={handleAnswer}
                                className="space-y-3"
                            >
                                {question.options?.map((option) => {
                                    const isSelected = answers[question.id] === option.id;
                                    return (
                                        <div key={option.id} className={cn(
                                            "relative flex items-center space-x-2 space-x-reverse rounded-xl border-2 p-4 transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/50",
                                            isSelected ? "border-primary bg-primary/5" : "border-transparent bg-card shadow-sm"
                                        )}>
                                            <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                                            <Label htmlFor={option.id} className="flex-1 flex items-center gap-3 cursor-pointer">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0",
                                                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                                )}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                </div>
                                                <span className="text-lg font-medium">{option.text}</span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                            )}

                            {(question.type === 'short_answer' || question.type === 'essay') && (
                                <textarea
                                    className="w-full min-h-[150px] p-4 text-lg border-2 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="اكتب إجابتك هنا..."
                                    value={answers[question.id] || ""}
                                    onChange={(e) => handleAnswer(e.target.value)}
                                />
                            )}

                            {question.type === 'fill_blank' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground whitespace-pre-line text-lg mb-4 bg-muted/20 p-4 rounded-lg">{(question.text || "").replace(/\[blank\]/g, ' ________ ')}</p>
                                    <div className="grid gap-3">
                                        {Array.from({ length: Math.max(1, question.extraData?.blankCount || (question.text.match(/\[blank\]/g) || []).length) }).map((_, i) => {
                                            const currentAns = answers[question.id] || [];
                                            return (
                                                <div key={i} className="flex items-center gap-3">
                                                    <span className="font-bold text-muted-foreground shrink-0 w-16">فراغ {i + 1}:</span>
                                                    <input
                                                        type="text"
                                                        className="flex-1 p-3 border-2 rounded-lg focus:border-primary focus:outline-none"
                                                        placeholder="أدخل الكلمة المناسبة"
                                                        value={currentAns[i] || ""}
                                                        onChange={(e) => {
                                                            const newArr = [...currentAns];
                                                            newArr[i] = e.target.value;
                                                            handleAnswer(newArr);
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {question.type === 'matching' && (
                                <div className="grid gap-4">
                                    {(question.extraData?.matchingPairs || []).map((m: any, i: number) => {
                                        const currentAns = answers[question.id] || {};
                                        return (
                                            <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-muted/10 items-center">
                                                <div className="flex-1 p-3 font-medium bg-card border rounded-lg text-center w-full shadow-sm">
                                                    {m.left}
                                                </div>
                                                <div className="text-muted-foreground hidden md:block">يُطابق ←</div>
                                                <select
                                                    className="flex-1 p-3 border-2 rounded-lg focus:border-primary w-full bg-card shadow-sm cursor-pointer"
                                                    value={currentAns[m.left] || ""}
                                                    onChange={(e) => {
                                                        handleAnswer({ ...currentAns, [m.left]: e.target.value });
                                                    }}
                                                >
                                                    <option value="">اختر الإجابة المناسبة الموازية</option>
                                                    {(question.extraData?.shuffledRight || []).map((rightTxt: string, rI: number) => (
                                                        <option key={rI} value={rightTxt}>{rightTxt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {question.type === 'ordering' && (
                                <div className="space-y-3">
                                    {(answers[question.id] || question.extraData?.orderItems || []).map((item: string, i: number, arr: string[]) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border-2 rounded-xl bg-card hover:bg-muted/10 transition-colors">
                                            <div className="flex flex-col gap-1 w-10 shrink-0">
                                                <button
                                                    disabled={i === 0}
                                                    onClick={() => {
                                                        const copy = [...arr];
                                                        [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                                                        handleAnswer(copy);
                                                    }}
                                                    className="p-1 bg-muted rounded disabled:opacity-30 hover:bg-primary/20 transition-colors"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    disabled={i === arr.length - 1}
                                                    onClick={() => {
                                                        const copy = [...arr];
                                                        [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                                                        handleAnswer(copy);
                                                    }}
                                                    className="p-1 bg-muted rounded disabled:opacity-30 hover:bg-primary/20 transition-colors"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-numeric border border-primary/20">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium text-lg flex-1">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Bar */}
                <div className="mt-auto pt-6 border-t flex justify-between items-center bg-background/95 backdrop-blur py-4 sticky bottom-0">
                    <Button
                        variant="outline"
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0 || status === "submitting"}
                        className="gap-2"
                    >
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" /> السابق
                    </Button>

                    {currentQuestionIndex === assessment.questions.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={status === "submitting"}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 min-w-[140px]"
                        >
                            {status === "submitting" ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال
                                </>
                            ) : (
                                <>
                                    إرسال الإجابات <CheckCircle2 className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={status === "submitting"} // Allow skip even if not answered? Assuming yes for navigation
                            className="gap-2 px-8"
                        >
                            التالي <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return null; // Fallback
}
