"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubscriptionPackagesTab } from "@/components/teachers/subscription-packages-tab"
import { JitsiMeeting } from "@/components/sessions"
import { toast } from "sonner"
import { useAuth } from "@/contexts"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import {
    Calendar,
    Clock,
    Video,
    PlusCircle,
    Users,
    DollarSign,
    PlayCircle,
    Trash2,
    BarChart,
    Loader2,
    StopCircle
} from "lucide-react"

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
}

type JitsiConfig = {
    domain: string;
    roomName: string;
    displayName: string;
    isHost: boolean;
    configOverwrite: Record<string, unknown>;
    interfaceConfigOverwrite: Record<string, unknown>;
}

type CreateSessionDto = {
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    scheduledStartTime: string;
    durationMinutes: number;
    subject: string;
    grade: string;
    maxParticipants: number;
    price: number;
    currency: string;
}

export default function TeacherSessionsPage() {
    const { accessToken, user, signOut } = useAuth()
    const router = useRouter()
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)

    // Form state
    const [newSession, setNewSession] = useState<Partial<CreateSessionDto>>({
        titleAr: "",
        titleEn: "",
        descriptionAr: "",
        durationMinutes: 60,
        subject: "",
        grade: "",
        maxParticipants: 50,
        price: 0,
        currency: "EGP",
    })

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
            const response = await api.get<{ data: { sessions: Session[] } | any }>("/sessions/my");
            const data: any = response;
            setSessions(data.data?.sessions || data.data || [])
        } catch (error: any) {
            console.error("Error fetching sessions:", error)
            const isAuthError = error.message === "Unauthorized" || error.message?.includes("401");

            if (isAuthError) {
                toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً");
                signOut();
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

    // Create new session
    const handleCreate = async () => {
        if (!accessToken) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }

        if (!newSession.titleAr) {
            toast.error("يرجى إدخال عنوان الحصة")
            return
        }

        if (!newSession.scheduledStartTime) {
            toast.error("يرجى اختيار موعد الحصة")
            return
        }

        try {
            setCreateLoading(true)

            const response = await fetch(`${apiUrl}/sessions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newSession,
                    titleEn: newSession.titleEn || newSession.titleAr,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "فشل إنشاء الجلسة")
            }

            toast.success("تم جدولة الحصة بنجاح 🗓️", {
                description: "تم إنشاء رابط Jitsi تلقائياً"
            })

            setIsCreateOpen(false)
            setNewSession({
                titleAr: "",
                titleEn: "",
                descriptionAr: "",
                durationMinutes: 60,
                subject: "",
                grade: "",
                maxParticipants: 50,
                price: 0,
                currency: "EGP",
            })
            fetchSessions()
        } catch (error: any) {
            toast.error(error.message || "فشل إنشاء الجلسة")
        } finally {
            setCreateLoading(false)
        }
    }

    // Delete session
    const handleDelete = async (id: string) => {
        if (!accessToken) return

        try {
            setActionLoading(id)
            const response = await fetch(`${apiUrl}/sessions/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error("فشل حذف الجلسة")

            toast.success("تم حذف الحصة")
            fetchSessions()
        } catch (error) {
            toast.error("فشل حذف الجلسة")
        } finally {
            setActionLoading(null)
        }
    }

    // Start session (Go Live)
    const handleGoLive = async (session: Session) => {
        if (!accessToken) return

        try {
            setActionLoading(session.id)

            // Start the session
            await fetch(`${apiUrl}/sessions/${session.id}/start`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            // Get join link
            const response = await fetch(`${apiUrl}/sessions/${session.id}/join-link`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error("فشل بدء البث")

            const data = await response.json()

            toast.info("أنت الآن في بث مباشر! 🎥", {
                description: "تم إرسال إشعار لجميع الطلاب المسجلين."
            })

            setJoinInfo({
                session,
                config: data.data.config,
            })
        } catch (error: any) {
            toast.error(error.message || "فشل بدء البث")
        } finally {
            setActionLoading(null)
        }
    }

    // End session
    const handleEndSession = async () => {
        if (!joinInfo || !accessToken) return

        try {
            await fetch(`${apiUrl}/sessions/${joinInfo.session.id}/end`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            })

            toast.success("تم إنهاء الجلسة")
        } catch (error) {
            console.error("Error ending session:", error)
        }

        setJoinInfo(null)
        fetchSessions()
    }

    // Calculate Stats
    const totalEarnings = sessions.reduce((acc, s) => acc + (s.price * s.registeredCount), 0)
    const totalStudents = sessions.reduce((acc, s) => acc + s.registeredCount, 0)

    // If in Jitsi meeting
    if (joinInfo) {
        return (
            <div className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                {joinInfo.session.titleAr}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {joinInfo.session.registeredCount} طالب مسجل
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleEndSession}>
                            <StopCircle className="w-4 h-4 mr-2" />
                            إنهاء الجلسة
                        </Button>
                    </div>
                    <JitsiMeeting
                        config={joinInfo.config}
                        sessionTitle={joinInfo.session.titleAr}
                        onLeave={handleEndSession}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-cairo flex items-center gap-2">
                    <Video className="w-8 h-8 text-primary" />
                    إدارة الحصص والباقات
                </h1>
                <p className="text-muted-foreground mt-1">جدولة الحصص المباشرة، وإدارة باقات الاشتراك للطلاب.</p>
            </div>

            <Tabs defaultValue="sessions" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="sessions">الحصص المباشرة</TabsTrigger>
                    <TabsTrigger value="packages">الباقات</TabsTrigger>
                </TabsList>

                <TabsContent value="sessions" className="space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">الأرباح المتوقعة</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalEarnings} EGP</div>
                                <p className="text-xs text-muted-foreground">من الحصص المجدولة القادمة</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">الطلاب المسجلين</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalStudents}</div>
                                <p className="text-xs text-muted-foreground">في جميع الحصص القادمة</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">إجمالي الحصص</CardTitle>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{sessions.length}</div>
                                <p className="text-xs text-muted-foreground">مجدولة للشهر الحالي</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions & List */}
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="gap-2">
                                    <PlusCircle className="w-5 h-5" />
                                    حصة جديدة
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px]">
                                <DialogHeader>
                                    <DialogTitle className="font-cairo">جدولة حصة جديدة</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                                    <div className="grid gap-2">
                                        <Label>عنوان الحصة (عربي) *</Label>
                                        <Input
                                            placeholder="مثال: مراجعة نهائية فيزياء"
                                            value={newSession.titleAr || ""}
                                            onChange={e => setNewSession({ ...newSession, titleAr: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>عنوان الحصة (انجليزي)</Label>
                                        <Input
                                            placeholder="Optional: English title"
                                            value={newSession.titleEn || ""}
                                            onChange={e => setNewSession({ ...newSession, titleEn: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>الوصف</Label>
                                        <Textarea
                                            placeholder="وصف مختصر للحصة..."
                                            value={newSession.descriptionAr || ""}
                                            onChange={e => setNewSession({ ...newSession, descriptionAr: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>التاريخ والوقت *</Label>
                                            <Input
                                                type="datetime-local"
                                                onChange={e => setNewSession({
                                                    ...newSession,
                                                    scheduledStartTime: new Date(e.target.value).toISOString()
                                                })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>المدة (دقيقة)</Label>
                                            <Select
                                                value={newSession.durationMinutes?.toString() || "60"}
                                                onValueChange={v => setNewSession({ ...newSession, durationMinutes: parseInt(v) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر المدة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="30">30 دقيقة</SelectItem>
                                                    <SelectItem value="45">45 دقيقة</SelectItem>
                                                    <SelectItem value="60">60 دقيقة</SelectItem>
                                                    <SelectItem value="90">90 دقيقة</SelectItem>
                                                    <SelectItem value="120">ساعتين</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>المادة</Label>
                                            <Input
                                                placeholder="مثال: الفيزياء"
                                                value={newSession.subject || ""}
                                                onChange={e => setNewSession({ ...newSession, subject: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>الصف</Label>
                                            <Input
                                                placeholder="مثال: الثالث الثانوي"
                                                value={newSession.grade || ""}
                                                onChange={e => setNewSession({ ...newSession, grade: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>الحد الأقصى للطلاب</Label>
                                            <Input
                                                type="number"
                                                value={newSession.maxParticipants}
                                                onChange={e => setNewSession({ ...newSession, maxParticipants: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>السعر (EGP)</Label>
                                            <Input
                                                type="number"
                                                value={newSession.price}
                                                onChange={e => setNewSession({ ...newSession, price: parseInt(e.target.value) })}
                                            />
                                            <p className="text-[10px] text-muted-foreground">0 = مجاني</p>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreate} className="w-full" disabled={createLoading}>
                                        {createLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                جاري الإنشاء...
                                            </>
                                        ) : (
                                            "جدولة الحصة"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Sessions List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold">لا توجد حصص مجدولة</h3>
                            <p className="text-muted-foreground">أنشئ حصة جديدة لتبدأ.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sessions.map(session => (
                                <Card key={session.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                    {session.status === "live" && (
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 animate-pulse" />
                                    )}
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant={session.status === "live" ? "destructive" : session.status === "ended" ? "outline" : "secondary"}>
                                                {session.status === "live" ? "مباشر الآن 🔴" : session.status === "ended" ? "انتهت" : "مجدولة"}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                                                {session.price > 0 ? `${session.price} ${session.currency}` : "مجاني"}
                                            </div>
                                        </div>
                                        <CardTitle className="line-clamp-1 py-1">{session.titleAr}</CardTitle>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(session.scheduledStartTime).toLocaleDateString('ar-EG')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {session.durationMinutes} دقيقة
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg text-sm">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                المسجلين
                                            </span>
                                            <span className="font-bold">{session.registeredCount} / {session.maxParticipants}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="gap-2">
                                        {actionLoading === session.id ? (
                                            <Button className="w-full" disabled>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                جاري التحميل...
                                            </Button>
                                        ) : session.status === "scheduled" ? (
                                            <Button
                                                className="w-full gap-2"
                                                variant="default"
                                                onClick={() => handleGoLive(session)}
                                            >
                                                <PlayCircle className="w-4 h-4" />
                                                بدء البث
                                            </Button>
                                        ) : session.status === "live" ? (
                                            <Button
                                                className="w-full gap-2"
                                                variant="destructive"
                                                onClick={() => handleGoLive(session)}
                                            >
                                                <Video className="w-4 h-4" />
                                                الانضمام للبث
                                            </Button>
                                        ) : (
                                            <Button className="w-full" variant="outline" disabled>
                                                انتهت الجلسة
                                            </Button>
                                        )}
                                        {session.status !== "live" && session.status !== "ended" && (
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => handleDelete(session.id)}
                                                disabled={actionLoading === session.id}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="packages">
                    <SubscriptionPackagesTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
