"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseColumnResizeProps {
    initialWidth: number;
    minWidth?: number;
    maxWidth?: number;
    onResize?: (width: number) => void;
    onResizeEnd?: (width: number) => void;
}

export const useColumnResize = ({
    initialWidth,
    minWidth = 80,
    maxWidth = 800,
    onResize,
    onResizeEnd,
}: UseColumnResizeProps) => {
    const [width, setWidth] = useState(initialWidth);
    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
        
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [width]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(
            minWidth,
            Math.min(maxWidth, startWidthRef.current + deltaX)
        );

        setWidth(newWidth);
        onResize?.(newWidth);
    }, [isResizing, minWidth, maxWidth, onResize]);

    const handleMouseUp = useCallback(() => {
        if (!isResizing) return;

        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        onResizeEnd?.(width);
    }, [isResizing, width, onResizeEnd]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // 外部からwidth変更があった場合の更新
    useEffect(() => {
        setWidth(initialWidth);
    }, [initialWidth]);

    return {
        width,
        isResizing,
        handleMouseDown,
        setWidth,
    };
};