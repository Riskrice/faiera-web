"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Sparkles, Star, Zap, Ticket, XCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts"
import { rememberPendingCheckout, trackEvent } from "@/lib/gtm"
import { validatePromoCode } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Plan = {
    id: string
    nameAr: string
    nameEn: string
    descriptionAr?: string
    price: number
    currency: string
    durationDays: number
    features: string[]
    grade: string
    type: "monthly" | "quarterly" | "semi_annual" | "annual"
    isPopular: boolean
    isFeatured: boolean
}

export default function StudentSubscriptionsPage() {
    const { accessToken } = useAuth()
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    
    // Checkout Dialog State
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
    const [promoCode, setPromoCode] = useState("")
    const [promoResult, setPromoResult] = useState<any>(null)
    const [isValidatingPromo, setIsValidatingPromo] = useState(false)
    const [promoError, setPromoError] = useState("")

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch(`${apiUrl}/subscriptions/plans/active`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) throw new Error("فشل تحميل الباقات")

                const data = await response.json()
                const rawPlans = data.data || []
                const normalized = rawPlans.map((p: any) => ({
                    ...p,
                    features: Array.isArray(p.features) ? p.features : [],
                }))
                setPlans(normalized)
            } catch (error) {
                console.error("Error fetching plans:", error)
                toast.error("حدث خطأ أثناء تحميل الباقات")
            } finally {
                setLoading(false)
            }
        }

        fetchPlans()
    }, [apiUrl])

    const handleSubscribeClick = (plan: Plan) => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }
        setCheckoutPlan(plan)
        setPromoCode("")
        setPromoResult(null)
        setPromoError("")
    }

    const handleApplyPromo = async () => {
        if (!promoCode.trim() || !checkoutPlan || !accessToken) return
        setIsValidatingPromo(true)
        setPromoError("")
        setPromoResult(null)
        try {
            const res = await validatePromoCode(promoCode, checkoutPlan.price, { planId: checkoutPlan.id }, accessToken)
            setPromoResult((res as any)?.data)
            toast.success("تم تطبيق كود الخصم بنجاح")
        } catch (error: any) {
            setPromoError(error.message || "كود الخصم غير صالح")
        } finally {
            setIsValidatingPromo(false)
        }
    }

    const handleConfirmCheckout = async () => {
        if (!checkoutPlan || !accessToken) return

        const checkoutPayload = {
            checkout_type: 'subscription',
            currency: checkoutPlan.currency,
            value: promoResult ? promoResult.finalAmount : checkoutPlan.price,
            items: [
                {
                    item_id: checkoutPlan.id,
                    item_name: checkoutPlan.nameEn || checkoutPlan.nameAr,
                    item_category: 'subscription',
                    price: promoResult ? promoResult.finalAmount : checkoutPlan.price,
                    quantity: 1,
                },
            ],
            promo_code: promoResult?.code,
        }

        rememberPendingCheckout(checkoutPayload)
        trackEvent('begin_checkout', checkoutPayload)

        try {
            setActionLoading(checkoutPlan.id)
            const loadingId = toast.loading("جاري تحويلك لبوابة الدفع...")

            const response = await fetch(`${apiUrl}/payments/checkout/subscription/${checkoutPlan.id}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(promoResult ? { promoCode: promoResult.code } : {}),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "فشل بدء عملية الدفع")
            }

            if (data.data?.isFree) {
                toast.dismiss(loadingId)
                toast.success("تم الاشتراك بنجاح بفضل كود الخصم! 🎉")
                setCheckoutPlan(null)
                // Refresh the page to show active subscription
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else if (data.data?.paymentUrl) {
                toast.dismiss(loadingId)
                window.location.href = data.data.paymentUrl
            } else {
                throw new Error("رابط الدفع غير صالح")
            }

        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء الاشتراك")
        } finally {
            setActionLoading(null)
            toast.dismiss("payment-loading")
        }
    }

    if (loading) {
        return (
            <div className="flex bg-background min-h-[600px] items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse">جاري تحميل الباقات...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-12 p-4 md:p-8 max-w-7xl mx-auto font-cairo">
            <div className="text-center space-y-6 pt-8 pb-4">
                <Badge variant="secondary" className="px-4 py-1.5 text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                    استثمر في مستقبلك
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    باقات الاشتراك المميزة
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    اختر الباقة التي تناسبك واحصل على وصول غير محدود للمحتوى التعليمي، الحصص المباشرة، والمراجعات النهائية.
                </p>
            </div>

            {plans.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">لا توجد باقات متاحة حالياً.</p>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center items-stretch">
                    {plans.map((plan) => (
                        <Card
                            key={plan.id}
                            className={`relative flex flex-col transition-all duration-300 ${plan.isPopular
                                ? "border-primary shadow-2xl shadow-primary/10 scale-105 z-10 bg-gradient-to-b from-background to-primary/5"
                                : "hover:border-primary/50 hover:shadow-xl bg-card"
                                } rounded-3xl overflow-hidden`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary" />
                            )}

                            {plan.isPopular && (
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-lg flex gap-1 items-center">
                                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                                        الأكثر شيوعاً
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-8 pt-8 px-8">
                                <CardTitle className="text-3xl font-bold mb-2">{plan.nameAr}</CardTitle>
                                {plan.descriptionAr && (
                                    <CardDescription className="text-base line-clamp-2 min-h-[3rem]">
                                        {plan.descriptionAr}
                                    </CardDescription>
                                )}
                            </CardHeader>

                            <CardContent className="flex-1 px-8">
                                <div className="mb-8 flex items-end justify-center gap-1 pb-8 border-b border-border/50">
                                    <span className="text-5xl font-black tracking-tighter text-foreground">{plan.price}</span>
                                    <div className="flex flex-col items-start mb-2">
                                        <span className="text-sm font-bold text-muted-foreground uppercase">{plan.currency}</span>
                                        <span className="text-sm text-muted-foreground font-medium text-nowrap">/ {getDurationLabel(plan.type)}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="font-bold text-sm text-foreground/80 mb-4">مميزات تشمل:</p>
                                    {(plan.features.length > 0 ? plan.features : getFallbackFeatures()).map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3 text-sm group">
                                            <div className={`mt-0.5 rounded-full p-1 ${plan.isPopular ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"} transition-colors`}>
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-foreground/80 leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>

                            <CardFooter className="px-8 pb-8 pt-4">
                                <Button
                                    className={`w-full h-14 text-lg font-bold rounded-2xl transition-all duration-300 ${plan.isPopular
                                        ? "shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02]"
                                        : "hover:bg-primary/5"
                                        }`}
                                    size="lg"
                                    variant={plan.isPopular ? "default" : "outline"}
                                    onClick={() => handleSubscribeClick(plan)}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === plan.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            جاري التجهيز...
                                        </>
                                    ) : (
                                        <>
                                            {plan.isPopular ? <Zap className="mr-2 h-5 w-5 fill-current" /> : null}
                                            اشترك الآن
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Checkout Dialog */}
            <Dialog open={!!checkoutPlan} onOpenChange={(open) => !open && setCheckoutPlan(null)}>
                <DialogContent className="sm:max-w-md font-cairo">
                    <div dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">تأكيد الاشتراك</DialogTitle>
                        <DialogDescription>
                            أنت على وشك الاشتراك في باقة {checkoutPlan?.nameAr}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl">
                            <span className="font-semibold">سعر الباقة:</span>
                            <span className={`text-lg font-bold ${promoResult ? 'line-through text-muted-foreground' : ''}`}>
                                {checkoutPlan?.price} {checkoutPlan?.currency}
                            </span>
                        </div>

                        {/* Promo Code Section */}
                        <div className="space-y-3 border-t border-b border-border py-4">
                            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                                <Ticket className="w-4 h-4" /> هل لديك كود خصم؟
                            </div>
                            
                            {!promoResult ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="أدخل كود الخصم"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                            className="font-mono text-center tracking-wider uppercase"
                                        />
                                        <Button 
                                            variant="secondary" 
                                            onClick={handleApplyPromo}
                                            disabled={isValidatingPromo || !promoCode.trim()}
                                            className="px-6"
                                        >
                                            {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                                        </Button>
                                    </div>
                                    {promoError && <p className="text-red-500 text-xs mt-1 font-medium">{promoError}</p>}
                                </div>
                            ) : (
                                <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 p-3 rounded-xl flex items-center justify-between text-sm border border-green-200 dark:border-green-800">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" /> تم تطبيق {promoResult.code} بنجاح
                                        </span>
                                        <span>وفرت {promoResult.discountAmount} {checkoutPlan?.currency}</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => {
                                            setPromoCode("")
                                            setPromoResult(null)
                                        }}
                                        className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/40"
                                    >
                                        إلغاء
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <span className="font-bold text-lg">الإجمالي النهائي:</span>
                            <span className="text-2xl font-black text-primary">
                                {promoResult ? promoResult.finalAmount : checkoutPlan?.price} {checkoutPlan?.currency}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setCheckoutPlan(null)} className="w-full sm:w-auto">
                            إلغاء
                        </Button>
                        <Button 
                            onClick={handleConfirmCheckout} 
                            disabled={!!actionLoading}
                            className="w-full sm:w-auto gap-2 text-lg h-11"
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                            متابعة الدفع
                        </Button>
                    </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getDurationLabel(type: string) {
    switch (type) {
        case "monthly": return "شهرياً";
        case "quarterly": return "كل 3 أشهر";
        case "semi_annual": return "كل 6 أشهر";
        case "annual": return "سنوياً";
        default: return "";
    }
}

function getFallbackFeatures() {
    return [
        "وصول غير محدود لجميع الدروس",
        "حضور الحصص المباشرة",
        "اختبارات تقييمية دورية",
        "مراجعات ليلة الامتحان",
        "دعم فني وتوجيه أكاديمي",
        "شهادة إتمام معتمدة"
    ];
}
