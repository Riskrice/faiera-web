import { z } from "zod"

export const courseSchema = z.object({
    title: z.string().min(5, "عنوان الكورس يجب أن يكون 5 أحرف على الأقل"),
    description: z.string().min(20, "الوصف يجب أن يكون 20 حرف على الأقل"),
    // category: z.string().min(1, "يرجى اختيار القسم"),
    // level: z.string().min(1, "يرجى اختيار المستوى"),
    subject: z.string().min(1, "يرجى اختيار المادة"),
    grade: z.string().min(1, "يرجى اختيار الصف الدراسي"),
    term: z.string().min(1, "يرجى اختيار الترم"),

    language: z.string().min(1, "يرجى اختيار اللغة"),
    // programId: z.string().min(1, "يرجى اختيار البرنامج الدراسي"), // Made optional or removed from UI requirement
    programId: z.string().optional(),
    teacherId: z.string().min(1, "يرجى اختيار المعلم"),

    // Media & Pricing
    price: z.coerce.number().min(0, "السعر يجب أن يكون 0 أو أكثر"),
    currency: z.string().default("EGP"),
    thumbnail: z.string().optional(), // In a real app, this might be a URL string

    // Curriculum
    sections: z.array(z.object({
        id: z.string(), // For key management
        title: z.string().min(3, "عنوان القسم يجب أن يكون 3 أحرف على الأقل"),
        lessons: z.array(z.object({
            id: z.string(),
            title: z.string().min(3, "عنوان الدرس يجب أن يكون 3 أحرف على الأقل"),
            duration: z.coerce.number().optional(),
            type: z.enum(["video", "article", "quiz"]).default("video"),
            isFree: z.boolean().default(false),
            // Advanced Content Fields
            videoUrl: z.string().optional(),
            // duration: z.string().default("0"), // Removed duplicate
            articleContent: z.string().optional(),
            attachments: z.array(z.object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                size: z.string().optional()
            })).optional().default([])
        }))
    })).min(1, "يجب إضافة قسم واحد على الأقل")
})

export type CourseFormValues = z.infer<typeof courseSchema>

export const defaultCourseValues: Partial<CourseFormValues> = {
    title: "",
    description: "",
    // category: "",
    // level: "",
    subject: "",
    grade: "",
    term: "",
    teacherId: "",
    language: "ar",
    programId: "",
    price: 0,
    currency: "EGP",
    sections: [
        {
            id: "section-1",
            title: "المقدمة",
            lessons: [
                {
                    id: "lesson-1",
                    title: "مرحباً بكم في الكورس",
                    type: "video",
                    isFree: true,
                    attachments: []
                }
            ]
        }
    ]
}
