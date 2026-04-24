"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import {
    BookOpen,
    Check,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    FileText,
    Image as ImageIcon,
    LayoutList,
    Loader2,
    Plus,
    Trash2,
    Video
} from "lucide-react"
import { SectionBuilder } from "./section-builder"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { UploadProvider } from "@/contexts/upload-context"
import api from "@/lib/api"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea" // We'll need to make sure this exists or use Input for now
import { courseSchema, CourseFormValues, defaultCourseValues } from "@/lib/schemas/course"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ImageUploader } from "@/components/ui/image-uploader"

const steps = [
    { id: 1, name: "المعلومات الأساسية", icon: FileText },
    { id: 2, name: "التسعير والميديا", icon: DollarSign },
    { id: 3, name: "المنهج الدراسي", icon: LayoutList },
    { id: 4, name: "مراجعة ونشر", icon: Check },
]

export function AddCourseWizard({ children, course, courseId }: { children: React.ReactNode, course?: Partial<CourseFormValues>, courseId?: string }) {
    const { accessToken } = useAuth()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [programs, setPrograms] = useState<any[]>([])
    const [teachers, setTeachers] = useState<any[]>([])
    const [savedCourseId, setSavedCourseId] = useState<string | null>(null)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
    const step1Fields: (keyof CourseFormValues)[] = ["title", "description", "subject", "grade", "term", "language", "teacherId"]
    const step2Fields: (keyof CourseFormValues)[] = ["price", "currency", "thumbnail"]
    const step3Fields: (keyof CourseFormValues)[] = ["sections"]

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch programs
                const programsData = await api.get<any>('/content/programs/all');
                if (programsData.data) {
                    setPrograms(programsData.data);
                }

                // Fetch teachers
                const teachersData = await api.get<any>('/teachers');
                if (Array.isArray(teachersData.data)) {
                    setTeachers(teachersData.data);
                } else if (teachersData.data?.teachers) {
                    setTeachers(teachersData.data.teachers);
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.error("فشل في تحميل بعض البيانات (البرامج أو المعلمين)");
            }
        };

        if (open && accessToken) {
            fetchInitialData();
        }
    }, [open, accessToken, API_URL]);

    const handleReset = () => {
        setOpen(false)
        setTimeout(() => {
            setIsSuccess(false)
            setCurrentStep(1)
            form.reset()
        }, 300)
    }

    const onSubmit = async (data: CourseFormValues) => {
        setIsSubmitting(true);

        try {
            console.log("Submitting course data:", data);
            const isEditing = !!courseId;
            // ... (rest of payload mapping)

            const payload = {
                titleAr: data.title,
                titleEn: data.title,
                descriptionAr: data.description,
                descriptionEn: data.description,
                subject: data.subject,
                grade: data.grade,
                term: data.term,
                teacherId: data.teacherId,
                thumbnailUrl: data.thumbnail,
                price: Number(data.price) || 0,
                currency: data.currency || 'EGP',
                sections: data.sections.map(section => ({
                    id: (section as any).id,
                    titleAr: section.title,
                    titleEn: section.title,
                    lessons: section.lessons.map(lesson => ({
                        id: (lesson as any).id,
                        titleAr: lesson.title,
                        titleEn: lesson.title,
                        type: lesson.type,
                        durationMinutes: lesson.duration ? Math.floor((lesson.duration as number) / 60) : 0,
                        isFree: lesson.isFree,
                        videoId: lesson.videoUrl,
                        videoUrl: lesson.videoUrl,
                        contentAr: lesson.articleContent,
                        contentEn: lesson.articleContent,
                    }))
                })),
                ...(isEditing ? { replaceCurriculum: true } : {})
            };

            if (isEditing) {
                await api.put<any>(`/content/courses/${courseId}`, payload);
                setSavedCourseId(courseId);
                toast.success("تم تحديث الكورس بنجاح!");
            } else {
                const result = await api.post<any>('/content/courses', payload);
                setSavedCourseId(result.data?.id || null);
                toast.success("تم إنشاء الكورس بنجاح!");
            }
            setIsSuccess(true);

        } catch (error: any) {
            console.error("Submission failed:", error);
            const msg = error?.response?.message || error?.message || "فشل في حفظ الكورس";
            toast.error("فشل في حفظ الكورس: " + msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema) as any,
        defaultValues: (course ? { ...defaultCourseValues, ...course } : defaultCourseValues) as CourseFormValues,
        mode: "onChange",
    })

    // Field Arrays for Curriculum
    const { fields: sections, append: appendSection, remove: removeSection, replace: replaceSections } = useFieldArray({
        control: form.control,
        name: "sections",
        keyName: "fieldId",
    })

    // Reset form when dialog opens — if editing, fetch full course data from API
    useEffect(() => {
        if (!open) return

        if (courseId) {
            // Fetch full course data (with modules) to pre-fill all fields
            api.get<any>(`/content/courses/${courseId}?includeModules=true`).then((result) => {
                const c = result.data || result
                const mappedSections = (c.modules || [])
                    .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                    .map((m: any) => ({
                        id: m.id,
                        title: m.titleAr || m.titleEn || '',
                        lessons: (m.lessons || [])
                            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                            .map((l: any) => ({
                                id: l.id,
                                title: l.titleAr || l.titleEn || '',
                                type: l.type || 'video',
                                isFree: l.isFree || false,
                                duration: l.durationMinutes || 0,
                                videoUrl: l.videoUrl || (l.video?.bunnyVideoId ? `bunny://${l.video.bunnyVideoId}` : ''),
                                articleContent: l.contentAr || l.contentEn || '',
                                attachments: l.attachments || [],
                            })),
                    }))
                const sectionsToLoad = mappedSections.length > 0 ? mappedSections : (defaultCourseValues.sections as any)
                // Reset scalar fields first (without sections to avoid stale field-array state)
                form.reset({
                    ...defaultCourseValues,
                    title: c.titleAr || c.titleEn || '',
                    description: c.descriptionAr || c.descriptionEn || '',
                    subject: c.subject || '',
                    grade: c.grade || '',
                    term: c.term || '',
                    teacherId: c.teacher?.id || c.teacherId || '',
                    language: c.language || 'ar',
                    price: Number(c.price) || 0,
                    currency: c.currency || 'EGP',
                    thumbnail: c.thumbnailUrl || '',
                    sections: [],
                } as CourseFormValues)
                replaceSections(sectionsToLoad as any)
            }).catch(() => {
                // fallback to whatever was passed via props
                form.reset(course ? { ...defaultCourseValues, ...course } : defaultCourseValues)
            })
        } else {
            form.reset(defaultCourseValues)
            replaceSections((defaultCourseValues.sections as any) || [])
        }
    }, [open, courseId, replaceSections])

    const nextStep = async () => {
        let fieldsToValidate: (keyof CourseFormValues)[] = []

        if (currentStep === 1) {
            fieldsToValidate = step1Fields
        } else if (currentStep === 2) {
            fieldsToValidate = step2Fields
        } else if (currentStep === 3 && !courseId) {
            // Skip sections validation when editing (sections managed separately in course detail)
            fieldsToValidate = step3Fields
        }

        const isValid = await form.trigger(fieldsToValidate)
        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length))
        }
    }

    const goToFirstInvalidStep = async () => {
        const step1Valid = await form.trigger(step1Fields)
        if (!step1Valid) {
            setCurrentStep(1)
            toast.error("أكمل البيانات الأساسية المطلوبة قبل النشر")
            return false
        }

        const step2Valid = await form.trigger(step2Fields)
        if (!step2Valid) {
            setCurrentStep(2)
            toast.error("راجع بيانات التسعير والميديا قبل النشر")
            return false
        }

        if (!courseId) {
            const step3Valid = await form.trigger(step3Fields)
            if (!step3Valid) {
                setCurrentStep(3)
                toast.error("أكمل المنهج الدراسي قبل النشر")
                return false
            }
        }

        return true
    }

    const handlePublish = async () => {
        const isValid = await goToFirstInvalidStep()
        if (!isValid) return
        
        await form.handleSubmit(
            (data) => onSubmit(data),
            (errors) => {
                console.error("Form validation errors:", errors);
                toast.error("يرجى تصحيح الأخطاء في البيانات قبل النشر");
                
                // Optional: Try to find which step has an error
                if (errors.sections) {
                    setCurrentStep(3);
                    toast.error("هناك أخطاء في قسم المنهج الدراسي");
                } else if (errors.price || errors.thumbnail) {
                    setCurrentStep(2);
                } else {
                    setCurrentStep(1);
                }
            }
        )()
    }

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1))
    }

    return (
        <UploadProvider>
            <Dialog open={open} onOpenChange={(val) => {
                if (!val) handleReset()
                else setOpen(true)
            }}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden gap-0">

                    {/* Header with Progress Steps */}
                    {!isSuccess && (
                        <div className="bg-muted/30 border-b p-6">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-bold font-cairo">{course ? "تعديل الكورس" : "إضافة كورس جديد"}</DialogTitle>
                            </DialogHeader>

                            <div className="relative flex items-center justify-between px-8">
                                {/* Progress Line */}
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10 mx-12" />

                                {steps.map((step) => {
                                    const isCompleted = currentStep > step.id
                                    const isCurrent = currentStep === step.id

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                                                        isCurrent ? "border-primary text-primary shadow-lg shadow-primary/20 scale-110" :
                                                            "border-muted-foreground/30 text-muted-foreground"
                                                )}
                                            >
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium transition-colors duration-300",
                                                isCurrent ? "text-primary font-bold" : "text-muted-foreground"
                                            )}>
                                                {step.name}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {isSuccess ? (
                            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                                    <Check className="w-12 h-12 text-emerald-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-4 font-cairo">
                                    {courseId ? 'تم تحديث الكورس بنجاح! ✅' : 'تم إنشاء الكورس بنجاح! 🎉'}
                                </h2>
                                <p className="text-muted-foreground max-w-md mb-8 text-lg">
                                    {courseId
                                        ? `تم حفظ التغييرات على كورس "${form.getValues("title")}".`
                                        : `الكورس الخاص بك "${form.getValues("title")}" أصبح جاهزاً. يمكنك الآن إضافة المحتوى.`}
                                </p>
                                <div className="flex gap-4 flex-wrap justify-center">
                                    <Button variant="outline" onClick={handleReset} className="min-w-[140px]">
                                        إغلاق
                                    </Button>
                                    {savedCourseId && (
                                        <Button variant="default" onClick={() => { handleReset(); router.push(`/dashboard/courses/${savedCourseId}`); }} className="min-w-[140px] gap-2">
                                            <BookOpen className="w-4 h-4" /> إدارة الكورس
                                        </Button>
                                    )}
                                    {!courseId && (
                                        <Button variant="emerald" onClick={() => { setIsSuccess(false); setCurrentStep(1); setSavedCourseId(null); form.reset(); }} className="min-w-[140px] gap-2">
                                            <Plus className="w-4 h-4" /> إضافة كورس آخر
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
                                    <AnimatePresence mode="wait">

                                        {/* Step 1: Basic Info */}
                                        {currentStep === 1 && (
                                            <motion.div
                                                key="step-1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-2 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="title"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>عنوان الكورس</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="مثال: دورة احتراف React من الصفر" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="grade"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>الصف الدراسي</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="اختر الصف" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="grade_1">الاول الإعدادي</SelectItem>
                                                                        <SelectItem value="grade_2">الثاني الإعدادي</SelectItem>
                                                                        <SelectItem value="grade_3">الثالث الإعدادي</SelectItem>
                                                                        <SelectItem value="grade_4">الاول الثانوي</SelectItem>
                                                                        <SelectItem value="grade_5">الثاني الثانوي</SelectItem>
                                                                        <SelectItem value="grade_6">الثالث الثانوي</SelectItem>
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
                                                                <FormLabel>المادة</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="اختر المادة" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="math">الرياضيات</SelectItem>
                                                                        <SelectItem value="science">العلوم</SelectItem>
                                                                        <SelectItem value="arabic">اللغة العربية</SelectItem>
                                                                        <SelectItem value="english">اللغة الإنجليزية</SelectItem>
                                                                        <SelectItem value="physics">الفيزياء</SelectItem>
                                                                        <SelectItem value="chemistry">الكيمياء</SelectItem>
                                                                        <SelectItem value="biology">الأحياء</SelectItem>
                                                                        <SelectItem value="history">التاريخ</SelectItem>
                                                                        <SelectItem value="geography">الجغرافيا</SelectItem>
                                                                        <SelectItem value="philosophy_logic">الفلسفة والمنطق</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <FormField
                                                            control={form.control}
                                                            name="term"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>الترم</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="اختر الترم" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="term_1">الترم الأول</SelectItem>
                                                                            <SelectItem value="term_2">الترم الثاني</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="teacherId"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>المعلم (صاحب الكورس)</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="اختر المعلم..." />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {teachers.map((teacher) => (
                                                                                <SelectItem key={teacher.id} value={teacher.id}>
                                                                                    {teacher.user?.firstName} {teacher.user?.lastName}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name="language"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>لغة الكورس</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="اختر لغة الكورس" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="ar">العربية</SelectItem>
                                                                        <SelectItem value="en">English</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="description"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormLabel>وصف الكورس</FormLabel>
                                                                <FormControl>
                                                                    <textarea
                                                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                        placeholder="اكتب وصفاً تفصيلياً لما سيتعلمه الطالب..."
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 2: Media & Pricing */}
                                        {currentStep === 2 && (
                                            <motion.div
                                                key="step-2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="grid grid-cols-2 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="price"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>سعر الكورس</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                        <Input type="number" className="pr-9" {...field} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormDescription>اتركه 0 إذا كان مجاني</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="currency"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>العملة</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="اختر العملة" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                                                                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                                                                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="h-[250px]">
                                                    <ImageUploader
                                                        value={form.watch("thumbnail")}
                                                        onChange={(url) => form.setValue("thumbnail", url)}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 3: Curriculum */}
                                        {currentStep === 3 && (
                                            <motion.div
                                                key="step-3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold">محتوى الكورس</h3>
                                                    <Button type="button" onClick={() => appendSection({ id: crypto.randomUUID(), title: "قسم جديد", lessons: [] })} variant="outline" size="sm" className="gap-2">
                                                        <Plus className="w-4 h-4" /> إضافة قسم
                                                    </Button>
                                                </div>

                                                <div className="space-y-4">
                                                    {sections.map((section, index) => (
                                                        <Card key={(section as any).fieldId} className="border-l-4 border-l-primary overflow-visible">
                                                            <CardContent className="p-4 space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                                        {index + 1}
                                                                    </span>
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`sections.${index}.title`}
                                                                        render={({ field }) => (
                                                                            <FormItem className="flex-1 mb-0 space-y-0">
                                                                                <FormControl>
                                                                                    <Input placeholder="عنوان القسم (مثال: المقدمة)" className="font-bold border-transparent hover:border-input focus:border-input transition-colors h-9" {...field} />
                                                                                </FormControl>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(index)} className="text-muted-foreground hover:text-destructive shrink-0">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Nested Lesson Builder */}
                                                                <SectionBuilder nestIndex={index} />

                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Step 4: Review */}
                                        {currentStep === 4 && (
                                            <motion.div
                                                key="step-4"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <Check className="w-8 h-8 text-green-600" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-green-800 mb-2">جاهز للنشر!</h3>
                                                    <p className="text-green-700">لقد قمت بإدخال جميع المعلومات اللازمة. يرجى مراجعة البيانات قبل النشر النهائي.</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div className="bg-muted/50 p-4 rounded-lg">
                                                        <span className="text-muted-foreground block mb-1">العنوان</span>
                                                        <span className="font-semibold">{form.getValues("title")}</span>
                                                    </div>
                                                    <div className="bg-muted/50 p-4 rounded-lg">
                                                        <span className="text-muted-foreground block mb-1">الصف / المادة</span>
                                                        <span className="font-semibold">{form.getValues("grade")} - {form.getValues("subject")}</span>
                                                    </div>
                                                    <div className="bg-muted/50 p-4 rounded-lg">
                                                        <span className="text-muted-foreground block mb-1">السعر</span>
                                                        <span className="font-semibold">{form.getValues("price")} {form.getValues("currency")}</span>
                                                    </div>
                                                    <div className="bg-muted/50 p-4 rounded-lg">
                                                        <span className="text-muted-foreground block mb-1">عدد الأقسام</span>
                                                        <span className="font-semibold">{sections.length} أقسام</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </form>
                            </Form>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {!isSuccess && (
                        <div className="border-t p-6 bg-background flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="px-6"
                            >
                                <ChevronRight className="w-4 h-4 ml-2" />
                                السابق
                            </Button>

                            {currentStep < steps.length ? (
                                <Button onClick={nextStep} className="px-6 min-w-[120px]">
                                    التالي
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                </Button>
                            ) : (
                                <Button onClick={handlePublish} disabled={isSubmitting} variant="emerald" className="px-8 min-w-[140px]">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            جاري النشر...
                                        </>
                                    ) : (
                                        <>
                                            نشر الكورس
                                            <Check className="w-4 h-4 mr-2" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </UploadProvider>
    )
}
