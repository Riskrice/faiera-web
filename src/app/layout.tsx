import type { Metadata } from "next";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import { AuthProvider, NotificationProvider } from "@/contexts";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlex = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Faiera - منصة تعليمية",
  description: "منصة تعليمية مبنية على أحدث التقنيات للتعلم عن بعد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${ibmPlex.variable} font-cairo antialiased bg-background text-foreground`}>
        <AuthProvider>
          <NotificationProvider>
            <NavigationProgress />
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
