import { z } from "zod"

export const TeacherStatusEnum = z.enum(["active", "inactive", "suspended"])

export const teacherSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
    phone: z.string().optional(),
    specialization: z.string().min(2, "التخصص مطلوب"),
    status: TeacherStatusEnum.default("active"),
    bio: z.string().optional(),
    avatar: z.string().optional(), // Can be URL or base64
    joinedDate: z.string().optional(),
    activeCourses: z.number().default(0),
    rating: z.number().min(0).max(5).default(0),
})

export type TeacherFormValues = z.infer<typeof teacherSchema>

export const defaultTeacherValues: TeacherFormValues = {
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    status: "active",
    bio: "",
    avatar: "",
    activeCourses: 0,
    rating: 0,
}

export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        active: "نشط",
        inactive: "غير نشط",
        suspended: "محظور"
    }
    return labels[status] || status
}
