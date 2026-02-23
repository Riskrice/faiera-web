'use client';

import { useState } from 'react';
import { Bell, Check, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationDropdown() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        hasMore,
        loadMore
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);

    // Get the top 10 for the dropdown
    const displayNotifications = notifications.slice(0, 10);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0" style={{ direction: 'rtl' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <DropdownMenuLabel className="p-0 font-medium text-base">
                        الإشعارات
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary hover:text-primary/80 px-2"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                            }}
                        >
                            <CheckCheck className="w-4 h-4 ml-1" />
                            تحديد الكل كمقروء
                        </Button>
                    )}
                </div>
                <div className="h-[400px] overflow-y-auto">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : displayNotifications.length > 0 ? (
                        <div className="flex flex-col">
                            {displayNotifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted/50 rounded-none border-b last:border-0",
                                        !notification.readAt ? "bg-primary/5" : ""
                                    )}
                                    onClick={() => {
                                        if (!notification.readAt) {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                >
                                    <div className="flex w-full justify-between items-start gap-2">
                                        <div className="flex-1 space-y-1">
                                            <p className={cn(
                                                "text-sm font-medium leading-none",
                                                !notification.readAt ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {notification.titleAr}
                                            </p>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {notification.bodyAr}
                                            </p>
                                        </div>
                                        {!notification.readAt && (
                                            <span className="flex h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                                    </p>
                                </DropdownMenuItem>
                            ))}
                            {hasMore && (
                                <div className="p-2 flex justify-center border-t border-border/50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                                        asChild
                                    >
                                        <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                                            عرض كل الإشعارات
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-base font-medium text-foreground">لا توجد إشعارات</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                عندما تصلك إشعارات جديدة، ستظهر هنا.
                            </p>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
