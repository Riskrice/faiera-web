"use client"

import { useState } from "react"
import { Bell, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/contexts/notification-context"
import { NotificationItem } from "./notification-item"

export function NotificationBell() {
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            fetchNotifications(1)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-in zoom-in-50">
                            {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">الإشعارات</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[400px] p-0 flex flex-col font-cairo">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold">الإشعارات</SheetTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8 text-primary"
                                onClick={markAllAsRead}
                            >
                                <Check className="w-3 h-3 mr-1" />
                                تحديد الكل كمقروء
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto max-h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground p-4 text-center">
                            <div className="bg-muted p-4 rounded-full mb-4">
                                <Bell className="h-8 w-8 opacity-50" />
                            </div>
                            <p className="font-medium">لا توجد إشعارات</p>
                            <p className="text-sm">سنخبرك عند وصول تحديثات جديدة</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">يتم عرض آخر 20 إشعار</p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
