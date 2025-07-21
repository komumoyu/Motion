"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, ExternalLink, Copy, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface WebDataExportButtonProps {
    articleId?: Id<"documents">;
    variant?: "single" | "all";
}

export const WebDataExportButton = ({ 
    articleId, 
    variant = "single" 
}: WebDataExportButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exportData, setExportData] = useState<any>(null);

    const exportSingle = useMutation(api.webdataExport.exportArticleToWebDataBase);
    const exportAll = useQuery(api.webdataExport.exportAllArticlesToWebDataBase);

    const handleExportSingle = async () => {
        if (!articleId) return;
        
        try {
            const result = await exportSingle({ articleId });
            setExportData(result);
            toast.success("記事のエクスポートが完了しました");
        } catch (error) {
            toast.error("エクスポートに失敗しました");
            console.error(error);
        }
    };

    const handleExportAll = () => {
        if (exportAll) {
            setExportData(exportAll);
            toast.success("全記事のエクスポートデータを取得しました");
        }
    };

    const downloadFile = (content: string, filename: string, type: string = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success("クリップボードにコピーしました");
    };

    const isSingleMode = variant === "single";
    const buttonText = isSingleMode ? "WebData_Baseにエクスポート" : "全記事をエクスポート";
    const buttonIcon = <Download className="w-4 h-4 mr-2" />;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={isSingleMode ? handleExportSingle : handleExportAll}
                >
                    {buttonIcon}
                    {buttonText}
                </Button>
            </DialogTrigger>

            {exportData && (
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            WebData_Base エクスポート完了
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {isSingleMode ? (
                            // 単一記事のエクスポート結果
                            <>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">記事メタデータ</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <pre className="text-sm overflow-x-auto">
                                            {JSON.stringify(exportData.metadata, null, 2)}
                                        </pre>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(JSON.stringify(exportData.metadata, null, 2))}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            コピー
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">PHPファイル ({exportData.fileName})</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        <pre className="text-xs whitespace-pre-wrap">
                                            {exportData.phpContent}
                                        </pre>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadFile(
                                                exportData.phpContent, 
                                                exportData.fileName, 
                                                'application/x-php'
                                            )}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            PHPファイルをダウンロード
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(exportData.phpContent)}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            コピー
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // 全記事のエクスポート結果
                            <>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">articles.json</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        <pre className="text-sm">
                                            {exportData.articlesJsonContent}
                                        </pre>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadFile(
                                                exportData.articlesJsonContent, 
                                                'articles.json', 
                                                'application/json'
                                            )}
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            articles.jsonをダウンロード
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(exportData.articlesJsonContent)}
                                        >
                                            <Copy className="w-4 h-4 mr-1" />
                                            コピー
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">記事一覧 ({exportData.articles.length}件)</h3>
                                    <div className="grid gap-2">
                                        {exportData.articles.map((article: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{article.title}</div>
                                                    <div className="text-sm text-gray-500">{article.date}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                        {article.url}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">次のステップ:</h4>
                            <ol className="text-sm text-gray-600 space-y-1">
                                <li>1. WebData_Baseプロジェクトの <code>/data/json/articles.json</code> を更新</li>
                                <li>2. PHPファイルを <code>/html/articles/</code> ディレクトリに配置</li>
                                <li>3. サムネイル画像を適切なパスに配置</li>
                                <li>4. WebData_Baseサイトで記事が正常に表示されることを確認</li>
                            </ol>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
};