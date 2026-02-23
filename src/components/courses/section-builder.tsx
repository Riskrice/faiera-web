"use client"

import { useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { LessonEditor } from "./lesson-editor"
import { Plus, Trash2, Video, FileText, HelpCircle, GripVertical, Clock, Eye, Lock, CheckCircle2, AlertTriangle, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUpload } from "@/contexts/upload-context"
import {
    FormControl,
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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface SectionBuilderProps {
    nestIndex: number
}

export function SectionBuilder({ nestIndex }: SectionBuilderProps) {
    const { control, register, getValues } = useFormContext()

    const { fields: lessons, append, remove, move } = useFieldArray({
        control,
        name: `sections.${nestIndex}.lessons`,
    })

    const [editingLesson, setEditingLesson] = useState<{ sIndex: number, lIndex: number } | null>(null)
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

    // Consume global upload context
    const { uploads } = useUpload()

    return (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-sm font-semibold text-muted-foreground">محتوى القسم ({lessons.length} دروس)</h4>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => append({
                        id: crypto.randomUUID(),
                        title: "",
                        type: "video",
                        duration: "",
                        isFree: false
                    })}
                >
                    <Plus className="w-3 h-3" />
                    إضافة درس
                </Button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {lessons.map((lesson, lessonIndex) => {
                        // Compute upload state using the actual form data id (not the field array id)
                        const lessonId = getValues(`sections.${nestIndex}.lessons.${lessonIndex}.id`) as string
                        const uploadState = lessonId ? uploads[lessonId] : undefined
                        const isUploading = uploadState?.status === 'uploading'
                        const isSuccess = uploadState?.status === 'success'
                        const isError = uploadState?.status === 'error'

                        return (
                            <motion.div
                                key={lesson.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                layout
                                draggable
                                onDragStart={(e: any) => {
                                    setDraggingIndex(lessonIndex)
                                    e.dataTransfer.effectAllowed = "move"
                                }}
                                onDragOver={(e: any) => {
                                    e.preventDefault()
                                    e.dataTransfer.dropEffect = "move"
                                }}
                                onDragEnter={(e: any) => {
                                    e.preventDefault()
                                    if (draggingIndex !== null && draggingIndex !== lessonIndex) {
                                        move(draggingIndex, lessonIndex)
                                        setDraggingIndex(lessonIndex)
                                    }
                                }}
                                onDragEnd={() => setDraggingIndex(null)}
                                className={draggingIndex === lessonIndex ? 'opacity-50' : ''}
                            >
                                <Card className={`bg-muted/30 border-dashed hover:border-solid transition-colors ${isUploading ? 'border-primary/50' : isSuccess ? 'border-emerald-300' : ''}`}>
                                    {/* Full-width upload progress bar at top of card */}
                                    {uploadState && (
                                        <div className="h-1 w-full bg-muted">
                                            {isUploading && (
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 ease-out"
                                                    style={{ width: `${uploadState.progress}%` }}
                                                />
                                            )}
                                            {isSuccess && <div className="h-full bg-emerald-500 w-full" />}
                                            {isError && <div className="h-full bg-destructive w-full" />}
                                        </div>
                                    )}
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-12 gap-3 items-start">
                                            {/* Drag Handle */}
                                            <div className="col-span-1 flex justify-center pt-3 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                                            </div>

                                            {/* Lesson Details */}
                                            <div className="col-span-11 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <FormField
                                                        control={control}
                                                        name={`sections.${nestIndex}.lessons.${lessonIndex}.title`}
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-1 md:col-span-1 mb-0 space-y-1">
                                                                <FormControl>
                                                                    <Input placeholder="عنوان الدرس" className="h-8 bg-background" {...field} />
                                                                </FormControl>
                                                                <FormMessage className="text-[10px]" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="flex gap-2">
                                                        <FormField
                                                            control={control}
                                                            name={`sections.${nestIndex}.lessons.${lessonIndex}.type`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-1 mb-0 space-y-1">
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-8 bg-background">
                                                                                <SelectValue placeholder="نوع" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="video">
                                                                                <div className="flex items-center gap-2">
                                                                                    <Video className="w-3 h-3" /> فيديو
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="article">
                                                                                <div className="flex items-center gap-2">
                                                                                    <FileText className="w-3 h-3" /> مقال
                                                                                </div>
                                                                            </SelectItem>
                                                                            <SelectItem value="quiz">
                                                                                <div className="flex items-center gap-2">
                                                                                    <HelpCircle className="w-3 h-3" /> اختبار
                                                                                </div>
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="emerald"
                                                            size="sm"
                                                            className="h-8 text-xs px-3"
                                                            onClick={() => setEditingLesson({ sIndex: nestIndex, lIndex: lessonIndex })}
                                                        >
                                                            <FileText className="w-3 h-3 mr-1" />
                                                            إدارة المحتوى
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center gap-4">
                                                        <FormField
                                                            control={control}
                                                            name={`sections.${nestIndex}.lessons.${lessonIndex}.isFree`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex items-center gap-2 space-y-0 mb-0">
                                                                    <FormControl>
                                                                        <Switch
                                                                            checked={field.value}
                                                                            onCheckedChange={field.onChange}
                                                                            className="scale-75"
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="text-xs font-normal text-muted-foreground cursor-pointer flex items-center gap-1">
                                                                        {field.value ? <Eye className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3" />}
                                                                        {field.value ? "معاينة مجانية" : "محتوى مدفوع"}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Upload Status Indicator */}
                                                        {uploadState && (
                                                            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${isUploading ? 'bg-primary/5 text-primary' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                                                {isUploading && (
                                                                    <>
                                                                        <UploadCloud className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                                                        <span className="font-medium">جاري رفع الفيديو</span>
                                                                        <span className="font-bold tabular-nums">{uploadState.progress}%</span>
                                                                        <Progress value={uploadState.progress} className="h-1.5 w-16 min-w-[64px]" />
                                                                    </>
                                                                )}
                                                                {isSuccess && (
                                                                    <>
                                                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                                        <span>اكتمل الرفع ✓</span>
                                                                    </>
                                                                )}
                                                                {isError && (
                                                                    <>
                                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                                        <span>فشل الرفع</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(lessonIndex)}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {lessons.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg bg-muted/10">
                        <p className="text-xs text-muted-foreground mb-2">لا يوجد دروس في هذا القسم بعد</p>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="text-primary h-auto p-0 text-xs"
                            onClick={() => append({
                                id: crypto.randomUUID(),
                                title: "",
                                type: "video",
                                duration: "",
                                isFree: false
                            })}
                        >
                            + إضافة أول درس
                        </Button>
                    </div>
                )}
            </div>

            {/* Lesson Editor Modal */}
            {editingLesson && (
                <LessonEditor
                    isOpen={!!editingLesson}
                    onOpenChange={(open) => !open && setEditingLesson(null)}
                    sectionIndex={editingLesson.sIndex}
                    lessonIndex={editingLesson.lIndex}
                    lessonTitle={getValues(`sections.${editingLesson.sIndex}.lessons.${editingLesson.lIndex}.title`) || "درس جديد"}
                />
            )}
        </div>
    )
}
