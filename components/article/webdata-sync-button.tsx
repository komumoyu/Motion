"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface WebDataSyncButtonProps {
    variant?: "sync_all" | "sync_single";
    articleId?: string;
}

export const WebDataSyncButton = ({ 
    variant = "sync_all",
    articleId 
}: WebDataSyncButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [apiEndpoint, setApiEndpoint] = useState("http://localhost:8080/api/sync-articles.php");
    const [isLoading, setIsLoading] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    const exportAll = useQuery(api.webdataExport.exportAllArticlesToWebDataBase);
    const exportSingle = useMutation(api.webdataExport.exportArticleToWebDataBase);

    const syncToWebDataBase = async () => {
        if (!apiEndpoint.trim()) {
            toast.error("APIエンドポイントを入力してください");
            return;
        }

        setIsLoading(true);
        setSyncResult(null);

        try {
            let syncData;

            if (variant === "sync_all") {
                // 全記事の同期
                if (!exportAll) {
                    throw new Error("記事データの取得に失敗しました");
                }

                syncData = {
                    action: "sync",
                    articlesData: exportAll.articles
                };
            } else {
                // 単一記事の同期
                if (!articleId) {
                    throw new Error("記事IDが指定されていません");
                }

                const articleData = await exportSingle({ articleId: articleId as any });
                
                syncData = {
                    action: "create_page",
                    articleData: articleData.metadata,
                    phpContent: articleData.phpContent
                };
            }

            // WebData_Base APIに送信
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(syncData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                setSyncResult(result);
                toast.success("WebData_Baseへの同期が完了しました");
            } else {
                throw new Error(result.message || "同期に失敗しました");
            }

        } catch (error) {
            console.error("Sync error:", error);
            toast.error(error instanceof Error ? error.message : "同期に失敗しました");
            setSyncResult({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const isSyncAll = variant === "sync_all";
    const buttonText = isSyncAll ? "WebData_Baseに同期" : "WebData_Baseに同期";
    const dialogTitle = isSyncAll ? "全記事をWebData_Baseに同期" : "記事をWebData_Baseに同期";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {buttonText}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        {dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="api-endpoint">WebData_Base API エンドポイント</Label>
                        <Input
                            id="api-endpoint"
                            value={apiEndpoint}
                            onChange={(e) => setApiEndpoint(e.target.value)}
                            placeholder="http://localhost:8080/api/sync-articles.php"
                            disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                            WebData_BaseプロジェクトのAPIエンドポイントを指定してください
                        </p>
                    </div>

                    {isSyncAll && exportAll && (
                        <div className="space-y-3">
                            <h4 className="font-medium">同期対象の記事</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                <div className="space-y-2">
                                    {exportAll.articles.map((article: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{article.title}</span>
                                            <span className="text-muted-foreground">{article.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {exportAll.articles.length}件の記事が同期されます
                            </p>
                        </div>
                    )}

                    {syncResult && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 p-4 rounded-lg ${
                                syncResult.success 
                                    ? 'bg-green-50 text-green-800 border border-green-200' 
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {syncResult.success ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                <div>
                                    <div className="font-medium">
                                        {syncResult.success ? "同期完了" : "同期失敗"}
                                    </div>
                                    <div className="text-sm">
                                        {syncResult.message}
                                    </div>
                                    {syncResult.count && (
                                        <div className="text-sm mt-1">
                                            {syncResult.count}件の記事を処理しました
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            WebData_Baseプロジェクトが起動している必要があります
                        </div>
                        <Button
                            onClick={syncToWebDataBase}
                            disabled={isLoading || !apiEndpoint.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    同期中...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    同期開始
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};