"use client";

import { useQuery } from "convex/react";
import { Table, Kanban, List } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatabaseView } from "./database-view";

interface DatabasePageProps {
    databaseId: Id<"documents">;
}

export const DatabasePage = ({ databaseId }: DatabasePageProps) => {
    const database = useQuery(api.documents.getById, { documentId: databaseId });
    const views = useQuery(api.databases.getDatabaseViews, { databaseId });

    if (database === undefined || views === undefined) {
        return <div>Loading...</div>;
    }

    if (!database || database.type !== "database") {
        return <div>Database not found</div>;
    }

    const defaultView = views.find(view => view.isDefault) || views[0];

    return (
        <div className="w-full">
            {/* データベースヘッダー */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{database.title}</h1>
                
                {/* ビュータブ */}
                <div className="flex items-center gap-2 border-b">
                    {views.map((view) => (
                        <Button
                            key={view._id}
                            variant={view.isDefault ? "default" : "ghost"}
                            size="sm"
                            className="gap-2"
                        >
                            {view.type === "table" && <Table className="h-4 w-4" />}
                            {view.type === "kanban" && <Kanban className="h-4 w-4" />}
                            {view.type === "list" && <List className="h-4 w-4" />}
                            {view.name}
                        </Button>
                    ))}
                    <Button variant="ghost" size="sm">
                        + Add view
                    </Button>
                </div>
            </div>

            {/* ビューコンテンツ */}
            {defaultView?.type === "table" && (
                <DatabaseView databaseId={databaseId} />
            )}
            
            {defaultView?.type === "kanban" && (
                <div className="text-center text-muted-foreground py-8">
                    Kanban view coming soon...
                </div>
            )}
            
            {defaultView?.type === "list" && (
                <div className="text-center text-muted-foreground py-8">
                    List view coming soon...
                </div>
            )}
        </div>
    );
};