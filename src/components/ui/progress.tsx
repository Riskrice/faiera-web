"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number | null, indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
    <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value || 0}
        className={cn(
            "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
            className
        )}
        {...props}
    >
        <div
            className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            data-state={value === 100 ? "complete" : "loading"}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
