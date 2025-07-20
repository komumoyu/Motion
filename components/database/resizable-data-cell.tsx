"use client";

interface ResizableDataCellProps {
    width: number;
    children: React.ReactNode;
    className?: string;
}

export const ResizableDataCell = ({
    width,
    children,
    className = "",
}: ResizableDataCellProps) => {
    return (
        <div 
            className={`flex-shrink-0 px-3 py-3 border-r border-border last:border-r-0 ${className}`}
            style={{ width: `${width}px` }}
        >
            {children}
        </div>
    );
};