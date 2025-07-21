"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { 
    Calendar, 
    Hash, 
    Image, 
    Globe, 
    ExternalLink,
    Save,
    Settings,
    Eye,
    EyeOff
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

interface ArticleMetadataProps {
    articleId: Id<"documents">;
    article: any; // Todo: 型定義を後で改善
}

export const ArticleMetadata = ({ articleId, article }: ArticleMetadataProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [publishDate, setPublishDate] = useState("");
    const [thumbnail, setThumbnail] = useState("");
    const [slug, setSlug] = useState("");
    const [webDataBaseUrl, setWebDataBaseUrl] = useState("");
    const [isPublishedToWebDB, setIsPublishedToWebDB] = useState(false);
    
    const updateArticle = useMutation(api.articles.updateArticle);
    const updateDocument = useMutation(api.documents.update);

    // 初期値を設定
    useEffect(() => {
        if (article?.articleData) {
            setPublishDate(article.articleData.publishDate || "");
            setThumbnail(article.articleData.thumbnail || "");
            setSlug(article.articleData.slug || "");
            setWebDataBaseUrl(article.articleData.webDataBaseUrl || "");
            setIsPublishedToWebDB(article.articleData.isPublishedToWebDB || false);
        }
    }, [article]);

    const handleSave = async () => {
        try {
            await updateArticle({
                id: articleId,
                publishDate: publishDate || undefined,
                thumbnail: thumbnail || undefined,
                slug: slug || undefined,
                webDataBaseUrl: webDataBaseUrl || undefined,
                isPublishedToWebDB,
            });

            toast.success("記事メタデータを保存しました");
        } catch (error) {
            toast.error("保存に失敗しました");
            console.error("Failed to save article metadata:", error);
        }
    };

    const togglePublishStatus = async () => {
        try {
            await updateDocument({
                id: articleId,
                isPublished: !article.isPublished
            });

            toast.success(
                article.isPublished ? "記事を非公開にしました" : "記事を公開しました"
            );
        } catch (error) {
            toast.error("公開状態の変更に失敗しました");
            console.error("Failed to toggle publish status:", error);
        }
    };

    const generateWebDataBaseUrl = () => {
        const generatedSlug = slug || article?.title?.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        
        setWebDataBaseUrl(`html/articles/${generatedSlug}.php`);
    };

    if (article?.type !== "article") {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2 w-full">
                <Button 
                    variant={article.isPublished ? "default" : "outline"} 
                    size="sm" 
                    className="flex-1"
                    onClick={togglePublishStatus}
                >
                    {article.isPublished ? (
                        <>
                            <Eye className="h-4 w-4 mr-2" />
                            公開中
                        </>
                    ) : (
                        <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            非公開
                        </>
                    )}
                </Button>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            詳細設定
                            {isPublishedToWebDB && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    WebDB
                                </span>
                            )}
                        </Button>
                    </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">記事メタデータ</CardTitle>
                        <CardDescription>
                            WebData_Base連携用の記事設定を管理できます
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 公開日 */}
                        <div className="space-y-2">
                            <Label htmlFor="publishDate" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                公開日
                            </Label>
                            <Input
                                id="publishDate"
                                type="date"
                                value={publishDate}
                                onChange={(e) => setPublishDate(e.target.value)}
                            />
                        </div>

                        {/* スラッグ */}
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                URLスラッグ
                            </Label>
                            <Input
                                id="slug"
                                placeholder="article-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* サムネイル */}
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail" className="flex items-center gap-2">
                                <Image className="h-4 w-4" />
                                サムネイル画像URL
                            </Label>
                            <Input
                                id="thumbnail"
                                placeholder="https://example.com/image.png"
                                value={thumbnail}
                                onChange={(e) => setThumbnail(e.target.value)}
                            />
                            {thumbnail && (
                                <div className="mt-2">
                                    <img
                                        src={thumbnail}
                                        alt="サムネイルプレビュー"
                                        className="w-32 h-20 object-cover rounded border"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* WebData_Base URL */}
                        <div className="space-y-2">
                            <Label htmlFor="webDataBaseUrl" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                WebData_Base URL
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="webDataBaseUrl"
                                    placeholder="html/articles/article.php"
                                    value={webDataBaseUrl}
                                    onChange={(e) => setWebDataBaseUrl(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateWebDataBaseUrl}
                                >
                                    自動生成
                                </Button>
                            </div>
                        </div>

                        {/* WebData_Base連携状態 */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    WebData_Baseに公開
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    この記事をWebData_Baseのarticles.jsonに含める
                                </p>
                            </div>
                            <Switch
                                checked={isPublishedToWebDB}
                                onCheckedChange={setIsPublishedToWebDB}
                            />
                        </div>

                        {/* プレビューリンク */}
                        {webDataBaseUrl && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">プレビューURL:</p>
                                <p className="text-sm font-mono text-muted-foreground break-all">
                                    /WebData_Base/{webDataBaseUrl}
                                </p>
                            </div>
                        )}

                        {/* 保存ボタン */}
                        <Button onClick={handleSave} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            メタデータを保存
                        </Button>
                    </CardContent>
                </Card>
            </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
};