"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MoreHorizontal,
    Plus,
    Filter,
    ArrowUpDown,
    BrainCircuit,
    Layers,
    Code,
    Loader2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { QuestionFormValues, SubjectEnum, EducationalStageEnum } from "@/lib/schemas/question"
import { QuestionEditor } from "@/components/questions/question-editor"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function QuestionBankPage() {
    const { accessToken } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
    const [filterSubject, setFilterSubject] = useState<string>("all")
    const [filterGrade, setFilterGrade] = useState<string>("all")

    // Core Data State
    const [questions, setQuestions] = useState<Partial<QuestionFormValues>[]>([])
    const [loading, setLoading] = useState(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    // Fetch questions from API
    useEffect(() => {
        const fetchQuestions = async () => {
            if (!accessToken) {
                setLoading(false)
                return
            }

            try {
                const response = await fetch(`${apiUrl}/questions`, {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                })

                if (response.ok) {
                    const data = await response.json()
                    if (data.data) {
                        // Map backend response to frontend format
                        const mappedQuestions = data.data.map((q: any) => ({
                            id: q.id,
                            text: q.questionAr || q.questionEn || q.text || "نص السؤال غير متوفر",
                            type: q.type,
                            difficulty: q.difficulty,
                            taxonomy: q.taxonomy,
                            tags: q.tags || [],
                            subject: q.subject,
                            grade: q.grade,
                            points: q.points,
                        }))
                        setQuestions(mappedQuestions)
                    }
                } else {
                    toast.error("فشل في تحميل الأسئلة")
                }
            } catch (error) {
                console.error("Failed to fetch questions:", error)
                toast.error("فشل في الاتصال بالخادم")
            } finally {
                setLoading(false)
            }
        }

        fetchQuestions()
    }, [accessToken, apiUrl])

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<QuestionFormValues | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleSaveQuestion = async (data: QuestionFormValues) => {
        if (!accessToken) {
            toast.error("غير مصرح لك بهذا الإجراء")
            return
        }

        try {
            const payload: any = {
                questionAr: data.text,
                questionEn: data.text, // Fallback for now since UI is single lang
                type: data.type,
                difficulty: data.difficulty,
                grade: data.grade || 'primary', // Default if missing
                subject: data.subject || 'general', // Default if missing
                tags: data.tags || [],
                points: data.points,
            }

            // Map answers to options if MCQ
            if (data.type === 'mcq' && data.answers?.length) {
                payload.options = data.answers.map(a => ({
                    id: a.id,
                    textAr: a.text || ' ', // Ensure not empty
                    textEn: a.text || ' ',
                    isCorrect: a.isCorrect
                }))
            } else if (data.answers?.length) {
                // For True/False or others using answers array but different backend structure if needed
                // For now, mapping to options handles most cases or answerData
                payload.answerData = { answers: data.answers }
            }

            // Determine URL and Method
            const url = editingQuestion
                ? `${apiUrl}/questions/${editingQuestion.id}`
                : `${apiUrl}/questions`;
            const method = editingQuestion ? 'PUT' : 'POST';

            console.log("Sending payload:", payload);

            const response = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            const responseText = await response.text();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch (e) {
                console.error("Failed to parse error response:", responseText);
                result = { message: `Server Error: ${response.status} ${response.statusText}` };
            }

            if (response.ok) {
                const savedQuestion = { ...data, id: result.data?.id || result.id || (editingQuestion ? editingQuestion.id : undefined) }
                if (method === 'POST') {
                    setQuestions(prev => [savedQuestion, ...prev])
                    toast.success("تم إضافة السؤال بنجاح")
                } else {
                    setQuestions(prev => prev.map(q => q.id === savedQuestion.id ? savedQuestion : q))
                    toast.success("تم تعديل السؤال بنجاح")
                }

                setIsEditorOpen(false)
                setEditingQuestion(null)
            } else {
                console.error("Creation error details:", result);
                const msg = Array.isArray(result.message) ? result.message[0] : (result.message || "فشل إضافة السؤال");
                toast.error(msg);
            }

            setIsEditorOpen(false)
            setEditingQuestion(null)
        } catch (error) {
            console.error("Error saving question:", error)
            toast.error("حدث خطأ أثناء حفظ السؤال")
        }
    }

    const handleCreateNew = () => {
        setEditingQuestion(null)
        setIsEditorOpen(true)
    }

    const handleEdit = (question: any) => {
        setEditingQuestion(question)
        setIsEditorOpen(true)
    }

    const handleDeleteClick = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId || !accessToken) return

        try {
            const response = await fetch(`${apiUrl}/questions/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            if (response.ok) {
                setQuestions(prev => prev.filter(q => q.id !== deleteId))
                toast.success("تم حذف السؤال بنجاح")
            } else {
                const error = await response.json()
                toast.error(error.message || "فشل حذف السؤال")
            }
        } catch (error) {
            console.error("Error deleting question:", error)
            toast.error("حدث خطأ أثناء حذف السؤال")
        } finally {
            setDeleteId(null)
        }
    }



    // Simple Filtering Logic
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesType = filterType === "all" || q.type === filterType
        const matchesDifficulty = filterDifficulty === "all" || q.difficulty === filterDifficulty
        const matchesSubject = filterSubject === "all" || q.subject === filterSubject
        const matchesGrade = filterGrade === "all" || q.grade === filterGrade

        return matchesSearch && matchesType && matchesDifficulty && matchesSubject && matchesGrade
    })

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'hard': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'expert': return 'bg-purple-100 text-purple-700 border-purple-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getDifficultyLabel = (diff: string) => {
        const map: Record<string, string> = {
            easy: "سهل",
            medium: "متوسط",
            hard: "صعب",
            expert: "خبير"
        }
        return map[diff] || diff
    }

    const getTaxonomyLabel = (tax: string) => {
        const map: Record<string, string> = {
            remember: "تذكر",
            understand: "فهم",
            apply: "تطبيق",
            analyze: "تحليل",
            evaluate: "تقييم",
            create: "ابتكار"
        }
        return map[tax] || tax
    }

    const getTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            mcq: "اختيار من متعدد",
            true_false: "صح أو خطأ",
            short_answer: "إجابة قصيرة"
        }
        return map[type] || type
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
            primary: "الابتدائية",
            preparatory: "الإعدادية",
            secondary: "الثانوية",
            university: "الجامعية"
        }
        return labels[grade] || grade
    }

    const getTaxonomyIcon = (tax: string) => {
        switch (tax) {
            case 'remember': return <Layers className="w-3 h-3" />
            case 'create': return <BrainCircuit className="w-3 h-3" />
            case 'analyze': return <Code className="w-3 h-3" />
            default: return null
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo">بنك الأسئلة</h2>
                    <p className="text-muted-foreground">المخزن المركزي للأسئلة المصنفة حسب المعايير التعليمية</p>
                </div>
                <Button className="gap-2" variant="emerald" onClick={handleCreateNew}>
                    <Plus className="h-4 w-4" />
                    إضافة سؤال جديد
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في نص السؤال أو الوسوم..."
                        className="pr-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="المادة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المواد</SelectItem>
                            {SubjectEnum.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{getSubjectLabel(opt)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterGrade} onValueChange={setFilterGrade}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المراحل</SelectItem>
                            {EducationalStageEnum.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{getGradeLabel(opt)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="نوع السؤال" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الأنواع</SelectItem>
                            <SelectItem value="mcq">اختيار من متعدد</SelectItem>
                            <SelectItem value="true_false">صح أو خطأ</SelectItem>
                            <SelectItem value="short_answer">إجابة قصيرة</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="الصعوبة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المستويات</SelectItem>
                            <SelectItem value="easy">سهل</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="hard">صعب</SelectItem>
                            <SelectItem value="expert">خبير</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-right">#</TableHead>
                            <TableHead className="text-right w-[40%]">نص السؤال</TableHead>
                            <TableHead className="text-right">المادة الدراسية</TableHead>
                            <TableHead className="text-right">المرحلة</TableHead>
                            <TableHead className="text-right">الصعوبة</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{q.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium line-clamp-2" title={q.text}>{q.text}</div>
                                    <div className="flex gap-1 mt-1">
                                        {q.tags?.map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] items-center px-1 py-0 h-5">
                                                # {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {q.subject ? (
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-normal">
                                            {getSubjectLabel(q.subject)}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {q.grade ? (
                                        <span className="text-sm text-slate-600">
                                            {getGradeLabel(q.grade)}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border ${getDifficultyColor(q.difficulty as string)}`}>
                                        {getDifficultyLabel(q.difficulty as string)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{getTypeLabel(q.type as string)}</span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEdit(q)}>تعديل</DropdownMenuItem>

                                            <DropdownMenuItem className="text-destructive" onClick={() => q.id && handleDeleteClick(q.id)}>حذف</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    لا توجد أسئلة تطابق البحث.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <QuestionEditor
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                question={editingQuestion}
                onSave={handleSaveQuestion}
            />

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد الحذف</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من رغبتك في حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>إلغاء</Button>
                        <Button variant="destructive" onClick={confirmDelete}>حذف نهائي</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
