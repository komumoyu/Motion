"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Settings } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatabaseView } from "./database-view";
import { DatabaseViewCompact } from "./database-view-compact";
import { cn } from "@/lib/utils";

interface EmbeddedDatabaseProps {
    databaseId: Id<"documents">;
    showFullView?: boolean;
    maxRows?: number;
    className?: string;
}

export const EmbeddedDatabase = ({ 
    databaseId, 
    showFullView = false, 
    maxRows = 5,
    className 
}: EmbeddedDatabaseProps) => {
    const [isExpanded, setIsExpanded] = useState(showFullView);
    const [isFullView, setIsFullView] = useState(false);

    const database = useQuery(api.documents.getById, { documentId: databaseId });
    const rows = useQuery(api.databases.getDatabaseRows, { databaseId });

    if (database === undefined || rows === undefined) {
        return (
            <div className={cn("border border-border rounded-lg p-4", className)}>
                <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-8 bg-muted rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!database || database.type !== "database") {
        return (
            <div className={cn("border border-border rounded-lg p-4", className)}>
                <div className="text-center text-muted-foreground">
                    Database not found
                </div>
            </div>
        );
    }


    if (isFullView) {
        return (
            <div className={cn("border border-border rounded-lg", className)}>
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-foreground">{database.title}</h3>
                            <p className="text-sm text-muted-foreground">
                                {rows?.length || 0} records
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setIsFullView(false)}
                            >
                                <ChevronDown className="h-4 w-4" />
                                Collapse
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                asChild
                            >
                                <a 
                                    href={`/documents/${databaseId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    <DatabaseView databaseId={databaseId} />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("border border-border rounded-lg", className)}>
            {/* Header */}
            <div className="p-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-6 w-6 p-0"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                        <h3 className="font-medium text-foreground">{database.title}</h3>
                        <span className="text-xs text-muted-foreground">
                            {rows?.length || 0} records
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsFullView(true)}
                            className="h-6 px-2 text-xs"
                        >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
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
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-3">
                    <DatabaseViewCompact 
                        databaseId={databaseId}
                        maxRows={maxRows}
                        showProperties={3}
                    />
                </div>
            )}
        </div>
    );
};