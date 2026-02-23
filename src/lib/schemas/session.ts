import { z } from "zod";

export const sessionStatusEnum = z.enum(["scheduled", "live", "ended", "cancelled"]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const sessionSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "عنوان الحصة يجب أن يكون 3 أحرف على الأقل"),
    description: z.string().optional(),
    tutorId: z.string().min(1, "يجب اختيار المعلم"),
    tutorName: z.string().optional(), // For display
    tutorAvatar: z.string().optional(), // For display
    startTime: z.date({ message: "يرجى تحديد موعد البدء" }),
    durationMinutes: z.number().min(15).max(180).default(60),
    status: sessionStatusEnum.default("scheduled"),
    meetingLink: z.string().url("رابط الاجتماع غير صحيح").optional(),
    maxStudents: z.number().min(1).default(50),
    enrolledStudentIds: z.array(z.string()).default([]),
    // Monetization Logic
    price: z.number().min(0).default(0), // 0 = Free
    packagePrice: z.number().optional(), // For monthly bundles
    currency: z.string().default("EGP"),
    isPackageAvailable: z.boolean().default(false),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;

export const defaultSessionValues: Partial<SessionFormValues> = {
    status: "scheduled",
    durationMinutes: 60,
    maxStudents: 50,
    enrolledStudentIds: [],
};
