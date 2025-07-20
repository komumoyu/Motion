"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Hash, Image } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ArticleCreatorProps {
    children: React.ReactNode;
}

export const ArticleCreator = ({ children }: ArticleCreatorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [publishDate, setPublishDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [thumbnail, setThumbnail] = useState("");
    const [slug, setSlug] = useState("");
    
    const router = useRouter();
    const createArticle = useMutation(api.articles.createArticle);

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error("記事タイトルを入力してください");
            return;
        }

        try {
            const articleId = await createArticle({
                title: title.trim(),
                publishDate,
                thumbnail: thumbnail || undefined,
                slug: slug || undefined,
            });

            toast.success("記事が作成されました");
            setIsOpen(false);
            
            // 作成した記事のページに移動
            router.push(`/documents/${articleId}`);
            
            // フォームをリセット
            setTitle("");
            setPublishDate(new Date().toISOString().split('T')[0]);
            setThumbnail("");
            setSlug("");
        } catch (error) {
            toast.error("記事の作成に失敗しました");
            console.error("Failed to create article:", error);
        }
    };

    // タイトルからスラッグを自動生成
    const generateSlugFromTitle = (title: string) => {
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setSlug(slug);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        新しい記事を作成
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* タイトル */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            記事タイトル
                        </Label>
                        <Input
                            id="title"
                            placeholder="記事のタイトルを入力"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                // タイトルが変更されたら自動でスラッグを生成
                                if (!slug) {
                                    generateSlugFromTitle(e.target.value);
                                }
                            }}
                            className="text-base"
                        />
                    </div>

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
                            <span className="text-xs text-muted-foreground">
                                (オプション)
                            </span>
                        </Label>
                        <Input
                            id="slug"
                            placeholder="url-slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            空白の場合、タイトルから自動生成されます
                        </p>
                    </div>

                    {/* サムネイル */}
                    <div className="space-y-2">
                        <Label htmlFor="thumbnail" className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            サムネイル画像URL
                            <span className="text-xs text-muted-foreground">
                                (オプション)
                            </span>
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
                                    className="w-24 h-16 object-cover rounded border"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!title.trim()}
                    >
                        記事を作成
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};