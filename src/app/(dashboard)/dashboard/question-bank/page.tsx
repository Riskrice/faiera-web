"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import {
    Search,
    MoreHorizontal,
    Plus,
    ArrowUpDown,
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
import {
    QuestionFormValues,
    SubjectEnum,
    EducationalStageEnum,
    EDUCATIONAL_STAGE_LABELS,
    SUBJECT_LABELS,
} from "@/lib/schemas/question"
import { QuestionEditor } from "@/components/questions/question-editor"
import { useAuth } from "@/contexts/auth-context"
import { createQuestion, deleteQuestion, getQuestionFacets, getQuestions, Question, updateQuestion } from "@/lib/api"
import { toast } from "sonner"

interface QuestionRow {
    id: string
    text: string
    type: string
    difficulty: string
    taxonomy: string
    subject?: string
    grade?: string
    tags: string[]
    answers?: QuestionFormValues["answers"]
    points?: number
    usageCount?: number
    correctRate?: number
    createdAt?: string
}

interface FacetItem {
    value: string
    count: number
}

interface QuestionFacetsState {
    types: FacetItem[]
    difficulties: FacetItem[]
    cognitiveLevels: FacetItem[]
    statuses: FacetItem[]
    grades: FacetItem[]
    subjects: FacetItem[]
    topics: FacetItem[]
    subtopics: FacetItem[]
}

const EMPTY_FACETS: QuestionFacetsState = {
    types: [],
    difficulties: [],
    cognitiveLevels: [],
    statuses: [],
    grades: [],
    subjects: [],
    topics: [],
    subtopics: [],
}

export default function QuestionBankPage() {
    const { accessToken } = useAuth()
    const [searchInput, setSearchInput] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterDifficulty, setFilterDifficulty] = useState<string>("all")
    const [filterSubject, setFilterSubject] = useState<string>("all")
    const [filterGrade, setFilterGrade] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"createdAt" | "difficulty" | "usageCount" | "correctRate" | "avgTimeSeconds" | "points">("createdAt")
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

    const [questions, setQuestions] = useState<QuestionRow[]>([])
    const [facets, setFacets] = useState<QuestionFacetsState>(EMPTY_FACETS)
    const [loading, setLoading] = useState(true)
    const [facetsLoading, setFacetsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(50)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim())
            setPage(1)
        }, 350)

        return () => clearTimeout(timer)
    }, [searchInput])

    const queryParams = useMemo(
        () => ({
            search: searchTerm || undefined,
            type: filterType,
            difficulty: filterDifficulty,
            subject: filterSubject,
            grade: filterGrade,
            sortBy,
            sortOrder,
            page,
            pageSize,
        }),
        [searchTerm, filterType, filterDifficulty, filterSubject, filterGrade, sortBy, sortOrder, page, pageSize],
    )

    const mapQuestionAnswers = (q: Question): QuestionFormValues["answers"] | undefined => {
        if (Array.isArray(q.answerData)) {
            return q.answerData.map((answer: any) => ({
                id: String(answer.id ?? crypto.randomUUID()),
                text: String(answer.textAr || answer.textEn || answer.text || ""),
                isCorrect: Boolean(answer.isCorrect),
                explanation: answer.explanation,
            }))
        }

        if (q.type === "true_false") {
            return [
                { id: "true", text: "صحيح", isCorrect: q.correctAnswer === true },
                { id: "false", text: "خاطأ", isCorrect: q.correctAnswer === false },
            ]
        }

        const answers = (q.answerData as any)?.answers
        if (Array.isArray(answers)) {
            return answers.map((answer: any) => ({
                id: String(answer.id ?? crypto.randomUUID()),
                text: String(answer.text || answer.textAr || answer.textEn || ""),
                isCorrect: Boolean(answer.isCorrect),
                explanation: answer.explanation,
            }))
        }

        return undefined
    }

    const mapQuestion = (q: Question): QuestionRow => ({
        id: q.id,
        text: q.questionAr || q.questionEn || q.text || "نص السؤال غير متوفر",
        type: q.type || "-",
        difficulty: q.difficulty || "medium",
        taxonomy: q.cognitiveLevel || q.taxonomy || "understand",
        tags: q.tags || [],
        subject: q.subject,
        grade: q.grade,
        points: q.points,
        usageCount: q.usageCount,
        correctRate: q.correctRate,
        createdAt: q.createdAt,
        answers: mapQuestionAnswers(q),
    })

    const fetchQuestionsAndFacets = async () => {
        if (!accessToken) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setFacetsLoading(true)
            setErrorMessage(null)

            const [questionsResponse, facetsResponse] = await Promise.all([
                getQuestions(queryParams),
                getQuestionFacets({
                    search: queryParams.search,
                    type: queryParams.type,
                    difficulty: queryParams.difficulty,
                    subject: queryParams.subject,
                    grade: queryParams.grade,
                }),
            ])

            const mappedQuestions = (questionsResponse.data || []).map(mapQuestion)
            setQuestions(mappedQuestions)

            const pagination = questionsResponse.pagination || questionsResponse.meta || {}
            const nextTotal = Number(pagination.total || 0)
            const nextPageSize = Number(pagination.pageSize || pageSize)
            const nextPage = Number(pagination.page || page)
            const nextTotalPages = Number(
                pagination.totalPages || (nextPageSize > 0 ? Math.max(1, Math.ceil(nextTotal / nextPageSize)) : 1),
            )

            setTotal(nextTotal)
            setTotalPages(nextTotalPages)
            setPage(nextPage)
            setFacets(facetsResponse.data || EMPTY_FACETS)
        } catch (error) {
            console.error("Failed to fetch question bank data:", error)
            setErrorMessage("تعذر تحميل بنك الأسئلة. حاول مرة أخرى.")
            toast.error("فشل في تحميل بيانات بنك الأسئلة")
        } finally {
            setLoading(false)
            setFacetsLoading(false)
        }
    }

    useEffect(() => {
        fetchQuestionsAndFacets()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, queryParams])

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
                cognitiveLevel: data.taxonomy,
                grade: data.grade,
                subject: data.subject,
                tags: data.tags || [],
                points: data.points,
            }

            if (data.type === 'mcq' || data.type === 'mcq_multi') {
                payload.options = (data.answers || []).map(a => ({
                    id: a.id,
                    textAr: a.text || ' ', // Ensure not empty
                    textEn: a.text || ' ',
                    isCorrect: a.isCorrect
                }))
            } else if (data.type === 'true_false') {
                payload.correctAnswer = data.answers?.find(a => a.isCorrect)?.id === "true"
            } else if (data.answers?.length) {
                // For True/False or others using answers array but different backend structure if needed
                // For now, mapping to options handles most cases or answerData
                payload.answerData = { answers: data.answers }
            }

            if (editingQuestion?.id) {
                await updateQuestion(editingQuestion.id, payload)
                toast.success("تم تعديل السؤال بنجاح")
            } else {
                await createQuestion(payload)
                toast.success("تم إضافة السؤال بنجاح")
            }

            if (!editingQuestion?.id) {
                setPage(1)
            }

            await fetchQuestionsAndFacets()

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
            await deleteQuestion(deleteId)
            toast.success("تم حذف السؤال بنجاح")

            const shouldGoPreviousPage = questions.length === 1 && page > 1
            if (shouldGoPreviousPage) {
                setPage(prev => prev - 1)
            } else {
                await fetchQuestionsAndFacets()
            }
        } catch (error) {
            console.error("Error deleting question:", error)
            toast.error("حدث خطأ أثناء حذف السؤال")
        } finally {
            setDeleteId(null)
        }
    }

    const clearFilters = () => {
        setSearchInput("")
        setFilterType("all")
        setFilterDifficulty("all")
        setFilterSubject("all")
        setFilterGrade("all")
        setSortBy("createdAt")
        setSortOrder("DESC")
        setPage(1)
    }

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
            mcq_multi: "اختيار متعدد الإجابات",
            true_false: "صح أو خطأ",
            fill_blank: "أكمل الفراغ",
            matching: "توصيل",
            ordering: "ترتيب",
            short_answer: "إجابة قصيرة",
            essay: "مقالي"
        }
        return map[type] || type
    }

    const getSubjectLabel = (subject: string) => {
        return SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] || subject
    }

    const getGradeLabel = (grade: string) => {
        return EDUCATIONAL_STAGE_LABELS[grade as keyof typeof EDUCATIONAL_STAGE_LABELS] || grade
    }

    const getTypeCount = (value: string) => facets.types.find(item => item.value === value)?.count

    const getDifficultyCount = (value: string) =>
        facets.difficulties.find(item => item.value === value)?.count

    const getSubjectCount = (value: string) => facets.subjects.find(item => item.value === value)?.count

    const getGradeCount = (value: string) => facets.grades.find(item => item.value === value)?.count

    const formatCountLabel = (count?: number) => (typeof count === "number" ? ` (${count})` : "")

    const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1
    const endItem = total === 0 ? 0 : Math.min(page * pageSize, total)

    const canGoPrev = page > 1
    const canGoNext = page < totalPages

    const handlePageSizeChange = (value: string) => {
        const nextSize = Number(value)
        if (Number.isNaN(nextSize)) return
        setPageSize(nextSize)
        setPage(1)
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-6" aria-busy="true" aria-live="polite">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-44" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[420px] w-full" />
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

            {errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert" aria-live="assertive">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-destructive">{errorMessage}</p>
                        <Button variant="outline" size="sm" onClick={fetchQuestionsAndFacets}>
                            إعادة المحاولة
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="بحث في نص السؤال أو الوسوم..."
                        className="pr-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={filterSubject} onValueChange={(value) => {
                        setFilterSubject(value)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="المادة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المواد</SelectItem>
                            {SubjectEnum.options.map(opt => (
                                <SelectItem key={opt} value={opt}>
                                    {getSubjectLabel(opt)}{formatCountLabel(getSubjectCount(opt))}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterGrade} onValueChange={(value) => {
                        setFilterGrade(value)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="المرحلة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المراحل</SelectItem>
                            {EducationalStageEnum.options.map(opt => (
                                <SelectItem key={opt} value={opt}>
                                    {getGradeLabel(opt)}{formatCountLabel(getGradeCount(opt))}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={(value) => {
                        setFilterType(value)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="نوع السؤال" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الأنواع</SelectItem>
                            <SelectItem value="mcq">اختيار من متعدد{formatCountLabel(getTypeCount("mcq"))}</SelectItem>
                            <SelectItem value="mcq_multi">اختيار متعدد الإجابات{formatCountLabel(getTypeCount("mcq_multi"))}</SelectItem>
                            <SelectItem value="true_false">صح أو خطأ{formatCountLabel(getTypeCount("true_false"))}</SelectItem>
                            <SelectItem value="fill_blank">أكمل الفراغ{formatCountLabel(getTypeCount("fill_blank"))}</SelectItem>
                            <SelectItem value="matching">توصيل{formatCountLabel(getTypeCount("matching"))}</SelectItem>
                            <SelectItem value="ordering">ترتيب{formatCountLabel(getTypeCount("ordering"))}</SelectItem>
                            <SelectItem value="short_answer">إجابة قصيرة{formatCountLabel(getTypeCount("short_answer"))}</SelectItem>
                            <SelectItem value="essay">مقالي{formatCountLabel(getTypeCount("essay"))}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterDifficulty} onValueChange={(value) => {
                        setFilterDifficulty(value)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="الصعوبة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل المستويات</SelectItem>
                            <SelectItem value="easy">سهل{formatCountLabel(getDifficultyCount("easy"))}</SelectItem>
                            <SelectItem value="medium">متوسط{formatCountLabel(getDifficultyCount("medium"))}</SelectItem>
                            <SelectItem value="hard">صعب{formatCountLabel(getDifficultyCount("hard"))}</SelectItem>
                            <SelectItem value="expert">خبير{formatCountLabel(getDifficultyCount("expert"))}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="ترتيب حسب" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="createdAt">الأحدث</SelectItem>
                            <SelectItem value="difficulty">الصعوبة</SelectItem>
                            <SelectItem value="usageCount">الأكثر استخدامًا</SelectItem>
                            <SelectItem value="correctRate">نسبة الصحة</SelectItem>
                            <SelectItem value="avgTimeSeconds">الوقت المتوسط</SelectItem>
                            <SelectItem value="points">الدرجات</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            setSortOrder(prev => (prev === "ASC" ? "DESC" : "ASC"))
                            setPage(1)
                        }}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortOrder === "ASC" ? "تصاعدي" : "تنازلي"}
                    </Button>
                    <Button variant="ghost" onClick={clearFilters}>إعادة ضبط</Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground bg-card border rounded-lg px-4 py-3">
                <div>
                    عرض {startItem}-{endItem} من أصل {total} سؤال
                </div>
                <div className="flex items-center gap-2">
                    <span>حجم الصفحة</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[96px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Questions Table (Desktop) */}
            <div className="hidden md:block bg-card rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] text-right">#</TableHead>
                            <TableHead className="text-right w-[40%]">نص السؤال</TableHead>
                            <TableHead className="text-right">المادة الدراسية</TableHead>
                            <TableHead className="text-right">المرحلة</TableHead>
                            <TableHead className="text-right">الصعوبة</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="text-right">التصنيف</TableHead>
                            <TableHead className="text-right">معدل الصحة</TableHead>
                            <TableHead className="text-right">الاستخدام</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.length > 0 ? questions.map((q) => (
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
                                    <Badge variant="secondary" className="font-normal">
                                        {getTaxonomyLabel(q.taxonomy || "understand")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {typeof q.correctRate === "number" ? `${q.correctRate}%` : "-"}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                    {typeof q.usageCount === "number" ? q.usageCount : "-"}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`إجراءات السؤال ${q.id}`}>
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
                                <TableCell colSpan={10} className="h-24">
                                    <EmptyState
                                        icon={Search}
                                        title="لا توجد أسئلة مطابقة"
                                        description="جرّب تعديل معايير البحث أو إعادة ضبط الفلاتر لعرض نتائج أكثر."
                                        action={<Button variant="outline" size="sm" onClick={clearFilters}>إعادة ضبط الفلاتر</Button>}
                                        className="py-2"
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Questions Cards (Mobile) */}
            <div className="md:hidden space-y-3">
                {questions.length > 0 ? questions.map((q) => (
                    <div key={q.id} className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 min-w-0">
                                <p className="font-medium leading-6 break-words">{q.text}</p>
                                <div className="flex flex-wrap gap-1">
                                    {q.tags?.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0.5 h-auto">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="shrink-0" aria-label={`إجراءات السؤال ${q.id}`}>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEdit(q)}>تعديل</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => q.id && handleDeleteClick(q.id)}>حذف</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>النوع: {getTypeLabel(q.type as string)}</div>
                            <div>الصعوبة: {getDifficultyLabel(q.difficulty as string)}</div>
                            <div>المادة: {q.subject ? getSubjectLabel(q.subject) : '-'}</div>
                            <div>المرحلة: {q.grade ? getGradeLabel(q.grade) : '-'}</div>
                            <div>التصنيف: {getTaxonomyLabel(q.taxonomy || "understand")}</div>
                            <div>معدل الصحة: {typeof q.correctRate === "number" ? `${q.correctRate}%` : '-'}</div>
                        </div>
                    </div>
                )) : (
                    <div className="rounded-lg border bg-card p-2">
                        <EmptyState
                            icon={Search}
                            title="لا توجد أسئلة مطابقة"
                            description="جرّب تعديل معايير البحث أو إعادة ضبط الفلاتر لعرض نتائج أكثر."
                            action={<Button variant="outline" size="sm" onClick={clearFilters}>إعادة ضبط الفلاتر</Button>}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-2" aria-label="التنقل بين صفحات بنك الأسئلة">
                <Button
                    variant="outline"
                    disabled={!canGoPrev || loading}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                >
                    السابق
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                    صفحة {page} من {totalPages}
                </span>
                <Button
                    variant="outline"
                    disabled={!canGoNext || loading}
                    onClick={() => setPage(prev => prev + 1)}
                >
                    التالي
                </Button>
            </div>

            {facetsLoading ? (
                <div className="text-xs text-muted-foreground" aria-live="polite">يتم تحديث إحصاءات الفلاتر...</div>
            ) : null}

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
