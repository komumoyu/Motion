"use client";

import { useState } from "react";
import { 
    Plus, 
    Database, 
    Table, 
    Image, 
    FileText, 
    Code,
    Quote,
    List,
    CheckSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DatabaseEmbedButton } from "./database/database-embed-button";
import { Id } from "@/convex/_generated/dataModel";

interface EditorToolbarProps {
    documentId?: Id<"documents">;
    onInsertDatabase?: (databaseId: Id<"documents">) => void;
    onInsertBlock?: (type: string) => void;
    className?: string;
}

export const EditorToolbar = ({ 
    documentId, 
    onInsertDatabase, 
    onInsertBlock,
    className 
}: EditorToolbarProps) => {
    const [showDatabaseEmbed, setShowDatabaseEmbed] = useState(false);

    const handleInsertBlock = (type: string) => {
        if (onInsertBlock) {
            onInsertBlock(type);
        }
    };

    return (
        <div className={`flex items-center gap-2 p-2 border border-border rounded-lg bg-background ${className}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setShowDatabaseEmbed(true)}>
                        <Database className="h-4 w-4 mr-2" />
                        Database
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertBlock('table')}>
                        <Table className="h-4 w-4 mr-2" />
                        Table
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleInsertBlock('image')}>
                        <Image className="h-4 w-4 mr-2" />
                        Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertBlock('file')}>
                        <FileText className="h-4 w-4 mr-2" />
                        File
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleInsertBlock('code')}>
                        <Code className="h-4 w-4 mr-2" />
                        Code Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertBlock('quote')}>
                        <Quote className="h-4 w-4 mr-2" />
                        Quote
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertBlock('bulletList')}>
                        <List className="h-4 w-4 mr-2" />
                        Bullet List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInsertBlock('checkList')}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Check List
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {showDatabaseEmbed && (
                <DatabaseEmbedButton
                    documentId={documentId}
                    onEmbed={(databaseId) => {
                        if (onInsertDatabase) {
                            onInsertDatabase(databaseId);
                        }
                        setShowDatabaseEmbed(false);
                    }}
                />
            )}
        </div>
    );
};