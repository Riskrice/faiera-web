"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    Clock,
    Users,
    Video,
    Loader2,
    CheckCircle,
    XCircle,
    PlayCircle
} from "lucide-react";
import { format, formatDistanceToNow, isWithinInterval, addMinutes, subMinutes } from "date-fns";
import { ar } from "date-fns/locale";

interface Session {
    id: string;
    titleAr: string;
    titleEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduledStartTime: string;
    scheduledEndTime: string;
    durationMinutes: number;
    hostName?: string;
    registeredCount: number;
    maxParticipants: number;
    grade: string;
    subject: string;
    jitsiRoomName: string;
    jitsiDomain: string;
}

interface SessionCardProps {
    session: Session;
    isRegistered?: boolean;
    onRegister?: (sessionId: string) => Promise<void>;
    onUnregister?: (sessionId: string) => Promise<void>;
    onJoin?: (sessionId: string) => void;
}

export function SessionCard({
    session,
    isRegistered = false,
    onRegister,
    onUnregister,
    onJoin,
}: SessionCardProps) {
    const [loading, setLoading] = useState(false);

    const startTime = new Date(session.scheduledStartTime);
    const endTime = new Date(session.scheduledEndTime);
    const now = new Date();

    // Can join 10 minutes before start
    const joinWindowStart = subMinutes(startTime, 10);
    const canJoin = session.status === 'live' ||
        (session.status === 'scheduled' && now >= joinWindowStart);

    const isLive = session.status === 'live';
    const isEnded = session.status === 'ended';
    const isCancelled = session.status === 'cancelled';
    const isFull = session.registeredCount >= session.maxParticipants;

    const handleRegister = async () => {
        if (!onRegister) return;
        setLoading(true);
        try {
            await onRegister(session.id);
        } finally {
            setLoading(false);
        }
    };

    const handleUnregister = async () => {
        if (!onUnregister) return;
        setLoading(true);
        try {
            await onUnregister(session.id);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        switch (session.status) {
            case 'live':
                return (
                    <Badge variant="destructive" className="animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white mr-1 animate-ping" />
                        مباشر الآن
                    </Badge>
                );
            case 'scheduled':
                return <Badge variant="secondary">مجدولة</Badge>;
            case 'ended':
                return <Badge variant="outline">انتهت</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="text-destructive">ملغاة</Badge>;
        }
    };

    return (
        <Card className={`relative overflow-hidden ${isLive ? 'ring-2 ring-red-500' : ''}`}>
            {isLive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            )}

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg leading-tight">
                            {session.titleAr}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                                {session.grade}
                            </Badge>
                            <span>•</span>
                            <span>{session.subject}</span>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>

            <CardContent className="pb-3 space-y-3">
                {session.descriptionAr && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.descriptionAr}
                    </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(startTime, 'EEEE، d MMMM', { locale: ar })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{format(startTime, 'h:mm a', { locale: ar })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <span>{session.durationMinutes} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{session.registeredCount} / {session.maxParticipants}</span>
                    </div>
                </div>

                {session.hostName && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>
                                {session.hostName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{session.hostName}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-3 border-t">
                {isEnded || isCancelled ? (
                    <Button variant="outline" className="w-full" disabled>
                        {isEnded ? 'انتهت الجلسة' : 'تم إلغاء الجلسة'}
                    </Button>
                ) : isRegistered ? (
                    <div className="flex gap-2 w-full">
                        {canJoin ? (
                            <Button
                                className="flex-1"
                                onClick={() => onJoin?.(session.id)}
                            >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                انضمام للجلسة
                            </Button>
                        ) : (
                            <Button variant="outline" className="flex-1" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                مسجل - تبدأ {formatDistanceToNow(startTime, { locale: ar, addSuffix: true })}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleUnregister}
                            disabled={loading || canJoin}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </Button>
                    </div>
                ) : (
                    <Button
                        className="w-full"
                        onClick={handleRegister}
                        disabled={loading || isFull}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : isFull ? (
                            'الجلسة ممتلئة'
                        ) : (
                            'التسجيل في الجلسة'
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
