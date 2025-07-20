"use client";

import { ColumnResizeHandle } from "./column-resize-handle";
import { useColumnResize } from "@/hooks/use-column-resize";
import { Id } from "@/convex/_generated/dataModel";

interface Property {
    _id: Id<"properties">;
    name: string;
    type: string;
    width?: number;
}

interface ResizableHeaderCellCompactProps {
    property: Property;
    onColumnResize: (propertyId: Id<"properties">, width: number) => void;
    onColumnResizeRealtime?: (propertyId: Id<"properties">, width: number) => void;
    children: React.ReactNode;
    className?: string;
}

export const ResizableHeaderCellCompact = ({
    property,
    onColumnResize,
    onColumnResizeRealtime,
    children,
    className = "",
}: ResizableHeaderCellCompactProps) => {
    const defaultWidth = 128; // w-32 equivalent for compact view
    const currentWidth = property.width || defaultWidth;

    const { width, isResizing, handleMouseDown } = useColumnResize({
        initialWidth: currentWidth,
        minWidth: 80,
        maxWidth: 400, // Smaller max width for compact view
        onResize: (newWidth) => {
            // リアルタイムでの幅変更を即座に反映
            onColumnResizeRealtime?.(property._id, newWidth);
        },
        onResizeEnd: (newWidth) => {
            if (newWidth !== currentWidth) {
                onColumnResize(property._id, newWidth);
            }
        },
    });

    return (
        <div 
            className={`flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border last:border-r-0 relative group ${className}`}
            style={{ width: `${width}px` }}
        >
            {children}
            
            <ColumnResizeHandle 
                onMouseDown={handleMouseDown}
                isResizing={isResizing}
            />
        </div>
    );
};