"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { TagSelector } from "./tag-selector";

interface PropertyCellEditorProps {
    rowId: Id<"documents">;
    propertyId: Id<"properties">;
    propertyType: string;
    onSave: (value: string | number | boolean | string[] | null, rowId: Id<"documents">, propertyId: Id<"properties">) => void;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
}

export const PropertyCellEditor = ({ 
    rowId, 
    propertyId, 
    propertyType, 
    onSave, 
    isEditing, 
    onEdit, 
    onCancel 
}: PropertyCellEditorProps) => {
    const propertyValues = useQuery(api.databases.getDocumentProperties, { documentId: rowId });
    const currentValue = propertyValues?.find(pv => pv.propertyId === propertyId)?.value;
    const [value, setValue] = useState<string | number | boolean | string[] | null>(currentValue || "");
    
    // プロパティの詳細情報（オプションなど）を取得
    const propertyDetails = useQuery(api.databases.getPropertyDetails, { propertyId });
    const updateProperty = useMutation(api.databases.updatePropertyOptions);

    // 編集開始時に現在の値を設定
    useEffect(() => {
        if (isEditing) {
            setValue(currentValue || "");
        }
    }, [isEditing, currentValue]);

    const handleSave = () => {
        onSave(value, rowId, propertyId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            setValue(currentValue || "");
            onCancel();
        }
    };

    // 表示用のコンポーネント
    const renderDisplayValue = () => {
        switch (propertyType) {
            case "checkbox":
                return (
                    <div className="flex items-center">
                        <Checkbox 
                            checked={Boolean(currentValue)} 
                            onCheckedChange={(checked) => onSave(checked, rowId, propertyId)}
                            className="mr-2"
                        />
                        <span className="text-sm text-muted-foreground">
                            {Boolean(currentValue) ? "Checked" : "Unchecked"}
                        </span>
                    </div>
                );

            case "date":
                // 日付の値をバリデーション
                const getValidDate = (value: unknown): Date | null => {
                    if (!value) return null;
                    try {
                        const dateStr = String(value);
                        // ISO形式かチェック
                        if (dateStr.includes('T') || dateStr.includes('Z')) {
                            return parseISO(dateStr);
                        }
                        // 通常の日付形式の場合
                        const parsed = new Date(dateStr);
                        return isNaN(parsed.getTime()) ? null : parsed;
                    } catch {
                        return null;
                    }
                };

                const validDate = getValidDate(currentValue);
                
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start text-left font-normal p-2 h-auto min-h-[32px]",
                                    !validDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {validDate ? format(validDate, "PPP") : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={validDate || undefined}
                                onSelect={(date) => {
                                    if (date) {
                                        onSave(date.toISOString(), rowId, propertyId);
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                );

            case "number":
                return (
                    <div 
                        onClick={onEdit}
                        className="cursor-pointer hover:bg-muted hover:border hover:border-border p-2 rounded-md min-h-[32px] flex items-center transition-colors group w-full"
                    >
                        <span className="text-sm text-foreground">
                            {currentValue !== null && currentValue !== undefined && currentValue !== "" ? (
                                typeof currentValue === 'number' ? currentValue : Number(currentValue) || 0
                            ) : (
                                <span className="text-muted-foreground group-hover:text-foreground italic">
                                    Empty
                                </span>
                            )}
                        </span>
                    </div>
                );

            case "url":
                return (
                    <div 
                        onClick={onEdit}
                        className="cursor-pointer hover:bg-muted hover:border hover:border-border p-2 rounded-md min-h-[32px] flex items-center transition-colors group w-full"
                    >
                        {currentValue ? (
                            <a 
                                href={String(currentValue).startsWith('http') ? String(currentValue) : `https://${currentValue}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {String(currentValue)}
                            </a>
                        ) : (
                            <span className="text-muted-foreground group-hover:text-foreground italic text-sm">
                                Empty
                            </span>
                        )}
                    </div>
                );

            case "email":
                return (
                    <div 
                        onClick={onEdit}
                        className="cursor-pointer hover:bg-muted hover:border hover:border-border p-2 rounded-md min-h-[32px] flex items-center transition-colors group w-full"
                    >
                        {currentValue ? (
                            <a 
                                href={`mailto:${currentValue}`}
                                className="text-blue-600 hover:text-blue-800 underline text-sm dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {String(currentValue)}
                            </a>
                        ) : (
                            <span className="text-muted-foreground group-hover:text-foreground italic text-sm">
                                Empty
                            </span>
                        )}
                    </div>
                );

            case "phone":
                return (
                    <div 
                        onClick={onEdit}
                        className="cursor-pointer hover:bg-muted hover:border hover:border-border p-2 rounded-md min-h-[32px] flex items-center transition-colors group w-full"
                    >
                        {currentValue ? (
                            <a 
                                href={`tel:${currentValue}`}
                                className="text-blue-600 hover:text-blue-800 underline text-sm dark:text-blue-400 dark:hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {String(currentValue)}
                            </a>
                        ) : (
                            <span className="text-muted-foreground group-hover:text-foreground italic text-sm">
                                Empty
                            </span>
                        )}
                    </div>
                );

            case "select":
            case "multiSelect":
                const options = propertyDetails?.options || [];
                const selectedIds = propertyType === "multiSelect" 
                    ? (Array.isArray(currentValue) ? currentValue : [])
                    : (currentValue ? [String(currentValue)] : []);

                return (
                    <TagSelector
                        options={options}
                        selectedIds={selectedIds}
                        onSelectionChange={(newSelectedIds) => {
                            const newValue = propertyType === "multiSelect" 
                                ? newSelectedIds 
                                : newSelectedIds[0] || null;
                            onSave(newValue, rowId, propertyId);
                        }}
                        onOptionsChange={(newOptions) => {
                            updateProperty({ propertyId, options: newOptions });
                        }}
                        isMultiple={propertyType === "multiSelect"}
                        placeholder={propertyType === "multiSelect" ? "Select options..." : "Select an option..."}
                    />
                );

            default: // text
                return (
                    <div 
                        onClick={onEdit}
                        className="cursor-pointer hover:bg-muted hover:border hover:border-border p-2 rounded-md min-h-[32px] flex items-center transition-colors group w-full"
                    >
                        <span className="text-sm text-foreground">
                            {String(currentValue) || (
                                <span className="text-muted-foreground group-hover:text-foreground italic">
                                    Empty
                                </span>
                            )}
                        </span>
                    </div>
                );
        }
    };

    // 編集用のコンポーネント
    const renderEditValue = () => {
        switch (propertyType) {
            case "number":
                return (
                    <Input
                        autoFocus
                        type="number"
                        value={String(value || "")}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="border border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm px-2 py-1 text-sm rounded-md"
                    />
                );

            case "url":
                return (
                    <Input
                        autoFocus
                        type="url"
                        placeholder="https://example.com"
                        value={String(value || "")}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="border border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm px-2 py-1 text-sm rounded-md"
                    />
                );

            case "email":
                return (
                    <Input
                        autoFocus
                        type="email"
                        placeholder="example@email.com"
                        value={String(value || "")}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="border border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm px-2 py-1 text-sm rounded-md"
                    />
                );

            case "phone":
                return (
                    <Input
                        autoFocus
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={String(value || "")}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="border border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm px-2 py-1 text-sm rounded-md"
                    />
                );

            default: // text
                return (
                    <Input
                        autoFocus
                        value={String(value || "")}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="border border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 shadow-sm px-2 py-1 text-sm rounded-md"
                    />
                );
        }
    };

    // チェックボックス、日付、セレクト、マルチセレクトは常に表示モードで操作
    if (["checkbox", "date", "select", "multiSelect"].includes(propertyType)) {
        return renderDisplayValue();
    }

    // その他のタイプは編集/表示モードを切り替え
    return isEditing ? renderEditValue() : renderDisplayValue();
};