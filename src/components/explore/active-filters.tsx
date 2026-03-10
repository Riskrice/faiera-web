'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CATEGORIES } from '@/data/courses';

export function ActiveFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const activeCategories = searchParams.get('category')?.split(',') || [];
    const activeLevels = searchParams.get('level')?.split(',') || [];
    const searchQuery = searchParams.get('q');

    const hasFilters = activeCategories.length > 0 || activeLevels.length > 0 || searchQuery;

    const removeFilter = (type: 'category' | 'level' | 'q', value?: string) => {
        const params = new URLSearchParams(searchParams);

        if (type === 'q') {
            params.delete('q');
        } else if (value) {
            const current = params.get(type)?.split(',') || [];
            const updated = current.filter(item => item !== value);
            if (updated.length > 0) {
                params.set(type, updated.join(','));
            } else {
                params.delete(type);
            }
        }

        replace(`${pathname}?${params.toString()}`);
    };

    const clearAll = () => {
        replace(pathname);
    };

    if (!hasFilters) return null;

    return (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 md:mb-5 md:gap-2 rounded-2xl md:border md:border-border/60 md:bg-card/50 md:px-4 md:py-3">
            <span className="w-full text-xs sm:text-sm font-medium text-muted-foreground md:w-auto md:ml-2">الفلاتر النشطة:</span>

            <AnimatePresence>
                {searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs sm:text-sm font-medium"
                    >
                        <span>بحث: {searchQuery}</span>
                        <button onClick={() => removeFilter('q')} className="hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}

                {activeCategories.map(catId => {
                    const label = CATEGORIES.find(c => c.id === catId)?.label || catId;
                    return (
                        <motion.div
                            key={`cat-${catId}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground border border-secondary/20 text-xs sm:text-sm font-medium"
                        >
                            <span>{label}</span>
                            <button onClick={() => removeFilter('category', catId)} className="hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}

                {activeLevels.map(level => {
                    const label = level === '1st Secondary' ? 'أولى ثانوي'
                        : level === '2nd Secondary' ? 'تانية ثانوي'
                            : 'تالتة ثانوي';
                    return (
                        <motion.div
                            key={`lvl-${level}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground border border-border text-xs sm:text-sm font-medium"
                        >
                            <span>{label}</span>
                            <button onClick={() => removeFilter('level', level)} className="hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <Button variant="link" onClick={clearAll} className="w-full justify-start text-muted-foreground hover:text-destructive text-sm h-auto p-0 pt-1 md:w-auto md:mr-auto md:pt-0 md:pr-0">
                مسح الكل
            </Button>
        </div>
    );
}
