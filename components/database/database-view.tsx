"use client";

import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { Plus, Settings, MoreHorizontal, Type, Hash, Calendar, CheckSquare, Link, Mail, Phone, Tag } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removed unused table imports
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyTypeSelector } from "./property-type-selector";
import { PropertyCellEditor } from "./property-cell-editor";
import { ResizableHeaderCell } from "./resizable-header-cell";
import { ResizableDataCell } from "./resizable-data-cell";

interface DatabaseViewProps {
    databaseId: Id<"documents">;
}

export const DatabaseView = ({ databaseId }: DatabaseViewProps) => {
    const [newRowTitle, setNewRowTitle] = useState("");
    const [editingCell, setEditingCell] = useState<{
        rowId: Id<"documents">;
        propertyId: Id<"properties">;
    } | null>(null);
    const [showPropertySelector, setShowPropertySelector] = useState(false);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    const rows = useQuery(api.databases.getDatabaseRows, { databaseId });
    const properties = useQuery(api.databases.getDatabaseProperties, { databaseId });
    
    // プロパティから初期幅を設定
    useEffect(() => {
        if (properties) {
            const initialWidths: Record<string, number> = {};
            properties.forEach(property => {
                if (property.width) {
                    initialWidths[property._id] = property.width;
                }
            });
            setColumnWidths(prev => ({ ...initialWidths, ...prev }));
        }
    }, [properties]);
    const createRow = useMutation(api.databases.createDatabaseRow);
    const createProperty = useMutation(api.databases.createProperty);
    const setPropertyValue = useMutation(api.databases.setPropertyValue);
    const deleteRow = useMutation(api.documents.remove);
    const deleteProperty = useMutation(api.databases.deleteProperty);
    const updatePropertyWidth = useMutation(api.databases.updatePropertyWidth);

    const handleCreateRow = async () => {
        if (!newRowTitle.trim()) return;

        try {
            await createRow({
                databaseId,
                title: newRowTitle,
            });
            setNewRowTitle("");
        } catch (error) {
            console.error("Failed to create row:", error);
        }
    };

    const handleCreateProperty = async (name: string, type: string) => {
        try {
            await createProperty({
                databaseId,
                name,
                type: type as "text" | "number" | "select" | "multiSelect" | "date" | "checkbox" | "url" | "email" | "phone",
            });
        } catch (error) {
            console.error("Failed to create property:", error);
        }
    };

    const handleCellEdit = async (value: string | number | boolean | string[] | null, rowId: Id<"documents">, propertyId: Id<"properties">) => {
        try {
            await setPropertyValue({
                documentId: rowId,
                propertyId,
                value,
            });
            setEditingCell(null);
        } catch (error) {
            console.error("Failed to update cell:", error);
        }
    };

    const handleDeleteRow = async (rowId: Id<"documents">) => {
        try {
            await deleteRow({ id: rowId });
        } catch (error) {
            console.error("Failed to delete row:", error);
        }
    };

    const handleDeleteProperty = async (propertyId: Id<"properties">) => {
        try {
            await deleteProperty({ propertyId });
        } catch (error) {
            console.error("Failed to delete property:", error);
        }
    };

    const handleColumnResize = async (propertyId: Id<"properties">, width: number) => {
        // ローカル状態を即座に更新してリアルタイム表示
        setColumnWidths(prev => ({ ...prev, [propertyId]: width }));
        
        try {
            await updatePropertyWidth({ propertyId, width });
        } catch (error) {
            console.error("Failed to update column width:", error);
            // エラーの場合はローカル状態をリセット
            setColumnWidths(prev => {
                const newState = { ...prev };
                delete newState[propertyId];
                return newState;
            });
        }
    };

    const handleColumnResizeRealtime = (propertyId: Id<"properties">, width: number) => {
        // ドラッグ中のリアルタイム更新
        setColumnWidths(prev => ({ ...prev, [propertyId]: width }));
    };

    if (rows === undefined || properties === undefined) {
        return <div>Loading database...</div>;
    }

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 border-b pb-3">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowPropertySelector(true)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Property
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Settings className="h-4 w-4 mr-1" />
                        Filter
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                        Sort
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    {rows?.length || 0} records
                </div>
            </div>

            {/* Database Table */}
            <div className="w-full overflow-auto">
                <div className="min-w-max">
                    {/* Header */}
                    <div className="flex border-b border-border">
                        {properties && properties.length > 0 ? (
                            <>
                                {properties.map((property) => (
                                    <ResizableHeaderCell
                                        key={property._id}
                                        property={{
                                            ...property,
                                            width: columnWidths[property._id] ?? property.width
                                        }}
                                        onColumnResize={handleColumnResize}
                                        onColumnResizeRealtime={handleColumnResizeRealtime}
                                        onDeleteProperty={handleDeleteProperty}
                                    >
                                        <PropertyTypeIcon type={property.type} />
                                        <span className="font-medium text-sm text-foreground truncate">
                                            {property.name}
                                        </span>
                                    </ResizableHeaderCell>
                                ))}
                                <div className="flex-shrink-0 w-16 px-3 py-2 bg-muted"></div>
                            </>
                        ) : (
                            <div className="flex-1 px-3 py-2 bg-muted text-center text-muted-foreground">
                                No properties. Click &quot;Property&quot; to add one.
                            </div>
                        )}
                    </div>
                    {/* Rows */}
                    <div className="divide-y divide-border">
                        {rows?.map((row) => (
                            <div key={row._id} className="flex hover:bg-muted/50 group">
                                {properties && properties.length > 0 ? (
                                    <>
                                        {properties.map((property) => {
                                            const defaultWidth = 192;
                                            const width = columnWidths[property._id] ?? property.width ?? defaultWidth;
                                            
                                            return (
                                                <ResizableDataCell
                                                    key={property._id}
                                                    width={width}
                                                >
                                                    {property.name === "Title" ? (
                                                        <span className="font-medium text-foreground">{row.title}</span>
                                                    ) : (
                                                        <PropertyCellEditor
                                                            rowId={row._id}
                                                            propertyId={property._id}
                                                            propertyType={property.type}
                                                            onSave={handleCellEdit}
                                                            isEditing={editingCell?.rowId === row._id && editingCell?.propertyId === property._id}
                                                            onEdit={() => setEditingCell({ rowId: row._id, propertyId: property._id })}
                                                            onCancel={() => setEditingCell(null)}
                                                        />
                                                    )}
                                                </ResizableDataCell>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="flex-1 px-3 py-3 text-center text-muted-foreground">
                                        No properties defined
                                    </div>
                                )}
                                {properties && properties.length > 0 && (
                                    <div className="flex-shrink-0 w-16 px-3 py-3 flex items-center">
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
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Open Page</DropdownMenuItem>
                                            <DropdownMenuItem>Duplicate Row</DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600"
                                                onClick={() => handleDeleteRow(row._id)}
                                            >
                                                Delete Row
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Add New Row */}
                        <div className="flex border-t border-border bg-muted/30">
                            {properties && properties.length > 0 ? (
                                <>
                                    {properties.map((property) => {
                                        const defaultWidth = 192;
                                        const width = columnWidths[property._id] ?? property.width ?? defaultWidth;
                                        
                                        return (
                                            <ResizableDataCell
                                                key={property._id}
                                                width={width}
                                            >
                                                {property.name === "Title" ? (
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Add a new row..."
                                                            value={newRowTitle}
                                                            onChange={(e) => setNewRowTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    handleCreateRow();
                                                                }
                                                            }}
                                                            className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-sm placeholder:text-muted-foreground"
                                                        />
                                                    </div>
                                                ) : null}
                                            </ResizableDataCell>
                                        );
                                    })}
                                    <div className="flex-shrink-0 w-16 px-3 py-3" />
                                </>
                            ) : (
                                <div className="flex-1 px-3 py-3 text-center text-muted-foreground">
                                    Add properties to start adding rows
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PropertyTypeSelector
                isOpen={showPropertySelector}
                onClose={() => setShowPropertySelector(false)}
                onCreateProperty={handleCreateProperty}
            />
        </div>
    );
};


const PropertyTypeIcon = ({ type }: { type: string }) => {
    const iconClass = "h-4 w-4 text-muted-foreground";
    
    switch (type) {
        case "text":
            return <Type className={iconClass} />;
        case "number":
            return <Hash className={iconClass} />;
        case "date":
            return <Calendar className={iconClass} />;
        case "checkbox":
            return <CheckSquare className={iconClass} />;
        case "url":
            return <Link className={iconClass} />;
        case "email":
            return <Mail className={iconClass} />;
        case "phone":
            return <Phone className={iconClass} />;
        case "select":
        case "multiSelect":
            return <Tag className={iconClass} />;
        default:
            return <Type className={iconClass} />;
    }
};