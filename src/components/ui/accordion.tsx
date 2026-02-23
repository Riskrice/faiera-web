'use client';

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Since we might not have the primitive installed, let's create a pure customized version 
// OR try to use the primitive if user installs it. 
// Given the environment constraints, I will build a robust framer-motion version 
// to ensure it works beautifully without ensuring complex peer dependencies.

import { motion, AnimatePresence } from "framer-motion";

const AccordionContext = React.createContext<{
    openItem: string | undefined;
    toggleItem: (value: string) => void;
}>({ openItem: undefined, toggleItem: () => { } });

export function Accordion({
    children,
    type = "single",
    collapsible = true,
    defaultValue,
    className
}: {
    children: React.ReactNode;
    type?: "single" | "multiple";
    collapsible?: boolean;
    defaultValue?: string;
    className?: string;
}) {
    const [openItem, setOpenItem] = React.useState<string | undefined>(defaultValue);

    const toggleItem = (value: string) => {
        setOpenItem(prev => prev === value ? (collapsible ? undefined : prev) : value);
    };

    return (
        <AccordionContext.Provider value={{ openItem, toggleItem }}>
            <div className={cn("space-y-2", className)}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
}

export function AccordionItem({
    children,
    value,
    className
}: {
    children: React.ReactNode;
    value: string;
    className?: string;
}) {
    return (
        <div className={cn("border-b", className)}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { value });
                }
                return child;
            })}
        </div>
    );
}

export function AccordionTrigger({
    children,
    className,
    value // injected by Item
}: {
    children: React.ReactNode;
    className?: string;
    value?: string;
}) {
    const { openItem, toggleItem } = React.useContext(AccordionContext);
    const isOpen = openItem === value;

    return (
        <button
            onClick={() => value && toggleItem(value)}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
                isOpen && "[&[data-state=open]>svg]:rotate-180",
                className
            )}
        >
            {children}
            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
        </button>
    );
}

export function AccordionContent({
    children,
    className,
    value // injected by Item
}: {
    children: React.ReactNode;
    className?: string;
    value?: string;
}) {
    const { openItem } = React.useContext(AccordionContext);
    const isOpen = openItem === value;

    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className={cn("pb-4 pt-0", className)}>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
