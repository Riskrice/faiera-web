import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NotificationProvider } from "@/contexts/notification-context";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NotificationProvider>
            <div className="min-h-screen bg-background flex">
                <DashboardSidebar />

                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    <DashboardHeader />
                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
}
