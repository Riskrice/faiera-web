import { QuestionFormValues } from "@/lib/schemas/question"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface QuestionPreviewProps {
    question: QuestionFormValues
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
    if (!question.text) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8 text-center">
                اكتب نص السؤال لتظهر المعاينة هنا
            </div>
        )
    }

    const renderAnswers = () => {
        switch (question.type) {
            case "mcq":
            case "mcq_multi":
            case "true_false":
                return (
                    <div className="space-y-3 mt-6">
                        {question.answers?.map((ans, idx) => (
                            <div key={ans.id || idx} className="flex items-center gap-3 p-4 rounded-xl border bg-white shadow-sm hover:border-emerald-200 transition-colors">
                                <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold shrink-0",
                                    question.type === "mcq_multi" ? "rounded-md" : "",
                                    ans.isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent"
                                )}>
                                    {ans.isCorrect && "✓"}
                                </div>
                                <span className={cn(
                                    "flex-1 font-medium",
                                    ans.isCorrect ? "text-emerald-700" : "text-slate-700"
                                )}>
                                    {ans.text || "خيّار فارغ"}
                                </span>
                            </div>
                        ))}
                    </div>
                )
            
            case "fill_blank": {
                // simple replace logic for [blank] or ____
                let textWithBlanks = question.text
                const parts = textWithBlanks.split(/(\[blank\]|____)/)
                let blankIndex = 0

                return (
                    <div className="mt-6 text-lg leading-loose text-slate-800 bg-white p-6 rounded-xl border shadow-sm">
                        {parts.map((part, i) => {
                            if (part === "[blank]" || part === "____") {
                                const ans = question.answers?.[blankIndex]
                                blankIndex++
                                return (
                                    <span key={i} className="inline-block border-b-2 border-emerald-400 px-3 min-w-[100px] text-center text-emerald-700 font-bold bg-emerald-50 rounded-t-md mx-1">
                                        {ans?.text || "..."}
                                    </span>
                                )
                            }
                            return <span key={i}>{part}</span>
                        })}
                    </div>
                )
            }
            
            case "ordering":
                return (
                    <div className="space-y-3 mt-6">
                        {question.answers?.map((ans, idx) => (
                            <div key={ans.id || idx} className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
                                    {idx + 1}
                                </div>
                                <span className="flex-1 font-medium text-slate-700">{ans.text || "عنصر فارغ"}</span>
                            </div>
                        ))}
                    </div>
                )

            case "matching":
                return (
                    <div className="grid grid-cols-2 gap-8 mt-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-slate-500 text-center mb-4">العمود الأول</h4>
                            {question.answers?.map((ans, idx) => (
                                <div key={`left-${ans.id || idx}`} className="p-4 rounded-xl border bg-white shadow-sm text-center font-medium text-slate-700">
                                    {ans.text || "مصلطح فارغ"}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-semibold text-slate-500 text-center mb-4">العمود الثاني</h4>
                            {question.answers?.map((ans, idx) => (
                                <div key={`right-${ans.id || idx}`} className="p-4 rounded-xl border bg-slate-50 shadow-sm text-center font-medium text-slate-600">
                                    {ans.explanation || "تعريف فارغ"}
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case "short_answer":
            case "essay":
                return (
                    <div className="mt-6">
                        <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                            مساحة إجابة الطالب
                        </div>
                        {question.explanation && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <span className="text-xs font-bold text-amber-800 block mb-2">الإجابة النموذجية:</span>
                                <p className="text-sm text-amber-900 font-mono">{question.explanation}</p>
                            </div>
                        )}
                    </div>
                )
        }
    }

    return (
        <div className="h-full bg-slate-100/50 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">{question.type}</Badge>
                    <Badge variant="secondary" className={
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }>
                        {question.difficulty}
                    </Badge>
                </div>
                
                {question.type !== "fill_blank" && (
                    <h3 className="text-xl font-bold text-slate-800 leading-relaxed font-cairo">
                        {question.text}
                    </h3>
                )}

                {renderAnswers()}
            </div>
        </div>
    )
}
