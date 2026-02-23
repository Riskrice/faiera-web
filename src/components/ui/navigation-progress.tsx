"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (prevPathname.current !== pathname) {
            // Path changed — stop loading
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 400);
            prevPathname.current = pathname;
        }
    }, [pathname]);

    // On click of any link, start the progress
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            if (!target) return;
            const href = target.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;

            setLoading(true);
            setProgress(10);

            // Simulate progress increments
            let p = 10;
            intervalRef.current = setInterval(() => {
                p += Math.random() * 15;
                if (p >= 85) {
                    clearInterval(intervalRef.current!);
                    p = 85;
                }
                setProgress(p);
            }, 300);
        };

        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!loading && progress === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none"
            aria-label="صفحة تحمّل"
        >
            <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
            {/* Glowing dot at the tip */}
            <div
                className="absolute top-[-3px] h-[9px] w-[9px] rounded-full bg-emerald-400 shadow-[0_0_8px_3px_rgba(52,211,153,0.8)] transition-all duration-300 ease-out"
                style={{ left: `calc(${progress}% - 4px)` }}
            />
        </div>
    );
}
