"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Calendar,
    Clock,
    Video,
    Search,
    ArrowRight,
    Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Mock Data (Shared with student view for consistency)
type Session = {
    id: string;
    title: string;
    description: string;
    tutorName: string;
    tutorAvatar?: string;
    startTime: Date;
    durationMinutes: number;
    status: "scheduled" | "live" | "ended";
    tags: string[];
    price: number;
    currency: string;
    isPackageAvailable: boolean;
    packagePrice?: number;
}

// Mock Data Generator
const getMockSessions = (): Session[] => [
    {
        id: "1",
        title: "مراجعة شاملة للغة الإنجليزية -  Unit 1 & 2",
        description: "سنقوم بحل نماذج امتحانات سابقة والتركيز على القواعد اللغوية الهامة.",
        tutorName: "مستر أحمد علي",
        startTime: new Date(new Date().setHours(new Date().getHours() + 24)),
        durationMinutes: 90,
        status: "scheduled",
        tags: ["اللغة الإنجليزية", "مراجعة", "الصف الثالث الثانوي"],
        price: 50,
        currency: "EGP",
        isPackageAvailable: true,
        packagePrice: 350
    },
    {
        id: "2",
        title: "حل مسائل فيزياء معقدة - الفصل الأول",
        description: "ورشة عمل تفاعلية لحل أصعب المسائل في التيار الكهربي وقانون أوم.",
        tutorName: "د. سارة محمود",
        startTime: new Date(new Date().setMinutes(new Date().getMinutes() - 10)),
        durationMinutes: 60,
        status: "live",
        tags: ["الفيزياء", "مسائل", "ثانوية عامة"],
        price: 0,
        currency: "EGP",
        isPackageAvailable: false
    },
    {
        id: "3",
        title: "أساسيات الجبر الهندسي",
        description: "شرح مبسط للمفاهيم الأساسية وتطبيقات عملية.",
        tutorName: "أ. محمد إبراهيم",
        startTime: new Date(new Date().setHours(new Date().getHours() + 48)),
        durationMinutes: 45,
        status: "scheduled",
        tags: ["الرياضيات", "جبر"],
        price: 40,
        currency: "EGP",
        isPackageAvailable: true,
        packagePrice: 300
    },
    {
        id: "4",
        title: "ورشة عمل: كتابة المقال الاحترافي",
        description: "كيف تكتب مقالاً يقنع المصحح ويضمن لك الدرجة النهائية.",
        tutorName: "أ. ليلى حسن",
        startTime: new Date(new Date().setHours(new Date().getHours() + 5)),
        durationMinutes: 60,
        status: "scheduled",
        tags: ["اللغة العربية", "تعبير"],
        price: 30,
        currency: "EGP",
        isPackageAvailable: false
    }
]

import { Navbar, Footer } from "@/components/layout"
import { useEffect } from "react"

export default function PublicSessionsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [sessions, setSessions] = useState<Session[]>([])

    // Load sessions on client mount to avoid hydration mismatch
    useEffect(() => {
        setSessions(getMockSessions())
    }, [])

    const filteredSessions = sessions.filter(session =>
        session.title.includes(searchQuery) ||
        session.tutorName.includes(searchQuery) ||
        session.tags.some(tag => tag.includes(searchQuery))
    );

    return (
        <div className="bg-background min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-primary/5 py-12 md:py-16 px-4 pt-28 md:pt-32">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <Badge variant="secondary" className="px-4 py-1.5 text-sm font-normal bg-white shadow-sm">
                        <Video className="w-4 h-4 mr-2 text-red-500" />
                        حصص مباشرة وتفاعلية
                    </Badge>
                    <h1 className="text-[2rem] md:text-5xl font-extrabold font-cairo tracking-tight text-primary leading-[1.35] md:leading-tight">
                        تعلم مباشرة مع نخبة المعلمين
                    </h1>
                    <p className="text-[15px] md:text-xl text-muted-foreground font-light leading-7 max-w-2xl mx-auto">
                        احجز مقعدك الآن في أقوى الحصص المباشرة، وتفاعل مع معلمك وكأنك في الفصل الدراسي.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-10 max-w-3xl mx-auto">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="ابحث عن مادة، معلم، أو عنوان درس..."
                            className="pr-12 h-11 md:h-12 text-sm md:text-lg font-cairo shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Sessions Grid */}
                <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSessions.map((session) => (
                        <PublicSessionCard key={session.id} session={session} />
                    ))}
                </div>

                {filteredSessions.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p>لا توجد حصص تطابق بحثك حالياً.</p>
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="border-t bg-muted/30 py-12 md:py-16 px-4 text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-4 font-cairo">لا تفوت أي حصة!</h2>
                <p className="text-sm md:text-base text-muted-foreground mb-6">سجل دخولك الآن لتتمكن من حجز الحصص وتلقي التنبيهات.</p>
                <Link href="/login">
                    <Button size="lg" className="gap-2">
                        تسجيل الدخول
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <Footer />
        </div>
    )
}

function PublicSessionCard({ session }: { session: Session }) {
    const isLive = session.status === "live";

    return (
        <Card className={cn(
            "flex flex-col overflow-hidden transition-all hover:shadow-lg border-t-4 group rounded-[20px]",
            isLive ? "border-t-red-500 shadow-red-100/50" : "border-t-primary/20"
        )}>
            <CardHeader className="pb-3 p-4 md:p-6">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant={isLive ? "destructive" : "secondary"} className={cn(isLive && "animate-pulse")}>
                        {isLive ? "مباشر الآن 🔴" : "مجدولة"}
                    </Badge>
                    {/* Price Badge */}
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
                <CardTitle className="font-cairo text-base md:text-lg leading-7 md:leading-snug min-h-[3.5rem] line-clamp-2 group-hover:text-primary transition-colors">
                    {session.title}
                </CardTitle>
                <div className="flex flex-wrap gap-1 mt-2">
                    {session.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-secondary rounded-sm text-secondary-foreground">
                            {tag}
                        </span>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-4 px-4 md:px-6">
                <div className="flex items-center gap-3 mb-4 p-2.5 bg-muted/40 rounded-lg">
                    <Avatar className="w-10 h-10 border">
                        <AvatarFallback>{session.tutorName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{session.tutorName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{session.startTime.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="mx-1">•</span>
                            <Clock className="w-3 h-3" />
                            <span dir="ltr">{session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                {/* Package Hint */}
                {session.isPackageAvailable && (
                    <div className="mb-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        وفر 30% مع الباقات الشهرية
                    </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                    {session.description}
                </p>
            </CardContent>
            <CardFooter className="pt-0 border-t bg-muted/10 p-4 md:px-6">
                <Link href="/login" className="w-full">
                    <Button className="w-full gap-2 h-11" variant="default">
                        <Calendar className="w-4 h-4" />
                        حجز مقعد
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
