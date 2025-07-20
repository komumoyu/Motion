"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagOption {
    id: string;
    name: string;
    color: string;
}

interface TagSelectorProps {
    options: TagOption[];
    selectedIds: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    onOptionsChange: (options: TagOption[]) => void;
    isMultiple?: boolean;
    placeholder?: string;
}

const TAG_COLORS = [
    { name: "Gray", value: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" },
    { name: "Red", value: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" },
    { name: "Orange", value: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700" },
    { name: "Yellow", value: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700" },
    { name: "Green", value: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
    { name: "Blue", value: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
    { name: "Purple", value: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700" },
    { name: "Pink", value: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700" },
];

export const TagSelector = ({
    options,
    selectedIds,
    onSelectionChange,
    onOptionsChange,
    isMultiple = false,
    placeholder = "Select options..."
}: TagSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOptions = options.filter(option => selectedIds.includes(option.id));

    const handleSelect = (optionId: string) => {
        if (isMultiple) {
            const newSelection = selectedIds.includes(optionId)
                ? selectedIds.filter(id => id !== optionId)
                : [...selectedIds, optionId];
            onSelectionChange(newSelection);
        } else {
            onSelectionChange(selectedIds.includes(optionId) ? [] : [optionId]);
            setOpen(false);
        }
    };

    const handleCreateTag = (name: string) => {
        if (!name.trim()) return;
        
        const newTag: TagOption = {
            id: `tag_${Date.now()}`,
            name: name.trim(),
            color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].value
        };
        
        const newOptions = [...options, newTag];
        onOptionsChange(newOptions);
        
        // 新しいタグを自動選択
        if (isMultiple) {
            onSelectionChange([...selectedIds, newTag.id]);
        } else {
            onSelectionChange([newTag.id]);
            setOpen(false);
        }
        
        setNewTagName("");
        setIsCreatingTag(false);
    };

    const handleRemoveTag = (optionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = selectedIds.filter(id => id !== optionId);
        onSelectionChange(newSelection);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCreateTag(newTagName);
        } else if (e.key === "Escape") {
            setIsCreatingTag(false);
            setNewTagName("");
        }
    };

    useEffect(() => {
        if (isCreatingTag && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreatingTag]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[32px] h-auto p-2"
                >
                    <div className="flex flex-wrap gap-1 flex-1">
                        {selectedOptions.length > 0 ? (
                            selectedOptions.map((option) => (
                                <Badge
                                    key={option.id}
                                    variant="outline"
                                    className={cn("text-xs px-2 py-1", option.color)}
                                >
                                    {option.name}
                                    {isMultiple && (
                                        <X
                                            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-600"
                                            onClick={(e) => handleRemoveTag(option.id, e)}
                                        />
                                    )}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-sm">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search options..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center">
                                <p className="text-sm text-muted-foreground mb-2">No options found</p>
                                <Button
                                    size="sm"
                                    onClick={() => setIsCreatingTag(true)}
                                    className="w-full"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new option
                                </Button>
                            </div>
                        </CommandEmpty>
                        
                        {options.length > 0 && (
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.id}
                                        onSelect={() => handleSelect(option.id)}
                                        className="flex items-center gap-2"
                                    >
                                        <Check
                                            className={cn(
                                                "h-4 w-4",
                                                selectedIds.includes(option.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", option.color)}
                                        >
                                            {option.name}
                                        </Badge>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        
                        {!isCreatingTag && (
                            <div className="p-2 border-t">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsCreatingTag(true)}
                                    className="w-full justify-start"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new option
                                </Button>
                            </div>
                        )}
                        
                        {isCreatingTag && (
                            <div className="p-2 border-t">
                                <Input
                                    ref={inputRef}
                                    placeholder="Enter option name..."
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="mb-2"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleCreateTag(newTagName)}
                                        disabled={!newTagName.trim()}
                                    >
                                        Create
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsCreatingTag(false);
                                            setNewTagName("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};