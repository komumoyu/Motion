"use client";

import { use, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import dynamic from "next/dynamic";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import { DatabasePage } from "@/components/database/database-page";
import { DocumentEmbeddedDatabases } from "@/components/document-embedded-databases";
import { ArticleMetadata } from "@/components/article/article-metadata";

interface DocumentIdPageProps {
    params: Promise<{
        documentId: string;
    }>;
}

const DocumentIdPage = ({
    params
}: DocumentIdPageProps) => {
    const { documentId } = use(params);
    
    const document = useQuery(api.documents.getById, {
        documentId: documentId as Id<"documents">
    });
    
    const update = useMutation(api.documents.update);
    const addEmbeddedDatabase = useMutation(api.documents.addEmbeddedDatabase);

    const Editor = useMemo(() => dynamic(() => import("@/components/editor"), {
        ssr: false
    }), []);

    const onChange = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        
        return (content: string) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                update({
                    id: documentId as Id<"documents">,
                    content
                });
            }, 300); // 300ms デバウンス
        };
    }, [update, documentId]);

    const handleInsertDatabase = async (databaseId: Id<"documents">) => {
        try {
            await addEmbeddedDatabase({
                documentId: documentId as Id<"documents">,
                databaseId,
                position: Date.now(), // 簡単な位置指定として現在時刻を使用
            });
        } catch (error) {
            console.error("Failed to embed database:", error);
        }
    };

    if (document === undefined) {
        return (
            <div>
                <Cover.Skeleton />
                <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
                    <div className="space-y-4 pl-8 pt-4">
                        <Skeleton className="h-14 w-[50%]" />
                        <Skeleton className="h-4 w-[80%]" />
                        <Skeleton className="h-4 w-[40%]" />
                        <Skeleton className="h-4 w-[60%]" />
                    </div>
                </div>
            </div>
        );
    }

    if (document === null) {
        return <div>Not found</div>;
    }

    return (
        <div className="pb-40">
            <Cover url={document.coverImage} />
            <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
                <Toolbar initialData={document} />
                {document.type === "database" ? (
                    <DatabasePage databaseId={document._id} />
                ) : (
                    <div className="space-y-6">
                        {/* 記事タイプの場合はメタデータコンポーネントを表示 */}
                        {document.type === "article" && (
                            <ArticleMetadata 
                                articleId={document._id}
                                article={document}
                            />
                        )}
                        <Editor
                            onChange={onChange}
                            initialContent={document.content}
                            documentId={document._id}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentIdPage;