"use client";

import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { X, GripVertical } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { EmbeddedDatabase } from "./database/embedded-database";

interface DocumentEmbeddedDatabasesProps {
    documentId: Id<"documents">;
    isEditable?: boolean;
}

export const DocumentEmbeddedDatabases = ({ 
    documentId, 
    isEditable = true 
}: DocumentEmbeddedDatabasesProps) => {
    const embeddedDatabases = useQuery(api.documents.getEmbeddedDatabases, { documentId });
    const removeEmbeddedDatabase = useMutation(api.documents.removeEmbeddedDatabase);
    const updateEmbeddedDatabasePosition = useMutation(api.documents.updateEmbeddedDatabasePosition);
    
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);
    const [optimisticOrder, setOptimisticOrder] = useState<typeof embeddedDatabases | null>(null);

    const handleRemoveDatabase = async (databaseId: Id<"documents">) => {
        try {
            await removeEmbeddedDatabase({
                documentId,
                databaseId,
            });
        } catch (error) {
            console.error("Failed to remove embedded database:", error);
        }
    };

    const handleDragStart = (e: React.DragEvent, embedId: string) => {
        setDraggedItem(embedId);
        e.dataTransfer.effectAllowed = "move";
        // エディターへのテキスト挿入を防ぐため、カスタムデータ形式を使用
        e.dataTransfer.setData("application/database-preview", embedId);
    };

    const handleDragOver = (e: React.DragEvent, embedId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverItem(embedId);
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = async (e: React.DragEvent, targetEmbedId: string) => {
        e.preventDefault();
        console.log('=== DROP EVENT ===');
        console.log('draggedItem:', draggedItem);
        console.log('targetEmbedId:', targetEmbedId);
        
        if (!draggedItem || draggedItem === targetEmbedId || !embeddedDatabases) {
            console.log('Drop cancelled - early return');
            setDraggedItem(null);
            setDragOverItem(null);
            return;
        }

        try {
            // バックエンドからの順序をそのまま使用（既にソート済み）
            const currentEmbeds = [...embeddedDatabases];
            console.log('Current embeds before reorder:', currentEmbeds.map(e => ({ id: e._id, pos: e.position })));
            
            const draggedIndex = currentEmbeds.findIndex(embed => embed._id === draggedItem);
            const targetIndex = currentEmbeds.findIndex(embed => embed._id === targetEmbedId);
            
            console.log('Drag indices:', { draggedIndex, targetIndex });
            
            if (draggedIndex === -1 || targetIndex === -1) {
                console.log('Invalid indices - return');
                return;
            }

            // 楽観的更新：即座にUIを更新
            const reorderedEmbeds = [...currentEmbeds];
            const [draggedEmbed] = reorderedEmbeds.splice(draggedIndex, 1);
            reorderedEmbeds.splice(targetIndex, 0, draggedEmbed);
            
            console.log('Reordered embeds:', reorderedEmbeds.map(e => ({ id: e._id, pos: e.position })));
            
            // 楽観的更新を適用
            setOptimisticOrder(reorderedEmbeds);

            // 全ての位置を更新
            const updatePromises = reorderedEmbeds.map((embed, index) => {
                console.log(`Updating ${embed._id} to position ${index}`);
                return updateEmbeddedDatabasePosition({
                    embeddedDatabaseId: embed._id,
                    newPosition: index
                });
            });

            await Promise.all(updatePromises);
            console.log('All position updates completed');
            
            // 更新完了後、楽観的更新をクリア
            setOptimisticOrder(null);
        } catch (error) {
            console.error("Failed to reorder embedded database:", error);
            // エラー時は楽観的更新をリセット
            setOptimisticOrder(null);
        }

        setDraggedItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItem(null);
    };

    if (!embeddedDatabases || embeddedDatabases.length === 0) {
        return null;
    }

    // 楽観的更新があればそれを使用、なければクエリ結果を使用
    const displayDatabases = optimisticOrder || embeddedDatabases;
    
    // デバッグ用ログ
    console.log('Original embeddedDatabases:', embeddedDatabases?.map(db => ({ id: db._id, position: db.position })));
    console.log('OptimisticOrder:', optimisticOrder?.map(db => ({ id: db._id, position: db.position })));
    console.log('DisplayDatabases:', displayDatabases?.map(db => ({ id: db._id, position: db.position })));

    return (
        <div className="space-y-6">
            {displayDatabases
                .map((embed) => (
                <div 
                    key={embed._id} 
                    className={`relative group transition-all duration-200 p-2 rounded-lg ${
                        draggedItem === embed._id ? 'opacity-50 scale-95' : ''
                    } ${
                        dragOverItem === embed._id ? 'border-2 border-blue-500 border-dashed bg-blue-50' : 'border-2 border-transparent'
                    }`}
                    draggable={false}
                    onDragOver={(e) => {
                        // ドラッグ中のアイテムがある場合のみドロップ許可
                        if (draggedItem) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDragOver(e, embed._id);
                        }
                    }}
                    onDragEnter={(e) => {
                        if (draggedItem) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDragLeave();
                    }}
                    onDrop={(e) => {
                        if (draggedItem) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(e, embed._id);
                        }
                    }}
                    onDragEnd={handleDragEnd}
                >
                    {isEditable && (
                        <>
                            {/* ドラッグハンドル */}
                            <div 
                                className="absolute -left-6 top-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
                                draggable={true}
                                onDragStart={(e) => {
                                    console.log('Handle drag start:', embed._id);
                                    e.stopPropagation();
                                    handleDragStart(e, embed._id);
                                }}
                                onDragEnd={(e) => {
                                    console.log('Handle drag end');
                                    e.stopPropagation();
                                    handleDragEnd();
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            {/* 削除ボタン */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDatabase(embed.databaseId);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="absolute -top-2 -right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                    <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        style={{ pointerEvents: 'auto' }}
                        draggable={false}
                    >
                        <EmbeddedDatabase 
                            databaseId={embed.databaseId}
                            showFullView={false}
                            maxRows={5}
                        />
                    </div>
                </div>
            ))}
            
            {/* ドラッグ中に追加のドロップゾーンを表示 */}
            {draggedItem && (
                <div
                    className={`p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 transition-all ${
                        dragOverItem === 'drop-zone' ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverItem('drop-zone');
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverItem(null);
                    }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (!embeddedDatabases || !draggedItem) return;
                        
                        try {
                            // 楽観的更新：最後に移動
                            const currentEmbeds = [...embeddedDatabases];
                            const draggedIndex = currentEmbeds.findIndex(embed => embed._id === draggedItem);
                            
                            if (draggedIndex !== -1) {
                                const [draggedEmbed] = currentEmbeds.splice(draggedIndex, 1);
                                currentEmbeds.push(draggedEmbed);
                                setOptimisticOrder(currentEmbeds);
                            }
                            
                            // 最後の位置に移動
                            const maxPosition = Math.max(...embeddedDatabases.map(db => db.position));
                            await updateEmbeddedDatabasePosition({
                                embeddedDatabaseId: draggedItem as Id<"embeddedDatabases">,
                                newPosition: maxPosition + 1
                            });
                            
                            setOptimisticOrder(null);
                        } catch (error) {
                            console.error("Failed to move to end:", error);
                            setOptimisticOrder(null);
                        }
                        
                        setDraggedItem(null);
                        setDragOverItem(null);
                    }}
                >
                    Drop here to move to end
                </div>
            )}
        </div>
    );
};