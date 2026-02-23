'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CATEGORIES } from '@/data/courses';

// Custom Checkbox Component since we can't install shadcn right now
function CustomCheckbox({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group py-2">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-5 h-5 rounded-md border border-muted-foreground/30 flex items-center justify-center transition-all duration-200",
                        checked ? "bg-primary border-primary" : "group-hover:border-primary/50"
                    )}
                >
                    {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
                </div>
                <span className={cn("text-sm transition-colors font-medium", checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                    {label}
                </span>
            </div>
            {count && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </label>
    );
}

export function FilterSidebar() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // Get active filters
    const activeCategories = searchParams.get('category')?.split(',') || [];
    const activeLevels = searchParams.get('level')?.split(',') || [];

    const updateFilter = useCallback((type: 'category' | 'level', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const current = params.get(type)?.split(',').filter(Boolean) || [];

        let updated = [];
        if (current.includes(value)) {
            updated = current.filter(item => item !== value);
        } else {
            updated = [...current, value];
        }

        if (updated.length > 0) {
            params.set(type, updated.join(','));
        } else {
            params.delete(type);
        }

        replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, replace]);

    return (
        <div className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-10 scrollbar-hide">

            {/* Header */}
            <div className="flex items-center gap-2 mb-6 text-primary">
                <Filter className="w-5 h-5" />
                <h3 className="font-bold font-cairo text-lg">تصفية النتائج</h3>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                <h4 className="font-bold text-sm text-foreground/80 font-cairo">التصنيفات</h4>
                <div className="space-y-1">
                    {CATEGORIES.map((cat) => (
                        <CustomCheckbox
                            key={cat.id}
                            label={cat.label}
                            checked={activeCategories.includes(cat.id)}
                            onChange={() => updateFilter('category', cat.id)}
                        // removed random count to fix hydration mismatch
                        />
                    ))}
                </div>
            </div>

            <div className="h-[1px] bg-border/50" />

            {/* Years / Levels */}
            <div className="space-y-4">
                <h4 className="font-bold text-sm text-foreground/80 font-cairo">الصف الدراسي</h4>
                <div className="space-y-1">
                    {[
                        { id: '1st Secondary', label: 'الصف الأول الثانوي' },
                        { id: '2nd Secondary', label: 'الصف الثاني الثانوي' },
                        { id: '3rd Secondary', label: 'الصف الثالث الثانوي' }
                    ].map((level) => (
                        <CustomCheckbox
                            key={level.id}
                            label={level.label}
                            checked={activeLevels.includes(level.id)}
                            onChange={() => updateFilter('level', level.id)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}
