"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ColumnResizeHandle } from "./column-resize-handle";
import { useColumnResize } from "@/hooks/use-column-resize";
import { Id } from "@/convex/_generated/dataModel";

interface Property {
    _id: Id<"properties">;
    name: string;
    type: string;
    width?: number;
}

interface ResizableHeaderCellProps {
    property: Property;
    onColumnResize: (propertyId: Id<"properties">, width: number) => void;
    onColumnResizeRealtime?: (propertyId: Id<"properties">, width: number) => void;
    onDeleteProperty: (propertyId: Id<"properties">) => void;
    children: React.ReactNode;
}

export const ResizableHeaderCell = ({
    property,
    onColumnResize,
    onColumnResizeRealtime,
    onDeleteProperty,
    children,
}: ResizableHeaderCellProps) => {
    const defaultWidth = 192; // w-48 equivalent
    const currentWidth = property.width || defaultWidth;

    const { width, isResizing, handleMouseDown } = useColumnResize({
        initialWidth: currentWidth,
        minWidth: 80,
        maxWidth: 800,
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
            className="flex-shrink-0 px-3 py-2 bg-muted border-r border-border last:border-r-0 relative group"
            style={{ width: `${width}px` }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {children}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem>Edit Property</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate Property</DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => onDeleteProperty(property._id)}
                        >
                            Delete Property
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <ColumnResizeHandle 
                onMouseDown={handleMouseDown}
                isResizing={isResizing}
            />
        </div>
    );
};