'use client';

import { useState } from 'react';
import { Menu, X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardSidebar } from './dashboard-sidebar';
import { NotificationDropdown } from './notification-dropdown';
import { GlobalSearchCommand } from './global-search-command';
import { Breadcrumbs } from './breadcrumbs';

interface DashboardHeaderProps {
    sidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export function DashboardHeader({
    sidebarCollapsed = false,
    onToggleSidebar,
}: DashboardHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <div className="absolute inset-y-0 right-0 w-72 animate-in slide-in-from-right duration-300">
                        <div className="relative h-full">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 left-4 z-10"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>

                            <div
                                className="[&>aside]:!flex [&>aside]:!static [&>aside]:!h-full [&>aside]:!w-full"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <DashboardSidebar collapsed={false} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
