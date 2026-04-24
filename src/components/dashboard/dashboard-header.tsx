'use client';

import { useState, useEffect } from 'react';
import { Menu, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSidebar } from './dashboard-sidebar';
import { NotificationDropdown } from './notification-dropdown';
import { GlobalSearchCommand } from './global-search-command';
import { Breadcrumbs } from './breadcrumbs';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface DashboardHeaderProps {
    sidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export function DashboardHeader({
    sidebarCollapsed = false,
    onToggleSidebar,
}: DashboardHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    // Close the mobile menu automatically when the pathname changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    return (
        <>
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="lg:hidden">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </Button>
                    </div>

                    {onToggleSidebar && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="hidden lg:inline-flex"
                            onClick={onToggleSidebar}
                            title={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
                        >
                            {sidebarCollapsed ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
                        </Button>
                    )}

                    <div className="hidden xl:block">
                        <Breadcrumbs />
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <GlobalSearchCommand />
                    <NotificationDropdown />
                </div>
            </header>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="right" aria-describedby="sidebar-description" className="p-0 w-[280px] sm:w-[320px] bg-background border-l border-border [&>button]:top-5 [&>button]:left-4 [&>button]:z-50 [&>button]:text-foreground/70 hover:[&>button]:text-foreground">
                    <div className="sr-only">
                        <SheetTitle>القائمة الجانبية</SheetTitle>
                        <SheetDescription id="sidebar-description">
                            روابط التنقل الخاصة بلوحة التحكم
                        </SheetDescription>
                    </div>
                    <div className="h-full w-full [&>aside]:!flex [&>aside]:!static [&>aside]:!h-full [&>aside]:!w-full [&>aside]:!border-none [&>aside]:!bg-transparent">
                        <DashboardSidebar collapsed={false} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
