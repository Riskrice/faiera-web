"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Plus,
    Trash2,
    Check,
    HelpCircle,
    Copy,
    Save,
    Tag,
    AlertCircle,
    AlignLeft,
    ListChecks,
    Target,
    BookOpen,
    GraduationCap, // New Icon
    Book // New Icon
} from "lucide-react"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    questionSchema,
    QuestionFormValues,
    QuestionTypeEnum,
    DifficultyEnum,
    BloomTaxonomyEnum,
    EducationalStageEnum, // New
    SubjectEnum, // New
    defaultQuestionValues
} from "@/lib/schemas/question"
import { cn } from "@/lib/utils"

interface QuestionEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    question?: QuestionFormValues | null
    onSave: (question: QuestionFormValues) => void
}

export function QuestionEditor({
    open,
    onOpenChange,
    question,
    onSave
}: QuestionEditorProps) {
    const form = useForm<QuestionFormValues>({
        resolver: zodResolver(questionSchema) as any,
        defaultValues: defaultQuestionValues,
        mode: "onChange"
    })

    // Reset form when dialog opens or question changes
    useEffect(() => {
        if (open) {
            form.reset({
                ...defaultQuestionValues,
                ...(question || {})
            })
        }
    }, [open, question, form])

    const { fields: answers, append, remove } = useFieldArray({
        control: form.control,
        name: "answers"
    })

    // Watch question type to dynamically render answer fields
    const questionType = form.watch("type")

    const onSubmit = (data: QuestionFormValues) => {
        onSave(data)
        onOpenChange(false)
    }

    // Helper for Bloom's Taxonomy Labels
    // FIXED: Removed English labels as requested
    const getTaxonomyLabel = (level: string) => {
        const map: Record<string, string> = {
            remember: "تذكر",
            understand: "فهم",
            apply: "تطبيق",
            analyze: "تحليل",
            evaluate: "تقييم",
            create: "ابتكار"
        }
        return map[level] || level
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl">
                {/* Header with nice gradient/bg */}
                {/* Header with premium glass-like feel */}
                <DialogHeader className="p-6 pb-6 bg-gradient-to-r from-emerald-50 via-white to-white border-b sticky top-0 z-20 backdrop-blur-sm bg-opacity-95">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100/50 rounded-2xl border border-emerald-100 shadow-sm">
                                <BookOpen className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <DialogTitle className="font-cairo text-2xl text-slate-800 font-bold tracking-tight">
                                    {question ? "تعديل السؤال" : "إضافة سؤال جديد"}
                                </DialogTitle>
                                <DialogDescription className="text-base text-slate-500 font-medium mt-1">
                                    منشئ الأسئلة الذكي المتوافق مع المعايير
                                </DialogDescription>
                            </div>
                        </div>
                        {/* Optional: Add a subtle badge or indicator here */}
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden bg-slate-50/30">

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

                            {/* 0. Academic Context Card (New) */}
                            <section className="space-y-4">
                                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-6 text-indigo-700">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="font-bold text-lg">السياق الأكاديمي</span>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6 hover:border-emerald-200 transition-colors">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="grade"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-600 font-semibold mb-2 block">المرحلة الدراسية</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white border-slate-200 h-11 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm">
                                                                    <SelectValue placeholder="اختر المرحلة الدراسية" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {EducationalStageEnum.options.map((option) => (
                                                                    <SelectItem key={option} value={option} className="cursor-pointer focus:bg-indigo-50 focus:text-indigo-700">
                                                                        {(() => {
                                                                            const labels: Record<string, string> = {
                                                                                primary: "المرحلة الابتدائية",
                                                                                preparatory: "المرحلة الإعدادية",
                                                                                secondary: "المرحلة الثانوية",
                                                                                university: "المرحلة الجامعية"
                                                                            }
                                                                            return labels[option] || option
                                                                        })()}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="subject"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-slate-600 font-semibold mb-2 block">المادة الدراسية</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white border-slate-200 h-11 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm">
                                                                    <SelectValue placeholder="اختر المادة العلمية" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {SubjectEnum.options.map((option) => (
                                                                    <SelectItem key={option} value={option} className="cursor-pointer focus:bg-indigo-50 focus:text-indigo-700">
                                                                        {(() => {
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
                                                                            return labels[option] || option
                                                                        })()}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 1. Main Question Card */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <BookOpen className="w-4 h-4 text-emerald-500" />
                                    <span>تفاصيل السؤال</span>
                                </div>

                                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6 hover:border-emerald-200 transition-colors">
                                    {/* Question Type & Difficulty Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-600">نوع السؤال</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-emerald-500">
                                                                <SelectValue placeholder="اختر النوع" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {QuestionTypeEnum.options.map((option) => (
                                                                <SelectItem key={option} value={option} className="cursor-pointer">
                                                                    <span className="capitalize font-medium">{option.replace("_", " ")}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="difficulty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-slate-600">مستوى الصعوبة</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-emerald-500">
                                                                <SelectValue placeholder="اختر الصعوبة" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {DifficultyEnum.options.map((option) => (
                                                                <SelectItem key={option} value={option} className="cursor-pointer">
                                                                    <span className="capitalize">{option}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Question Text */}
                                    <FormField
                                        control={form.control}
                                        name="text"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-600">نص السؤال</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="أدخل نص السؤال هنا بوضوح..."
                                                        className="min-h-[140px] resize-none text-lg leading-relaxed bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 placeholder:text-slate-400"
                                                        {...field}
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            {/* 3. Answers Logic Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <ListChecks className="w-4 h-4 text-purple-500" />
                                        <span>إجابات السؤال</span>
                                    </div>

                                    {questionType === "mcq" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            onClick={() => append({ id: crypto.randomUUID(), text: "", isCorrect: false })}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> إضافة خيار جديد
                                        </Button>
                                    )}
                                </div>

                                <div className="bg-white p-1 rounded-xl">
                                    {/* MCQ Layout */}
                                    {questionType === "mcq" && (
                                        <div className="space-y-2">
                                            {answers.map((answer, index) => (
                                                <div key={answer.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="pt-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`answers.${index}.isCorrect`}
                                                            render={({ field }) => (
                                                                <FormItem className="space-y-0">
                                                                    <FormControl>
                                                                        <div className="relative flex items-center justify-center w-6 h-6">
                                                                            <input
                                                                                type="radio"
                                                                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-full checked:border-emerald-500 checked:bg-emerald-500 cursor-pointer transition-all"
                                                                                checked={field.value}
                                                                                onChange={() => {
                                                                                    // Reset others and set this one
                                                                                    answers.forEach((_, i) => form.setValue(`answers.${i}.isCorrect`, i === index))
                                                                                }}
                                                                            />
                                                                            <div className="absolute inset-0 hidden peer-checked:flex items-center justify-center pointer-events-none">
                                                                                <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                                                                            </div>
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="flex-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`answers.${index}.text`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder={`نص الخيار ${index + 1}...`}
                                                                            {...field}
                                                                            className={cn(
                                                                                "bg-transparent border-none shadow-none focus-visible:ring-0 px-0 h-auto py-2 text-sm font-medium placeholder:font-normal",
                                                                                form.watch(`answers.${index}.isCorrect`) ? "text-emerald-700 font-bold" : "text-slate-700"
                                                                            )}
                                                                            value={field.value || ""}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {form.formState.errors.answers && (
                                                <p className="text-sm text-red-500 flex items-center gap-1 px-2">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {form.formState.errors.answers.message || "يرجى التحقق من الخيارات"}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* True/False Layout */}
                                    {questionType === "true_false" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {["true", "false"].map((val, idx) => (
                                                <div
                                                    key={val}
                                                    onClick={() => {
                                                        if (answers.length < 2) {
                                                            form.setValue("answers", [
                                                                { id: "1", text: "صحيح", isCorrect: val === "true" },
                                                                { id: "2", text: "خاطأ", isCorrect: val === "false" }
                                                            ])
                                                        } else {
                                                            form.setValue(`answers.0.text`, "صحيح")
                                                            form.setValue(`answers.0.isCorrect`, val === "true")
                                                            form.setValue(`answers.1.text`, "خاطأ")
                                                            form.setValue(`answers.1.isCorrect`, val === "false")
                                                        }
                                                    }}
                                                    className={cn(
                                                        "relative overflow-hidden cursor-pointer group rounded-xl border-2 transition-all duration-200 p-6 flex flex-col items-center justify-center gap-3",
                                                        form.watch(`answers.${idx}.isCorrect`)
                                                            ? "border-emerald-500 bg-emerald-50/50"
                                                            : "border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors",
                                                        form.watch(`answers.${idx}.isCorrect`) ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm"
                                                    )}>
                                                        {val === "true" ? "T" : "F"}
                                                    </div>
                                                    <span className={cn(
                                                        "font-cairo font-bold text-lg",
                                                        form.watch(`answers.${idx}.isCorrect`) ? "text-emerald-800" : "text-slate-600"
                                                    )}>
                                                        {val === "true" ? "صحيح (True)" : "خاطأ (False)"}
                                                    </span>

                                                    {form.watch(`answers.${idx}.isCorrect`) && (
                                                        <div className="absolute top-3 right-3">
                                                            <Check className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Short Answer / Code Layout */}
                                    {(questionType === "short_answer" || questionType === "code") && (
                                        <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100 border-dashed text-center space-y-4">
                                            <div className="p-3 bg-amber-100/50 rounded-full w-fit mx-auto">
                                                <Target className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <p className="text-sm text-amber-800 font-medium px-8">
                                                سيتم مقارنة إجابة الطالب بالكلمات المفتاحية أدناه أو تشغيل الكود في Sandbox المعزول.
                                            </p>
                                            <FormField
                                                control={form.control}
                                                name="explanation"
                                                render={({ field }) => (
                                                    <FormItem className="text-right w-full">
                                                        <FormLabel className="text-xs font-semibold text-amber-900 uppercase">الإجابة النموذجية / الكود</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                className="font-mono text-sm bg-white border-amber-200 focus-visible:ring-amber-500 min-h-[120px]"
                                                                placeholder="أدخل الإجابة الصحيحة..."
                                                                {...field}
                                                                value={field.value || ""}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>

                        <DialogFooter className="p-4 border-t bg-slate-50 flex items-center justify-between">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500">إلغاء</Button>
                            <Button type="submit" variant="emerald" className="gap-2 px-8 shadow-md hover:shadow-lg transition-all">
                                <Save className="w-4 h-4" />
                                حفظ السؤال
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
