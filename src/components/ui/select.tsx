'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
    items: Map<string, React.ReactNode>;
    registerItem: (value: string, children: React.ReactNode) => void;
    unregisterItem: (value: string) => void;
} | null>(null);

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    // Use a map to store value -> display label mapping
    const [items, setItems] = React.useState<Map<string, React.ReactNode>>(new Map());

    const registerItem = React.useCallback((value: string, children: React.ReactNode) => {
        setItems(prev => {
            if (prev.get(value) === children) return prev;
            return new Map(prev).set(value, children);
        });
    }, []);

    const unregisterItem = React.useCallback((value: string) => {
        setItems(prev => {
            const newMap = new Map(prev);
            newMap.delete(value);
            return newMap;
        });
    }, []);

    const contextValue = React.useMemo(() => ({
        value, onValueChange, open, setOpen, items, registerItem, unregisterItem
    }), [value, onValueChange, open, setOpen, items, registerItem, unregisterItem]);

    return (
        <SelectContext.Provider value={contextValue}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    return (
        <button
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within Select");

    const display = context.items.get(context.value) || context.value || placeholder;

    return <span className='pointer-events-none'>{display}</span>;
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
    const context = React.useContext(SelectContext);
    const ref = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                context?.setOpen(false);
            }
        };

        if (context?.open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [context?.open]);

    // if (!context?.open) return null; // Removed to allow mounting for label registration

    return (
        <div
            ref={ref}
            className={cn(
                "absolute top-full left-0 z-[100] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1",
                !context?.open && "hidden",
                className
            )}
        >
            <div className="p-1">{children}</div>
        </div>
    );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const { registerItem, unregisterItem } = context;

    React.useEffect(() => {
        registerItem(value, children);
        return () => unregisterItem(value);
    }, [value, children, registerItem, unregisterItem]);

    const isSelected = context.value === value;

    return (
        <div
            onClick={() => {
                context.onValueChange(value);
                context.setOpen(false);
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground cursor-pointer text-right justify-start",
                className
            )}
        >
            {children}
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                </span>
            )}
        </div>
    );
}
