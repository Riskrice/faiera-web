"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, RefreshCcw, Loader2 } from "lucide-react"
import Link from "next/link"

function PaymentFailedContent() {
    const searchParams = useSearchParams()
    const transactionId = searchParams.get('transactionId')

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md border-red-500/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-red-100 p-3 rounded-full w-fit animate-in shake duration-500">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-red-700">فشل في الدفع</CardTitle>
                    <CardDescription>
                        لم نتمكن من إتمام عملية الدفع الخاصة بك.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                        <p className="mb-1">إذا تم خصم المبلغ، سيتم استرداده تلقائياً.</p>
                        <p>يرجى التأكد من بيانات البطاقة أو المحاولة بطريقة دفع مختلفة.</p>
                    </div>
                    {transactionId && (
                        <p className="text-xs text-muted-foreground">ID: {transactionId}</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full" variant="default">
                        <Link href="/student/sessions">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            محاولة مرة أخرى
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                        <Link href="/student">العودة للرئيسية</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PaymentFailedContent />
        </Suspense>
    )
}
