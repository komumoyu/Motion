"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { ExternalLink, Users } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { PropertyCellEditor } from "./property-cell-editor";
import { ResizableHeaderCellCompact } from "./resizable-header-cell-compact";
import { ResizableDataCell } from "./resizable-data-cell";

interface DatabaseViewCompactProps {
    databaseId: Id<"documents">;
    maxRows?: number;
    showProperties?: number; // 表示するプロパティの数
}

export const DatabaseViewCompact = ({ 
    databaseId, 
    maxRows = 5,
    showProperties = 3
}: DatabaseViewCompactProps) => {
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
    const database = useQuery(api.documents.getById, { documentId: databaseId });
    const updatePropertyWidth = useMutation(api.databases.updatePropertyWidth);

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


    if (rows === undefined || properties === undefined || database === undefined) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="animate-pulse h-4 bg-muted rounded w-1/3"></div>
                    <div className="animate-pulse h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse h-8 bg-muted rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const displayRows = rows?.slice(0, maxRows) || [];
    const displayProperties = properties?.slice(0, showProperties) || [];

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{database?.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {rows?.length || 0}
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm"
                    asChild
                    className="h-6 px-2"
                >
                    <a 
                        href={`/documents/${databaseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </Button>
            </div>

            {/* Compact Table */}
            {displayRows.length > 0 ? (
                <div className="border border-border rounded-md overflow-auto">
                    <div className="min-w-max">
                        {/* Table Header */}
                        {displayProperties.length > 0 && (
                            <div className="flex bg-muted/50 border-b border-border">
                                {displayProperties.map((property, index) => (
                                    <ResizableHeaderCellCompact
                                        key={property._id}
                                        property={{
                                            ...property,
                                            width: columnWidths[property._id] ?? property.width
                                        }}
                                        onColumnResize={handleColumnResize}
                                        onColumnResizeRealtime={handleColumnResizeRealtime}
                                        className={index === 0 ? "flex-1" : ""}
                                    >
                                        {index === 0 && property.name === "Title" ? "Title" : property.name}
                                    </ResizableHeaderCellCompact>
                                ))}
                            </div>
                        )}

                        {/* Table Rows */}
                        <div className="divide-y divide-border">
                            {displayRows.map((row) => (
                                <div key={row._id} className="flex hover:bg-muted/30 transition-colors">
                                    {displayProperties.map((property, index) => {
                                        const defaultWidth = 192;
                                        const width = columnWidths[property._id] ?? property.width ?? defaultWidth;
                                        
                                        return (
                                            <ResizableDataCell
                                                key={property._id}
                                                width={width}
                                                className={index === 0 ? "flex-1" : ""}
                                            >
                                                {index === 0 && property.name === "Title" ? (
                                                    <a 
                                                        href={`/documents/${row._id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors"
                                                    >
                                                        {row.title}
                                                    </a>
                                                ) : (
                                                    <PropertyCellEditor
                                                        rowId={row._id}
                                                        propertyId={property._id}
                                                        propertyType={property.type}
                                                        onSave={() => {}} // Read-only in compact view
                                                        isEditing={false}
                                                        onEdit={() => {}}
                                                        onCancel={() => {}}
                                                    />
                                                )}
                                            </ResizableDataCell>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Show More Footer */}
                    {rows && rows.length > maxRows && (
                        <div className="p-2 border-t border-border bg-muted/30">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="w-full text-xs h-6"
                            >
                                <a 
                                    href={`/documents/${databaseId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Show {rows.length - maxRows} more records
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-6 text-sm">
                    No records in this database
                </div>
            )}
        </div>
    );
};