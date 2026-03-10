'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function SearchHeader() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isFocused, setIsFocused] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (query) {
                params.set('q', query);
            } else {
                params.delete('q');
            }
            replace(`${pathname}?${params.toString()}`);
        }, 500);

        return () => clearTimeout(timeout);
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="w-full relative z-20 mb-3 md:mb-6">
            <div
                className={cn(
                    "relative group rounded-xl md:rounded-2xl transition-all duration-300 flex-1",
                    isFocused ? "shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] scale-[1.01]" : "hover:shadow-lg"
                )}
            >
                {/* Animated Border Gradient */}
                <div className={cn(
                    "absolute -inset-[1px] rounded-xl md:rounded-2xl bg-gradient-to-r from-primary via-emerald-500 to-secondary opacity-0 transition-opacity duration-300",
                    isFocused && "opacity-100 blur-sm"
                )} />

                    <div className="relative bg-background/92 backdrop-blur-xl border border-border/60 rounded-xl md:rounded-2xl overflow-hidden h-11 md:h-14">
                    <Search className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 md:right-5 transition-colors duration-300 pointer-events-none",
                        isFocused ? "text-primary" : "text-muted-foreground"
                    )} />

                    <Input
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="ابحث عن كورس أو مهارة..."
                        className="h-full border-0 bg-transparent text-sm md:text-base focus-visible:ring-0 focus-visible:ring-offset-0 pr-10 pl-10 md:pr-14 md:pl-14 placeholder:text-muted-foreground/50 font-cairo text-right"
                    />

                    <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 md:left-3">
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setQuery('')}
                                    className="p-1.5 md:p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
