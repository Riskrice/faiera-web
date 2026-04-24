'use client';

import { useEffect, useState } from 'react';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

const SIDEBAR_STORAGE_KEY = 'faiera:dashboard:sidebar-collapsed';

export function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (saved !== null) {
            setSidebarCollapsed(saved === '1');
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
    }, [sidebarCollapsed, hydrated]);

    const toggleSidebar = () => {
        setSidebarCollapsed((previous) => !previous);
    };

    return (
        <div className="min-h-screen bg-background flex">
            <DashboardSidebar collapsed={sidebarCollapsed} />

            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <DashboardHeader sidebarCollapsed={sidebarCollapsed} onToggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}