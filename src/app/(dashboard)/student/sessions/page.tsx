"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Calendar,
    Clock,
    Video,
    Search,
    Filter,
    CalendarCheck,
    AlertCircle,
    Loader2,
    PlayCircle,
    Users
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts"
import { JitsiMeeting } from "@/components/sessions"
import api from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Check, CreditCard, Sparkles, Shield } from "lucide-react"

// Session Type matching backend
type Session = {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    hostId: string;
    hostName?: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    durationMinutes: number;
    status: "scheduled" | "live" | "ended" | "cancelled";
    subject: string;
    grade: string;
    jitsiRoomName: string;
    jitsiDomain: string;
    registeredCount: number;
    maxParticipants: number;
    price: number;
    currency: string;
    isRegistered?: boolean;
}

type JitsiConfig = {
    domain: string;
    roomName: string;
    displayName: string;
    isHost: boolean;
    jwt?: string;
    configOverwrite: Record<string, unknown>;
    interfaceConfigOverwrite: Record<string, unknown>;
}

export default function StudentSessionsPage() {
    const { accessToken, user, signOut } = useAuth()
    const router = useRouter()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("browse")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Jitsi Meeting State
    const [joinInfo, setJoinInfo] = useState<{
        session: Session;
        config: JitsiConfig;
    } | null>(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

    // Fetch sessions from API
    const fetchSessions = useCallback(async () => {
        if (!accessToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true)
            const response = await api.get<{ data: { sessions: Session[] } | Session[] | any }>("/sessions?includeRegistration=true");
            const data: any = response;
            setSessions(data.data?.sessions || data.data || [])
        } catch (error: any) {
            console.error("Error fetching sessions:", error)
            const isAuthError = error.message === "Unauthorized" || error.message?.includes("401");

            if (isAuthError) {
                toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً");
                signOut(); // This will clear storage and redirect to /login
            } else {
                toast.error(error.message || "فشل في تحميل الجلسات");
            }
        } finally {
            setLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions])

    // LIVE SESSION NOTIFICATION LOGIC
    useEffect(() => {
        if (sessions.length === 0) return;

        const liveBookedSession = sessions.find(s => s.status === "live" && s.isRegistered);

        if (liveBookedSession) {
            toast.custom((t) => (
                <div
                    className="bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 cursor-pointer hover:bg-red-700 transition-colors"
                    onClick={() => {
                        toast.dismiss(t)
                        handleJoin(liveBookedSession)
                    }}
                >
                    <div className="bg-white/20 p-2 rounded-full animate-pulse">
                        <Video className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold">حصة مباشرة الآن! 🔴</h4>
                        <p className="text-sm opacity-90">حصة "{liveBookedSession.titleAr}" بدأت. انضم الآن!</p>
                    </div>
                    <Button size="sm" variant="secondary" className="whitespace-nowrap">
                        انضمام
                    </Button>
                </div>
            ), { duration: 10000, position: "top-center" });
        }
    }, [sessions]);

    // Register for session
    const handleRegister = async (session: Session) => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }

        if (session.price > 0) {
            setSelectedSession(session)
            return
        }

        try {
            setActionLoading(session.id)
            const response = await fetch(`${apiUrl}/sessions/${session.id}/register`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "فشل التسجيل")
            }

            toast.success("تم التسجيل في الجلسة بنجاح!", {
                description: "سيصلك تنبيه قبل الموعد بـ 10 دقائق."
            })
            fetchSessions()
        } catch (error: any) {
            toast.error(error.message || "فشل التسجيل في الجلسة")
        } finally {
            setActionLoading(null)
        }
    }

    // Confirm paid booking
    const confirmBooking = async (id: string, _isPackage = false) => {
        if (!accessToken) return

        try {
            setActionLoading(id)
            toast.loading("جاري تحويلك لبوابة الدفع...", { id: "payment-loading" })

            const response = await api.post<{ data: { paymentUrl: string } }>(`/payments/checkout/session/${id}`);
            const data: any = response;

            if (data.data?.paymentUrl) {
                window.location.href = data.data.paymentUrl;
            } else {
                throw new Error("رابط الدفع غير صالح");
            }

        } catch (error: any) {
            toast.error(error.message || "فشل بدء عملية الدفع", { id: "payment-loading" })
            console.error("Payment error:", error)
        } finally {
            setActionLoading(null)
        }
    }

    // Unregister from session
    const handleCancel = async (id: string) => {
        if (!accessToken) return

        try {
            setActionLoading(id)
            const response = await fetch(`${apiUrl}/sessions/${id}/register`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error("فشل إلغاء التسجيل")

            toast.info("تم إلغاء التسجيل من الجلسة")
            fetchSessions()
        } catch (error) {
            toast.error("فشل إلغاء التسجيل")
        } finally {
            setActionLoading(null)
        }
    }

    // Join session with Jitsi
    const handleJoin = async (session: Session) => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }

        try {
            setActionLoading(session.id)
            const response = await fetch(`${apiUrl}/sessions/${session.id}/join-link`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "لا يمكن الانضمام الآن")
            }

            const data = await response.json()

            // Record join
            await fetch(`${apiUrl}/sessions/${session.id}/join`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${accessToken}` },
            })

            setJoinInfo({
                session,
                config: {
                    ...data.data.config,
                },
            })
        } catch (error: any) {
            toast.error(error.message || "فشل في الانضمام للجلسة")
        } finally {
            setActionLoading(null)
        }
    }

    // Leave session
    const handleLeave = async () => {
        if (!joinInfo || !accessToken) return

        try {
            await fetch(`${apiUrl}/sessions/${joinInfo.session.id}/leave`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${accessToken}` },
            })
        } catch (error) {
            console.error("Error recording leave:", error)
        }

        setJoinInfo(null)
        fetchSessions()
    }

    // Check if session can be joined (10 min before)
    const canJoinSession = (session: Session): boolean => {
        if (session.status === "live") return true
        if (session.status !== "scheduled") return false

        const now = new Date()
        const startTime = new Date(session.scheduledStartTime)
        const joinWindowStart = new Date(startTime.getTime() - 10 * 60 * 1000)

        return now >= joinWindowStart
    }

    // Filter Logic
    const filteredSessions = sessions.filter(session => {
        const matchesTab = activeTab === "schedule" ? session.isRegistered : true
        const matchesSearch =
            session.titleAr?.includes(searchQuery) ||
            session.titleEn?.includes(searchQuery) ||
            session.hostName?.includes(searchQuery) ||
            session.subject?.includes(searchQuery)

        return matchesTab && matchesSearch
    })

    // If in Jitsi meeting
    if (joinInfo) {
        return (
            <div className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold">{joinInfo.session.titleAr}</h2>
                            <p className="text-sm text-muted-foreground">
                                {joinInfo.session.hostName}
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleLeave}>
                            مغادرة الجلسة
                        </Button>
                    </div>
                    <JitsiMeeting
                        config={joinInfo.config}
                        sessionTitle={joinInfo.session.titleAr}
                        onLeave={handleLeave}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-cairo flex items-center gap-2">
                        <Video className="w-8 h-8 text-primary" />
                        الحصص المباشرة
                    </h2>
                    <p className="text-muted-foreground mt-1">احجز وانضم إلى حصص تفاعلية مباشرة مع أفضل المعلمين.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === "schedule" ? "secondary" : "outline"}
                        className="gap-2 transition-all"
                        onClick={() => setActiveTab("schedule")}
                    >
                        <CalendarCheck className="w-4 h-4" />
                        تقويمي
                        {sessions.filter(s => s.isRegistered).length > 0 && (
                            <Badge variant="secondary" className="mr-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px]">
                                {sessions.filter(s => s.isRegistered).length}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="browse">تصفح الحصص</TabsTrigger>
                    <TabsTrigger value="schedule">جدولي ({sessions.filter(s => s.isRegistered).length})</TabsTrigger>
                </TabsList>

                {/* Search */}
                <div className="flex items-center gap-2 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث عن حصة أو معلم..."
                            className="pr-9 font-cairo"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">لا توجد حصص {activeTab === "schedule" ? "محجوزة حالياً" : "متاحة الآن"}</h3>
                            <p className="text-muted-foreground">تصفح الجدول للحصول على المزيد من الفرص التعليمية.</p>
                            {activeTab === "schedule" && (
                                <Button variant="link" onClick={() => setActiveTab("browse")} className="mt-2">
                                    تصفح الحصص المتاحة
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    canJoin={canJoinSession(session)}
                                    isLoading={actionLoading === session.id}
                                    onRegister={() => handleRegister(session)}
                                    onCancel={() => handleCancel(session.id)}
                                    onJoin={() => handleJoin(session)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Purchase Dialog */}
            <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                <DialogContent className="sm:max-w-[600px] font-cairo">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CreditCard className="w-6 h-6 text-primary" />
                            إتمام عملية الحجز
                        </DialogTitle>
                        <DialogDescription>
                            أنت على وشك حجز حصة "{selectedSession?.titleAr}". اختر خطة الدفع المناسبة لك.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 md:grid-cols-2">
                        {/* Single Session Option */}
                        <div className="border rounded-xl p-4 cursor-pointer hover:border-primary transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 bg-muted rounded-bl-xl text-xs font-medium">
                                لمرة واحدة
                            </div>
                            <div className="mb-4 mt-2">
                                <h3 className="font-bold text-lg">حصة واحدة</h3>
                                <p className="text-muted-foreground text-sm">حضور هذه الحصة فقط</p>
                            </div>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold">{selectedSession?.price}</span>
                                <span className="text-sm text-muted-foreground">{selectedSession?.currency}</span>
                            </div>
                            <Button className="w-full" onClick={() => selectedSession && confirmBooking(selectedSession.id)}>
                                دفع وحجز
                            </Button>
                        </div>

                        <div className="border rounded-xl p-4 flex flex-col justify-center items-center text-center text-muted-foreground bg-muted/20">
                            <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                            <p>الباقات قريباً</p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-start">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            جميع المدفوعات محمية ومشفرة.
                        </p>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Session Card Component
function SessionCard({
    session,
    canJoin,
    isLoading,
    onRegister,
    onCancel,
    onJoin
}: {
    session: Session;
    canJoin: boolean;
    isLoading: boolean;
    onRegister: () => void;
    onCancel: () => void;
    onJoin: () => void;
}) {
    const isLive = session.status === "live";
    const startTime = new Date(session.scheduledStartTime);

    return (
        <Card className={cn(
            "flex flex-col overflow-hidden transition-all hover:shadow-md border-t-4",
            isLive ? "border-t-red-500 shadow-red-100" : "border-t-primary/20",
            session.isRegistered && !isLive ? "bg-accent/5 border-t-emerald-500" : ""
        )}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={isLive ? "destructive" : "secondary"} className={cn(isLive && "animate-pulse")}>
                        {isLive ? "مباشر الآن 🔴" : "مجدولة"}
                    </Badge>
                    <div className="flex items-center gap-1">
                        {session.price === 0 ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">مجاني</Badge>
                        ) : (
                            <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                                {session.price} {session.currency}
                            </Badge>
                        )}
                    </div>
                </div>
                <CardTitle className="font-cairo text-lg leading-snug min-h-[3.5rem] line-clamp-2">
                    {session.titleAr}
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-sm text-secondary-foreground">
                        {session.grade}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-sm text-secondary-foreground">
                        {session.subject}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-4 p-2 bg-muted/40 rounded-lg">
                    <Avatar className="w-10 h-10 border">
                        <AvatarFallback>{session.hostName?.[0] || "م"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{session.hostName || "المعلم"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{startTime.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="mx-1">•</span>
                            <Clock className="w-3 h-3" />
                            <span dir="ltr">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Users className="w-3 h-3" />
                    <span>{session.registeredCount} / {session.maxParticipants} مسجل</span>
                    <span className="mx-1">•</span>
                    <Clock className="w-3 h-3" />
                    <span>{session.durationMinutes} دقيقة</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {session.descriptionAr}
                </p>
            </CardContent>
            <CardFooter className="pt-0 border-t bg-muted/10 p-4">
                {isLoading ? (
                    <Button className="w-full" disabled>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        جاري التحميل...
                    </Button>
                ) : isLive && session.isRegistered ? (
                    <Button
                        className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-lg shadow-red-200"
                        onClick={onJoin}
                    >
                        <Video className="w-4 h-4" />
                        انضم للحصة الآن
                    </Button>
                ) : session.isRegistered && canJoin ? (
                    <Button className="w-full gap-2" onClick={onJoin}>
                        <PlayCircle className="w-4 h-4" />
                        انضمام للجلسة
                    </Button>
                ) : session.isRegistered ? (
                    <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50 cursor-default">
                            <CalendarCheck className="w-4 h-4 mr-2" />
                            تم التسجيل
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:text-destructive">
                            <span className="sr-only">إلغاء</span>
                            <AlertCircle className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button className="w-full gap-2" variant="default" onClick={onRegister}>
                        <Calendar className="w-4 h-4" />
                        {session.price > 0 ? "حجز (مدفوع)" : "تسجيل مجاني"}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
