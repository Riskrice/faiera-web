"use client"

import { useEffect, useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { teacherSchema, TeacherFormValues, defaultTeacherValues, TeacherStatusEnum } from "@/lib/schemas/teacher"
import { GraduationCap, Mail, Phone, User, Briefcase, FileText, Image, Lock, Upload, X } from "lucide-react"

interface TeacherEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacher?: TeacherFormValues | null
    onSave: (data: TeacherFormValues) => void
}

export function TeacherEditor({ open, onOpenChange, teacher, onSave }: TeacherEditorProps) {
    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherSchema) as any,
        defaultValues: defaultTeacherValues,
        mode: "onChange",
    })

    // Reset form when dialog opens or teacher changes
    useEffect(() => {
        if (open) {
            form.reset({
                ...defaultTeacherValues,
                ...(teacher || {})
            })
        }
    }, [open, teacher, form])

    const onSubmit = (data: TeacherFormValues) => {
        onSave(data)
        onOpenChange(false)
    }

    const isEditMode = !!teacher?.id

    // Avatar preview state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset avatar preview when dialog opens
    useEffect(() => {
        if (open && teacher?.avatar) {
            setAvatarPreview(teacher.avatar)
        } else if (!open) {
            setAvatarPreview(null)
        }
    }, [open, teacher])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setAvatarPreview(base64)
                form.setValue('avatar', base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearAvatar = () => {
        setAvatarPreview(null)
        form.setValue('avatar', '')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 -m-6 mb-6 p-6 rounded-t-lg border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold font-cairo">
                                {isEditMode ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditMode ? "قم بتحديث بيانات المعلم وحفظ التغييرات" : "أدخل بيانات المعلم الجديد للانضمام لفريق التدريس"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Personal Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <User className="w-4 h-4" />
                                المعلومات الشخصية
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الاسم الكامل *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="مثال: د. أحمد محمد" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>البريد الإلكتروني *</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="email" placeholder="teacher@example.com" className="pr-9" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{isEditMode ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور *"}</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="pr-9"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                {isEditMode ? "اتركها فارغة إذا لم ترد تغييرها" : "6 أحرف على الأقل"}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>رقم الهاتف</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input type="tel" placeholder="+20 100 000 0000" className="pr-9" dir="ltr" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Avatar Upload Section */}
                            <div className="space-y-2">
                                <FormLabel>الصورة الشخصية</FormLabel>
                                <div className="flex items-center gap-4">
                                    {avatarPreview ? (
                                        <div className="relative">
                                            <img
                                                src={avatarPreview}
                                                alt="Preview"
                                                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearAvatar}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                                            <User className="w-8 h-8 text-muted-foreground/50" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="w-4 h-4" />
                                            رفع صورة
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG أو GIF (أقصى حجم 2MB)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Professional Info Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                المعلومات المهنية
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="specialization"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>التخصص *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="مثال: تطوير البرمجيات" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>حالة الحساب</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="اختر الحالة" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="active">نشط</SelectItem>
                                                    <SelectItem value="inactive">غير نشط</SelectItem>
                                                    <SelectItem value="suspended">محظور</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>نبذة تعريفية</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="اكتب نبذة مختصرة عن خبرات المعلم وإنجازاته..."
                                                className="min-h-[100px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            ستظهر هذه النبذة في صفحة الكورسات الخاصة بالمعلم
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" variant="emerald" className="gap-2">
                                <GraduationCap className="w-4 h-4" />
                                {isEditMode ? "حفظ التغييرات" : "إضافة المعلم"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
