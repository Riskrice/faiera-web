"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
    Search,
    Filter,
    Plus,
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { QuestionFormValues, SubjectEnum, EducationalStageEnum } from "@/lib/schemas/question"

// Mock Data (Reused for consistency)
const MOCK_QUESTIONS: Partial<QuestionFormValues>[] = [
    {
        id: "Q-101",
        text: "ما هو الفرق الرئيسي بين useMemo و useCallback في React؟",
        type: "mcq",
        difficulty: "hard",
        taxonomy: "analyze",
        tags: ["React", "Hooks", "Performance"],
        subject: "computer_science",
        grade: "university",
        points: 5
    },
    {
        id: "Q-102",
        text: "يقوم القلب بضخ الدم إلى جميع أجزاء الجسم عبر الشرايين.",
        type: "true_false",
        difficulty: "easy",
        taxonomy: "remember",
        tags: ["Circulatory System", "Organs"],
        subject: "biology",
        grade: "secondary",
        points: 1
    },
    {
        id: "Q-103",
        text: "احسب مساحة دائرة نصف قطرها 5 سم.",
        type: "short_answer",
        difficulty: "medium",
        taxonomy: "apply",
        tags: ["Geometry", "Math"],
        subject: "math",
        grade: "preparatory",
        points: 3
    },
    {
        id: "Q-104",
        text: "أي من الوسوم التالية يستخدم لتعريف قائمة غير مرتبة؟",
        type: "mcq",
        difficulty: "easy",
        taxonomy: "remember",
        tags: ["HTML", "Semantics"],
        grade: "secondary",
        points: 2
    },
    {
        id: "Q-105",
        text: "اشرح مفهوم الـ Server-Side Rendering (SSR) ومميزاته.",
        type: "short_answer",
        difficulty: "expert",
        taxonomy: "evaluate",
        tags: ["Next.js", "Architecture"],
        subject: "computer_science",
        grade: "university",
        points: 8
    }
]

// Mock data removed

interface QuestionPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (questions: Partial<QuestionFormValues>[]) => void
}

export function QuestionPicker({ open, onOpenChange, onSelect }: QuestionPickerProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filterSubject, setFilterSubject] = useState<string>("all")
    const [filterGrade, setFilterGrade] = useState<string>("all")
    const [questions, setQuestions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Fetch questions from API
    useEffect(() => {
        if (open) {
            fetchQuestions()
        }
    }, [open, searchTerm, filterSubject, filterGrade])

    const fetchQuestions = async () => {
        // Debounce could be added here, but for now direct call on effect change (search triggers re-fetch)
        // Ideally use useDebounce for search term
        setIsLoading(true)
        try {
            // Dynamic import to avoid circular dependency issues if any
            const { getQuestions } = await import("@/lib/api")
            const res = await getQuestions({
                search: searchTerm,
                subject: filterSubject,
                grade: filterGrade,
                limit: 50
            })
            setQuestions(res.data)
        } catch (error) {
            console.error("Failed to fetch questions", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Debounce search effect (optional, simplified here by relying on effect)

    const handleToggleSelect = (id: string | undefined) => {
        if (!id) return
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const handleConfirm = () => {
        const selectedQuestions = questions.filter(q => q.id && selectedIds.includes(q.id))
        onSelect(selectedQuestions)
        onOpenChange(false)
        setSelectedIds([])
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

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'hard': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'expert': return 'bg-purple-100 text-purple-700 border-purple-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl max-h-[85vh] flex flex-col"
            >
                <DialogHeader>
                    <DialogTitle>اختيار أسئلة من البنك</DialogTitle>
                    <DialogDescription>
                        ابحث واختر الأسئلة التي تريد إضافتها للاختبار.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث في الأسئلة..."
                                className="pr-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                    }
                                }}
                            />
                        </div>
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
                    </div>

                    {/* Table */}
                    <div className="border rounded-md overflow-hidden flex-1 overflow-y-auto min-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIds.length === questions.length && questions.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedIds(questions.map(q => q.id!).filter(Boolean))
                                                } else {
                                                    setSelectedIds([])
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">نص السؤال</TableHead>
                                    <TableHead className="text-right">المادة</TableHead>
                                    <TableHead className="text-right">المستوى</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            جاري التحميل...
                                        </TableCell>
                                    </TableRow>
                                ) : questions.length > 0 ? questions.map((q) => (
                                    <TableRow key={q.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={q.id ? selectedIds.includes(q.id) : false}
                                                onCheckedChange={() => handleToggleSelect(q.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium line-clamp-2" title={q.questionAr || q.questionEn || q.text}>{q.questionAr || q.questionEn || q.text || "نص السؤال غير متوفر"}</div>
                                            <div className="flex gap-1 mt-1">
                                                {q.tags?.map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-[10px] px-1 h-5">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {getSubjectLabel(q.subject || "")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`border ${getDifficultyColor(q.difficulty || "")}`}>
                                                {q.difficulty}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {q.type}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            لا توجد أسئلة تطابق البحث.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <div className="flex-1 flex items-center text-sm text-muted-foreground">
                        تم اختيار {selectedIds.length} سؤال
                    </div>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button type="button" variant="default" onClick={handleConfirm} disabled={selectedIds.length === 0} className="gap-2">
                        <Plus className="w-4 h-4" />
                        إضافة المحددة ({selectedIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
