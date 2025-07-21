"use client";

import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { 
    FileText, 
    Calendar, 
    ExternalLink, 
    Eye, 
    Globe,
    Plus
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArticleCreator } from "./article-creator";
import { WebDataExportButton } from "./webdata-export-button";
import { WebDataSyncButton } from "./webdata-sync-button";
import { cn } from "@/lib/utils";

export const ArticleList = () => {
    const articles = useQuery(api.articles.getUserArticles);

    if (articles === undefined) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-pulse">記事を読み込み中...</div>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">記事がありません</h3>
                <p className="text-muted-foreground mb-6">
                    最初の記事を作成してWebData_Baseと連携しましょう
                </p>
                <ArticleCreator>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        記事を作成
                    </Button>
                </ArticleCreator>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">記事管理</h2>
                    <p className="text-muted-foreground">
                        WebData_Base連携用の記事を管理できます
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <WebDataSyncButton variant="sync_all" />
                    <WebDataExportButton variant="all" />
                    <ArticleCreator>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            新しい記事
                        </Button>
                    </ArticleCreator>
                </div>
            </div>

            {/* 記事リスト */}
            <div className="space-y-2">
                {articles.map((article) => (
                    <ArticleCard key={article._id} article={article} />
                ))}
            </div>
        </div>
    );
};

interface ArticleCardProps {
    article: any; // Todo: 型定義を後で改善
}

const ArticleCard = ({ article }: ArticleCardProps) => {
    const publishDate = article.articleData?.publishDate;
    const isPublishedToWebDB = article.articleData?.isPublishedToWebDB;
    
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { 
                addSuffix: true, 
                locale: ja 
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="group border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
                {/* 左側: 記事情報 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium truncate">
                            {article.title}
                        </h3>
                        
                        {/* 公開状態バッジ */}
                        <div className="flex items-center gap-2">
                            {article.isPublished && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                    <Eye className="h-3 w-3 mr-1" />
                                    公開中
                                </span>
                            )}
                            {isPublishedToWebDB && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                    <Globe className="h-3 w-3 mr-1" />
                                    WebDB連携
                                </span>
                            )}
                        </div>
                    </div>

                    {/* メタ情報 */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {publishDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(publishDate)}</span>
                            </div>
                        )}
                        
                        {article.articleData?.slug && (
                            <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">
                                    /{article.articleData.slug}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* サムネイル */}
                    {article.articleData?.thumbnail && (
                        <div className="mt-3">
                            <img
                                src={article.articleData.thumbnail}
                                alt={article.title}
                                className="w-16 h-12 object-cover rounded border"
                            />
                        </div>
                    )}
                </div>

                {/* 右側: アクション */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WebDataExportButton 
                        articleId={article._id} 
                        variant="single" 
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <a 
                            href={`/documents/${article._id}`}
                            className="flex items-center gap-1"
                        >
                            <ExternalLink className="h-3 w-3" />
                            編集
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
};