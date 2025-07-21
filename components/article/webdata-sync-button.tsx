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
    const [apiEndpoint, setApiEndpoint] = useState("https://komumoyu.com/api/sync-articles.php");
    const [isLoading, setIsLoading] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    const exportAll = useQuery(api.webdataExport.exportAllArticlesToWebDataBase);
    // const debugArticles = useQuery(api.webdataExport.debugAllArticles);
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

                if (!exportAll.articles || exportAll.articles.length === 0) {
                    throw new Error("同期する公開済み記事がありません。記事を公開してから再度お試しください。");
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

            // デバッグ: 送信データをログ出力
            // console.log('Debug - All articles:', debugArticles?.articles);
            console.log('Export data check:', exportAll);
            console.log('Articles count:', exportAll?.articles?.length || 0);
            console.log('Sending data to API:', syncData);
            console.log('API endpoint:', apiEndpoint);

            // WebData_Base APIに送信
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(syncData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // レスポンステキストを取得してデバッグ
            const responseText = await response.text();
            console.log('Raw response text:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // JSONパースを試行
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Client JSON parse error:', jsonError);
                console.error('Response was not valid JSON:', responseText);
                throw new Error('Server returned invalid JSON: ' + responseText.substring(0, 100));
            }
            
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
                            placeholder="https://komumoyu.com/api/sync-articles.php"
                            disabled={isLoading}
                        />
                        <p className="text-sm text-muted-foreground">
                            WebData_BaseプロジェクトのAPIエンドポイントを指定してください
                        </p>
                    </div>

                    {isSyncAll && (
                        <div className="space-y-3">
                            <h4 className="font-medium">記事状態の確認</h4>
                            
                            {/* デバッグ情報表示 - 一時的に無効化 */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    記事が表示されない場合は、記事を作成して「公開」状態にしてください。
                                </p>
                            </div>
                            
                            <h4 className="font-medium">同期対象の記事</h4>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                <div className="space-y-2">
                                    {exportAll?.articles.map((article: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <span className="font-medium">{article.title}</span>
                                            <span className="text-muted-foreground">{article.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {exportAll?.articles.length || 0}件の記事が同期されます
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