import { z } from "zod"

// 1. Enums for Methodological Classification
export const DifficultyEnum = z.enum(["easy", "medium", "hard", "expert"])
export const BloomTaxonomyEnum = z.enum([
    "remember", // تذكر
    "understand", // فهم
    "apply", // تطبيق
    "analyze", // تحليل
    "evaluate", // تقييم
    "create" // ابتكار
])

export const QuestionTypeEnum = z.enum([
    "mcq", // اختيار من متعدد
    "true_false", // صح أو خطأ
    "short_answer", // إجابة قصيرة
    "code" // كود برمجي
])

export const EducationalStageEnum = z.enum([
    "primary", // الابتدائية
    "preparatory", // الإعدادية
    "secondary", // الثانوية
    "university" // الجامعية
])

export const SubjectEnum = z.enum([
    "arabic", // اللغة العربية
    "english", // اللغة الإنجليزية
    "math", // الرياضيات
    "science", // العلوم
    "physics", // الفيزياء
    "chemistry", // الكيمياء
    "biology", // الأحياء
    "history", // التاريخ
    "geography", // الجغرافيا
    "computer_science" // الحاسب الآلي
])

// 2. Answer Schema (relaxed for draft saving)
const AnswerSchema = z.object({
    id: z.string(),
    text: z.string().default(""), // Allow empty for drafts
    isCorrect: z.boolean().default(false),
    explanation: z.string().optional()
})

// 3. Main Question Schema
export const questionSchema = z.object({
    id: z.string().optional(),

    // Core Content
    text: z.string().min(5, "نص السؤال قصير جداً"),
    subject: SubjectEnum.optional(), // New field
    grade: EducationalStageEnum.optional(), // New field
    description: z.string().optional(),

    // Methodology & Metadata
    type: QuestionTypeEnum.default("mcq"),
    difficulty: DifficultyEnum.default("medium"),
    taxonomy: BloomTaxonomyEnum.default("understand"),
    tags: z.array(z.string()).optional().default([]), // Made optional

    // Data & Logic
    points: z.coerce.number().min(0).default(1),
    timeLimit: z.coerce.number().optional(),

    // Answers & Feedback
    answers: z.array(AnswerSchema).optional().default([]),

    // General Feedback
    explanation: z.string().optional(),

    // Status
    isActive: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
})

// 4. Form Types
export type QuestionFormValues = z.infer<typeof questionSchema>
export type QuestionType = z.infer<typeof QuestionTypeEnum>
export type BloomLevel = z.infer<typeof BloomTaxonomyEnum>

// 5. Default Values
export const defaultQuestionValues: Partial<QuestionFormValues> = {
    type: "mcq",
    difficulty: "medium",
    taxonomy: "understand",
    subject: undefined,
    grade: undefined,
    points: 1,
    tags: [],
    answers: [
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
        { id: "3", text: "", isCorrect: false },
        { id: "4", text: "", isCorrect: false }
    ],
    isActive: true
}
