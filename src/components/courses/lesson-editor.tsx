"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Video,
    FileText,
    Link as LinkIcon,
    Upload,
    Clock,
    Eye,
    Type,
    Paperclip,
    Trash2,
    Database,
    Loader2
} from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { QuestionPicker } from "@/components/questions/question-picker"
import { QuestionFormValues } from "@/lib/schemas/question"
import { VideoUploader } from "@/components/video/video-uploader"


interface LessonEditorProps {
    sectionIndex: number
    lessonIndex: number
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    lessonTitle: string
}

export function LessonEditor({
    sectionIndex,
    lessonIndex,
    isOpen,
    onOpenChange,
    lessonTitle
}: LessonEditorProps) {
    const { register, watch, setValue, control } = useFormContext()
    const type = watch(`sections.${sectionIndex}.lessons.${lessonIndex}.type`)
    const attachments = watch(`sections.${sectionIndex}.lessons.${lessonIndex}.attachments`) || []

    // Format total seconds to MM:SS display string
    const formatDuration = (totalSeconds: number | string): string => {
        const sec = Math.floor(Number(totalSeconds) || 0)
        if (sec <= 0) return ""
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // Robust Upload State Simulation
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [fileName, setFileName] = useState("")

    // Question Picker State
    const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false)
    const questions = watch(`sections.${sectionIndex}.lessons.${lessonIndex}.questions`) || []

    const handleQuestionsSelected = (selectedQuestions: Partial<QuestionFormValues>[]) => {
        // In a real app, we might want to transform this data or fetch full details
        // For now, we'll append to the existing questions list
        const currentQuestions = questions || []
        // Avoid duplicates based on ID
        const newQuestions = selectedQuestions.filter(sq => !currentQuestions.some((cq: any) => cq.id === sq.id))

        setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.questions`, [...currentQuestions, ...newQuestions])
    }

    const handleRemoveQuestion = (id: string) => {
        setValue(
            `sections.${sectionIndex}.lessons.${lessonIndex}.questions`,
            questions.filter((q: any) => q.id !== id)
        )
    }

    useEffect(() => {
        // Check if value exists to set initial state
        const currentUrl = watch(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`)
        if (currentUrl && currentUrl.includes('iframe.mediadelivery.net') && !currentUrl.includes('simulation')) {
            setUploadStatus('completed')
            setFileName('existing-video.mp4')
        }
    }, [])

    const simulateUpload = (file: File) => {
        setUploadStatus('uploading')
        setFileName(file.name)
        setUploadProgress(0)

        let progress = 0
        const interval = setInterval(() => {
            progress += 2
            setUploadProgress(progress)
            if (progress >= 100) {
                clearInterval(interval)
                setUploadStatus('processing')
                setTimeout(() => {
                    setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`, "https://iframe.mediadelivery.net/simulation/" + file.name)
                    setUploadStatus('completed')
                }, 3000) // Simulate processing time
            }
        }, 100) // Simulate upload speed
    }

    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)

    // Hidden file input ref
    const fileInputRef = useState<HTMLInputElement | null>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploadingAttachment(true)
            const response = await api.upload<{ url: string, data?: { url: string } }>('/upload', file)
            // Handle different response structures (direct DTO or wrapped)
            const url = response.url || response.data?.url

            if (!url) throw new Error("No URL returned from upload")

            const newAttachment = {
                id: crypto.randomUUID(),
                name: file.name,
                url: url,
                size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
                type: file.type
            }

            setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.attachments`, [...attachments, newAttachment])
            toast.success("تم رفع الملف بنجاح")
        } catch (error) {
            console.error(error)
            toast.error("فشل رفع الملف")
        } finally {
            setIsUploadingAttachment(false)
            // Reset input
            if (e.target) e.target.value = ''
        }
    }

    const handleAddAttachmentClick = () => {
        document.getElementById(`attachment-upload-${sectionIndex}-${lessonIndex}`)?.click()
    }

    const handleRemoveAttachment = (id: string) => {
        setValue(
            `sections.${sectionIndex}.lessons.${lessonIndex}.attachments`,
            attachments.filter((a: any) => a.id !== id)
        )
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
                <SheetContent side="left" className="w-full sm:w-[540px] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2 font-cairo">
                            <Video className="w-5 h-5 text-emerald-600" />
                            تعديل محتوى الدرس
                        </SheetTitle>
                        <SheetDescription>
                            {lessonTitle || "درس جديد"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-8">

                        {/* 1. Content Settings based on Type */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                المحتوى الأساسي
                                {type === 'video' && <Badge variant="secondary"><Video className="w-3 h-3 mr-1" /> فيديو</Badge>}
                                {type === 'article' && <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" /> مقال</Badge>}
                            </h3>

                            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                                {type === 'video' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>رابط الفيديو (YouTube / Vimeo / Bunny.net)</Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <LinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`)}
                                                        placeholder="e.g. https://iframe.mediadelivery.net/..."
                                                        className="pr-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>رفع الفيديو (Direct Upload to Bunny.net)</Label>

                                            <div className="border rounded-lg p-4 bg-muted/10">
                                                <VideoUploader
                                                    lessonId={watch(`sections.${sectionIndex}.lessons.${lessonIndex}.id`)}
                                                    onUploadComplete={(videoId, durationSeconds) => {
                                                        setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.videoUrl`, `bunny://${videoId}`);
                                                        if (durationSeconds > 0) {
                                                            setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.duration`, durationSeconds);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    المدة (دقيقة:ثانية)
                                                </Label>
                                                <div className="relative">
                                                    {/* Show formatted MM:SS from stored seconds */}
                                                    {watch(`sections.${sectionIndex}.lessons.${lessonIndex}.duration`) ? (
                                                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/40 text-sm font-mono">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-semibold text-foreground">
                                                                {formatDuration(watch(`sections.${sectionIndex}.lessons.${lessonIndex}.duration`))}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                ({Math.floor(Number(watch(`sections.${sectionIndex}.lessons.${lessonIndex}.duration`)) / 60)} دقيقة)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                placeholder="بالثواني"
                                                                {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.duration`)}
                                                                className="pr-9"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {type === 'article' && (
                                    <div className="space-y-2">
                                        <Label>محتوى المقال</Label>
                                        <Textarea
                                            {...register(`sections.${sectionIndex}.lessons.${lessonIndex}.articleContent`)}
                                            placeholder="اكتب محتوى الدرس هنا..."
                                            className="min-h-[200px] font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">يمكنك استخدام Markdown لتنسيق النص.</p>
                                    </div>
                                )}

                                {type === 'quiz' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>أسئلة الاختبار</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsQuestionPickerOpen(true)}
                                                className="gap-2"
                                            >
                                                <Database className="w-4 h-4" />
                                                اختر من بنك الأسئلة
                                            </Button>
                                        </div>

                                        {questions.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
                                                <p className="text-muted-foreground mb-4 text-sm">لم يتم إضافة أي أسئلة بعد.</p>
                                                <Button variant="ghost" size="sm" onClick={() => setIsQuestionPickerOpen(true)}>تصفح بنك الأسئلة</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                {questions.map((q: any, idx: number) => (
                                                    <div key={q.id || idx} className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm group">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{q.text}</p>
                                                            <div className="flex gap-2 mt-1">
                                                                <Badge variant="outline" className="text-[10px] h-5">{q.type}</Badge>
                                                                <Badge variant="outline" className="text-[10px] h-5">{q.difficulty}</Badge>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemoveQuestion(q.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-t border-border" />

                        {/* 2. Settings (Free Preview) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                إعدادات الوصول
                            </h3>
                            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <Label className="text-base">درس مجاني (Free Preview)</Label>
                                    <p className="text-xs text-muted-foreground">
                                        السماح للطلاب بمشاهدة هذا الدرس قبل شراء الكورس
                                    </p>
                                </div>
                                <Switch
                                    checked={watch(`sections.${sectionIndex}.lessons.${lessonIndex}.isFree`)}
                                    onCheckedChange={(checked) => setValue(`sections.${sectionIndex}.lessons.${lessonIndex}.isFree`, checked)}
                                />
                            </div>
                        </div>

                        <hr className="border-t border-border" />

                        {/* 3. Attachments */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    المصادر والمرفقات <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id={`attachment-upload-${sectionIndex}-${lessonIndex}`}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={handleAddAttachmentClick}
                                        disabled={isUploadingAttachment}
                                    >
                                        {isUploadingAttachment ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusIcon className="w-3 h-3" />}
                                        {isUploadingAttachment ? "جاري الرفع..." : "إضافة ملف"}
                                    </Button>
                                </div>
                            </div>

                            {attachments.length === 0 ? (
                                <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                    <Paperclip className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">لا توجد مرفقات لهذا الدرس</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attachments.map((file: any, idx: number) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md border group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-background rounded flex items-center justify-center border shadow-sm">
                                                    <FileText className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{file.size}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveAttachment(file.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    <SheetFooter className="mt-8">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => onOpenChange(false)}>
                            <CheckIcon className="w-4 h-4 mr-2" /> حفظ وإغلاق
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <QuestionPicker
                open={isQuestionPickerOpen}
                onOpenChange={setIsQuestionPickerOpen}
                onSelect={handleQuestionsSelected}
            />
        </>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5" /></svg>
    )
}
