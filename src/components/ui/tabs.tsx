'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TabsContext = React.createContext<{
    selectedTab: string;
    setSelectedTab: (value: string) => void;
}>({ selectedTab: "", setSelectedTab: () => { } });

export function Tabs({
    defaultValue,
    value,
    onValueChange,
    className,
    children
}: {
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children: React.ReactNode;
}) {
    const [localValue, setLocalValue] = React.useState(defaultValue);
    const selectedTab = value !== undefined ? value : localValue;

    const setSelectedTab = (newValue: string) => {
        setLocalValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const { selectedTab, setSelectedTab } = React.useContext(TabsContext);
    const isSelected = selectedTab === value;

    return (
        <button
            onClick={() => setSelectedTab(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
                className
            )}
        >
            {isSelected && (
                <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-background rounded-sm shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
    const { selectedTab } = React.useContext(TabsContext);

    if (selectedTab !== value) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        >
            {children}
        </motion.div>
    );
}
