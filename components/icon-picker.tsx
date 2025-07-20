"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

// Dynamic import with SSR disabled to avoid module loading issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
    ssr: false,
    loading: () => <div className="w-[350px] h-[350px] flex items-center justify-center">Loading...</div>
});

import { Theme } from "emoji-picker-react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";

interface IconPickerProps {
    onChange: (icon: string) => void;
    children: React.ReactNode;
    asChild?: boolean;
}

export const IconPicker = ({
    onChange,
    children,
    asChild
}: IconPickerProps) => {
    const { resolvedTheme } = useTheme();
    
    const currentTheme = (resolvedTheme || "light") as keyof typeof themeMap;
    
    const themeMap = {
        "dark": Theme.DARK,
        "light": Theme.LIGHT,
    };
    
    const theme = themeMap[currentTheme];

    return (
        <Popover>
            <PopoverTrigger asChild={asChild}>
                {children}
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full border-none shadow-none">
                <EmojiPicker
                    height={350}
                    theme={theme}
                    onEmojiClick={(data) => onChange(data.emoji)}
                />
            </PopoverContent>
        </Popover>
    );
};