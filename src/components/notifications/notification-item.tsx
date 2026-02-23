"use client"

import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { Bell, Calendar, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Notification } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface NotificationItemProps {
    notification: Notification
    onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const isRead = !!notification.readAt

    const getIcon = () => {
        switch (notification.type) {
            case 'session_reminder':
            case 'session_started':
                return <Calendar className="h-5 w-5 text-blue-500" />
            case 'booking_confirmed':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'payment_success':
                return <CheckCircle className="h-5 w-5 text-emerald-500" />
            case 'payment_failed':
                return <AlertTriangle className="h-5 w-5 text-red-500" />
            default:
                return <Bell className="h-5 w-5 text-primary" />
        }
    }

    return (
        <div
            className={cn(
                "flex gap-4 p-4 border-b hover:bg-accent/5 transition-colors relative group",
                !isRead && "bg-accent/5"
            )}
        >
            <div className={cn(
                "mt-1 p-2 rounded-full bg-background border shadow-sm h-fit",
                !isRead && "border-primary/20"
            )}>
                {getIcon()}
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium leading-none", !isRead && "font-bold")}>
                        {notification.titleAr || notification.titleEn}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                    </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.bodyAr || notification.bodyEn}
                </p>

                {notification.actionUrl && (
                    <Button variant="link" className="h-auto p-0 text-xs text-primary mt-2">
                        عرض التفاصيل
                    </Button>
                )}
            </div>

            {!isRead && (
                <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="تحديد كمقروء"
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation()
                            onMarkAsRead(notification.id)
                        }}
                    >
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="sr-only">تحديد كمقروء</span>
                    </Button>
                </div>
            )}

            {!isRead && (
                <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-primary md:hidden" />
            )}
        </div>
    )
}
