'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className="w-full relative z-20 mb-8">
            <div
                className={cn(
                    "relative group rounded-2xl transition-all duration-300",
                    isFocused ? "shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] scale-[1.01]" : "hover:shadow-lg"
                )}
            >
                {/* Animated Border Gradient */}
                <div className={cn(
                    "absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-emerald-500 to-secondary opacity-0 transition-opacity duration-300",
                    isFocused && "opacity-100 blur-sm"
                )} />

                <div className="relative flex items-center bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden h-16">
                    <Search className={cn(
                        "w-6 h-6 ml-6 transition-colors duration-300",
                        isFocused ? "text-primary" : "text-muted-foreground"
                    )} />

                    <Input
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="ابحث عن كورس، مهارة، أو محاضر..."
                        className="h-full border-0 bg-transparent text-lg focus-visible:ring-0 focus-visible:ring-offset-0 px-4 placeholder:text-muted-foreground/50 font-cairo"
                    />

                    <div className="flex items-center gap-2 pl-2">
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setQuery('')}
                                    className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <div className="h-8 w-[1px] bg-border mx-2" />

                        <Button
                            variant="ghost"
                            className="gap-2 font-cairo text-muted-foreground hover:text-foreground hidden sm:flex"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>ترتيب حسب</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
