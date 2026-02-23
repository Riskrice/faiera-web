'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '@/contexts/notification-context';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export default function NotificationsPage() {
    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        hasMore,
        loadMore
    } = useNotifications();

    const [loadingMore, setLoadingMore] = useState(false);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        await loadMore();
        setLoadingMore(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">الإشعارات</h1>
                    <p className="text-muted-foreground">
                        تابع جميع التنبيهات والأحداث الخاصة بحسابك
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="secondary"
                        onClick={() => markAllAsRead()}
                        className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-colors shrink-0"
                    >
                        <CheckCheck className="w-4 h-4 ml-2" />
                        تحديد الكل كمقروء ({unreadCount})
                    </Button>
                )}
            </div>

            {isLoading && notifications.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={cn(
                                "transition-colors cursor-pointer hover:bg-muted/50",
                                !notification.readAt ? "bg-primary/5 border-primary/20" : "bg-card"
                            )}
                            onClick={() => {
                                if (!notification.readAt) {
                                    markAsRead(notification.id);
                                }
                            }}
                        >
                            <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                                <div className={cn(
                                    "mt-1 p-2 rounded-full shrink-0",
                                    !notification.readAt ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                        <h3 className={cn(
                                            "font-semibold text-base",
                                            !notification.readAt ? "text-foreground" : "text-foreground/80"
                                        )}>
                                            {notification.titleAr}
                                        </h3>
                                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-sm leading-relaxed",
                                        !notification.readAt ? "text-foreground/90" : "text-muted-foreground"
                                    )}>
                                        {notification.bodyAr}
                                    </p>
                                </div>
                                {!notification.readAt && (
                                    <div className="flex w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-2" />
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {hasMore && (
                        <div className="pt-6 pb-2 text-center">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="min-w-[200px]"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                        جاري التحميل...
                                    </>
                                ) : (
                                    "تحميل المزيد"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="rounded-full bg-muted/50 p-4 mb-4">
                            <Bell className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">لا توجد إشعارات</h2>
                        <p className="text-muted-foreground max-w-sm">
                            صندوق الإشعارات الخاص بك فارغ. عندما تصلك تنبيهات جديدة، ستظهر هنا.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
