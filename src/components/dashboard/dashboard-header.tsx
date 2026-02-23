'use client';

import { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardSidebar } from './dashboard-sidebar';
import { NotificationDropdown } from './notification-dropdown';

export function DashboardHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative hidden md:block w-96">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث في لوحة التحكم..."
                            className="pr-9 bg-muted/50 border-none focus-visible:bg-background transition-colors"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3">
                        <NotificationDropdown />
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Sidebar */}
                    <div className="absolute inset-y-0 right-0 w-72 animate-in slide-in-from-right duration-300">
                        <div className="relative h-full">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 left-4 z-10"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                            <div className="[&>aside]:!flex [&>aside]:!static [&>aside]:!h-full [&>aside]:!w-full" onClick={() => setMobileMenuOpen(false)}>
                                <DashboardSidebar />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
