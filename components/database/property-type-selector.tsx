"use client";

import { useState } from "react";
import { Type, Hash, Calendar, CheckSquare, Link, Mail, Phone, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const PROPERTY_TYPES = [
    { type: "text", label: "Text", icon: Type, description: "Plain text with no formatting" },
    { type: "number", label: "Number", icon: Hash, description: "Numbers for calculations" },
    { type: "select", label: "Select", icon: Tag, description: "Choose one option from a list" },
    { type: "multiSelect", label: "Multi-select", icon: Tag, description: "Choose multiple options" },
    { type: "date", label: "Date", icon: Calendar, description: "A date picker" },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Check or uncheck" },
    { type: "url", label: "URL", icon: Link, description: "A web address" },
    { type: "email", label: "Email", icon: Mail, description: "An email address" },
    { type: "phone", label: "Phone", icon: Phone, description: "A phone number" },
];

interface PropertyTypeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateProperty: (name: string, type: string) => void;
}

export const PropertyTypeSelector = ({ isOpen, onClose, onCreateProperty }: PropertyTypeSelectorProps) => {
    const [propertyName, setPropertyName] = useState("");
    const [selectedType, setSelectedType] = useState("text");

    const handleCreate = () => {
        // プロパティ名が空の場合はタイプ名を使用
        const finalPropertyName = propertyName.trim() || getPropertyTypeName(selectedType);
        onCreateProperty(finalPropertyName, selectedType);
        setPropertyName("");
        setSelectedType("text");
        onClose();
    };

    const getPropertyTypeName = (type: string): string => {
        const propertyType = PROPERTY_TYPES.find(pt => pt.type === type);
        return propertyType?.label || "Property";
    };

    const handleClose = () => {
        setPropertyName("");
        setSelectedType("text");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md z-[99999]">
                <DialogHeader>
                    <DialogTitle>Add Property</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Property Name Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Property Name
                        </label>
                        <Input
                            placeholder={`Property name (default: ${getPropertyTypeName(selectedType)})`}
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleCreate();
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Property Type Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Property Type
                        </label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[100000]">
                                {PROPERTY_TYPES.map((propertyType) => {
                                    const Icon = propertyType.icon;
                                    return (
                                        <SelectItem key={propertyType.type} value={propertyType.type}>
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col items-start">
                                                    <span className="font-medium">{propertyType.label}</span>
                                                    <span className="text-xs text-muted-foreground">{propertyType.description}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selected Type Preview */}
                    <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            {(() => {
                                const selectedTypeData = PROPERTY_TYPES.find(t => t.type === selectedType);
                                if (selectedTypeData) {
                                    const Icon = selectedTypeData.icon;
                                    return (
                                        <>
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">{selectedTypeData.label}</span>
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {PROPERTY_TYPES.find(t => t.type === selectedType)?.description}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>
                            Create Property
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};