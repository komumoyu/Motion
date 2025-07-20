"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Database } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatabaseSelector } from "./database-selector";

interface DatabaseEmbedButtonProps {
    documentId?: Id<"documents">;
    onEmbed?: (databaseId: Id<"documents">) => void;
    className?: string;
}

export const DatabaseEmbedButton = ({ 
    documentId, 
    onEmbed, 
    className 
}: DatabaseEmbedButtonProps) => {
    const [showSelector, setShowSelector] = useState(false);
    
    const createDocument = useMutation(api.documents.create);

    const handleCreateNewDatabase = async () => {
        try {
            const database = await createDocument({
                title: "Untitled Database",
                type: "database",
                parentDocument: documentId,
            });
            
            if (onEmbed) {
                onEmbed(database);
            } else {
                // 新しいタブでデータベースページを開く
                window.open(`/documents/${database}`, '_blank');
            }
        } catch (error) {
            console.error("Failed to create database:", error);
        }
    };

    const handleSelectDatabase = (databaseId: Id<"documents">) => {
        if (onEmbed) {
            onEmbed(databaseId);
        } else {
            // 新しいタブでデータベースページを開く
            window.open(`/documents/${databaseId}`, '_blank');
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setShowSelector(true)}
                className={className}
            >
                <Database className="h-4 w-4 mr-2" />
                Embed Database
            </Button>

            <DatabaseSelector
                isOpen={showSelector}
                onClose={() => setShowSelector(false)}
                onSelect={handleSelectDatabase}
                onCreateNew={handleCreateNewDatabase}
            />
        </>
    );
};