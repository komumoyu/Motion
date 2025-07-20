import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// 記事を作成
export const createArticle = mutation({
    args: {
        title: v.string(),
        publishDate: v.string(),
        thumbnail: v.optional(v.string()),
        slug: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // スラッグの自動生成（指定がない場合）
        const slug = args.slug || generateSlug(args.title);

        const article = await ctx.db.insert("documents", {
            title: args.title,
            userId,
            isArchived: false,
            isPublished: false,
            type: "article",
            articleData: {
                publishDate: args.publishDate,
                thumbnail: args.thumbnail,
                slug: slug,
                isPublishedToWebDB: false,
            },
        });

        return article;
    },
});

// ユーザーの記事一覧を取得
export const getUserArticles = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const articles = await ctx.db
            .query("documents")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.eq(q.field("type"), "article"),
                    q.eq(q.field("isArchived"), false)
                )
            )
            .order("desc")
            .collect();

        return articles;
    },
});

// 記事の詳細を取得
export const getArticleById = query({
    args: { articleId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        const article = await ctx.db.get(args.articleId);

        if (!article) {
            throw new Error("Article not found");
        }

        if (article.type !== "article") {
            throw new Error("Document is not an article");
        }

        if (article.isPublished && !article.isArchived) {
            return article;
        }

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        if (article.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return article;
    },
});

// 記事データを更新
export const updateArticle = mutation({
    args: {
        id: v.id("documents"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        publishDate: v.optional(v.string()),
        thumbnail: v.optional(v.string()),
        slug: v.optional(v.string()),
        isPublishedToWebDB: v.optional(v.boolean()),
        webDataBaseUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const { id, publishDate, thumbnail, slug, isPublishedToWebDB, webDataBaseUrl, ...rest } = args;

        const existingArticle = await ctx.db.get(args.id);

        if (!existingArticle) {
            throw new Error("Article not found");
        }

        if (existingArticle.userId !== userId) {
            throw new Error("Unauthorized");
        }

        if (existingArticle.type !== "article") {
            throw new Error("Document is not an article");
        }

        // 記事データの更新
        const updatedArticleData = {
            ...existingArticle.articleData,
            publishDate: publishDate || existingArticle.articleData?.publishDate || new Date().toISOString().split('T')[0],
            ...(thumbnail !== undefined && { thumbnail }),
            ...(slug && { slug }),
            ...(isPublishedToWebDB !== undefined && { isPublishedToWebDB }),
            ...(webDataBaseUrl && { webDataBaseUrl }),
        };

        const article = await ctx.db.patch(args.id, {
            ...rest,
            ...(Object.keys(updatedArticleData).length > 0 && { articleData: updatedArticleData }),
        });

        return article;
    },
});

// WebData_Base形式でエクスポート用の記事データを取得
export const getArticlesForExport = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const articles = await ctx.db
            .query("documents")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.eq(q.field("type"), "article"),
                    q.eq(q.field("isArchived"), false),
                    q.eq(q.field("isPublished"), true)
                )
            )
            .collect();

        // WebData_Base形式に変換
        return articles.map(article => ({
            title: article.title,
            url: article.articleData?.webDataBaseUrl || `html/articles/${article.articleData?.slug || 'article'}.php`,
            date: article.articleData?.publishDate || new Date().toISOString().split('T')[0],
            thumbnail: article.articleData?.thumbnail || "public/img/thumbnails/default.png"
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
});

// スラッグ生成ヘルパー関数
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // 特殊文字を削除
        .replace(/\s+/g, '-') // スペースをハイフンに
        .replace(/-+/g, '-') // 連続するハイフンを単一に
        .trim();
}

// HTML コンテンツからプレーンテキストを抽出
export const extractPlainText = mutation({
    args: {
        articleId: v.id("documents"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;
        const article = await ctx.db.get(args.articleId);

        if (!article || article.userId !== userId || article.type !== "article") {
            throw new Error("Article not found or unauthorized");
        }

        // BlockNoteのJSONコンテンツからプレーンテキストを抽出
        // (実装はフロントエンドでBlockNote APIを使用)
        return article.content || "";
    },
});