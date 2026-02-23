"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function PaymentSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('transactionId')

    useEffect(() => {
        if (transactionId) {
            toast.success("تم تأكيد عملية الدفع بنجاح ✅")
        }
    }, [transactionId])

    return (
        <Card className="w-full max-w-md border-emerald-500/20 shadow-lg">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 bg-emerald-100 p-3 rounded-full w-fit animate-in zoom-in duration-500">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-700">دفع ناجح!</CardTitle>
                <CardDescription>
                    تمت عملية الدفع وتأكيد الحجز بنجاح.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p className="text-muted-foreground mb-1">رقم المعاملة</p>
                    <p className="font-mono font-medium">{transactionId || 'Unknown'}</p>
                </div>
                <p className="text-sm text-gray-600">
                    تم إرسال تفاصيل الفاتورة وتأكيد الحجز إلى بريدك الإلكتروني.
                    يمكنك الآن الدخول للحصة أو الكورس مباشرة.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/student/sessions">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        الذهاب للحصص
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                    <Link href="/student">العودة للرئيسية</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function PaymentSuccessPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Suspense fallback={<div className="text-center">جاري التحقق من الدفع...</div>}>
                <PaymentSuccessContent />
            </Suspense>
        </div>
    )
}
