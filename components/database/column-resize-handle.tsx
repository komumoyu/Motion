"use client";

import { cn } from "@/lib/utils";

interface ColumnResizeHandleProps {
    onMouseDown: (e: React.MouseEvent) => void;
    isResizing?: boolean;
    className?: string;
}

export const ColumnResizeHandle = ({ 
    onMouseDown, 
    isResizing = false,
    className 
}: ColumnResizeHandleProps) => {
    return (
        <div
            className={cn(
                "absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors",
                "hover:bg-blue-500 active:bg-blue-600",
                "group-hover:opacity-100 opacity-0",
                isResizing && "bg-blue-500 opacity-100",
                className
            )}
            onMouseDown={onMouseDown}
        >
            <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
    );
};