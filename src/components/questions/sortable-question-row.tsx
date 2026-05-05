"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TableRow, TableCell } from "@/components/ui/table"
import { GripVertical } from "lucide-react"

interface SortableQuestionRowProps {
    id: string
    isDragMode: boolean
    children: React.ReactNode
}

export function SortableQuestionRow({ id, isDragMode, children }: SortableQuestionRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? "relative" as const : "static" as const,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" : "none",
        backgroundColor: isDragging ? "hsl(var(--muted))" : undefined,
    }

    return (
        <TableRow ref={setNodeRef} style={style}>
            {children}
            {isDragMode && (
                <TableCell className="w-[50px] text-center">
                    <button
                        type="button"
                        className="cursor-grab hover:text-primary transition-colors focus:outline-none p-2 rounded-md hover:bg-muted"
                        aria-label="اسحب لإعادة الترتيب"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                </TableCell>
            )}
        </TableRow>
    )
}
