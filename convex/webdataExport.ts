import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// BlockNoteのJSONからHTMLコンテンツを生成
function blockNoteToHtml(blocks: any[]): string {
    if (!blocks || blocks.length === 0) return '';
    
    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                const content = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<p>${content}</p>`;
                
            case 'heading':
                const headingContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                const level = block.props?.level || 1;
                return `<h${level}>${headingContent}</h${level}>`;
                
            case 'quote':
                const quoteContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<blockquote>${quoteContent}</blockquote>`;
                
            case 'bulletListItem':
                const bulletContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<li>${bulletContent}</li>`;
                
            case 'numberedListItem':
                const numberedContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<li>${numberedContent}</li>`;
                
            case 'codeBlock':
                const codeContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<pre><code>${codeContent}</code></pre>`;
                
            case 'image':
                const imageUrl = block.props?.url || '';
                const caption = block.props?.caption || '';
                return `<div class="image-block">
                    <img src="${imageUrl}" alt="${caption}">
                    ${caption ? `<p class="caption">${caption}</p>` : ''}
                </div>`;
                
            default:
                // 不明なブロックタイプの場合はそのまま返す
                const defaultContent = block.content?.map((c: any) => 
                    c.type === 'text' ? c.text : ''
                ).join('') || '';
                return `<p>${defaultContent}</p>`;
        }
    }).join('\n');
}

// WebData_Base用のPHPファイルテンプレートを生成
function generatePhpTemplate(article: Doc<"documents">, htmlContent: string): string {
    const title = article.title || 'Untitled';
    const date = article.articleData?.publishDate || new Date().toISOString().split('T')[0];
    const thumbnail = article.articleData?.thumbnail || 'public/img/thumbnails/default.png';
    const formattedDate = new Date(date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '/');

    return `<?php session_start(); ?>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="../../public/css/article-blue-refined.css">
  <?php include '../../src/Core/Database.php'; ?>
</head>
<body class="home">
  <?php include '../../src/Components/Header.php'; ?>

  <main id="article-content">
    <article>
      <h2>${title}</h2>
      <div class="post-meta">
        <span class="date">${formattedDate}</span>
      </div>
      <div class="post-thumbnail">
        <img src="../../${thumbnail}" alt="記事サムネイル">
      </div>
      <div class="post-body retro-border">
        ${htmlContent}
      </div>
      <div style="height: 40px;"></div>
      <?php $article_id = '${article._id}'; ?>
      <?php include '../../src/Components/Footer.php'; ?>
    </article>
  </main>
  
  <footer>
  </footer>
</body>
</html>`;
}

// 記事をWebData_Base形式でエクスポート
export const exportArticleToWebDataBase = mutation({
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

        // BlockNoteのJSONをパース
        let blocks: any[] = [];
        try {
            blocks = article.content ? JSON.parse(article.content) : [];
        } catch (error) {
            console.error("Failed to parse article content:", error);
            blocks = [];
        }

        // HTMLに変換
        const htmlContent = blockNoteToHtml(blocks);

        // PHPファイルを生成
        const phpContent = generatePhpTemplate(article, htmlContent);

        // スラッグが存在しない場合は生成
        const slug = article.articleData?.slug || generateSlug(article.title);

        // WebData_Base用のメタデータを生成
        const webDataBaseMetadata = {
            title: article.title,
            url: `html/articles/${slug}.php`,
            date: article.articleData?.publishDate || new Date().toISOString().split('T')[0],
            thumbnail: article.articleData?.thumbnail || "public/img/thumbnails/default.png"
        };

        // 記事を更新（WebData_Baseへの公開済みフラグを立てる）
        await ctx.db.patch(args.articleId, {
            articleData: {
                ...article.articleData,
                publishDate: article.articleData?.publishDate || new Date().toISOString().split('T')[0],
                slug: slug,
                webDataBaseUrl: webDataBaseMetadata.url,
                isPublishedToWebDB: true,
            }
        });

        return {
            metadata: webDataBaseMetadata,
            phpContent: phpContent,
            fileName: `${slug}.php`
        };
    },
});

// デバッグ用：すべての記事の状態を確認
export const debugAllArticles = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { articles: [] };
        
        const userId = identity.subject;
        const allArticles = await ctx.db
            .query("documents")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.eq(q.field("type"), "article")
                )
            )
            .collect();
            
        return {
            articles: allArticles.map(article => ({
                title: article.title,
                isPublished: article.isPublished,
                isArchived: article.isArchived,
                articleData: article.articleData
            }))
        };
    },
});

// すべての公開記事をWebData_Base形式でエクスポート
export const exportAllArticlesToWebDataBase = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // 公開済みの記事を取得
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

        // WebData_Base形式のメタデータ配列を生成
        const metadata = articles.map(article => ({
            title: article.title,
            url: article.articleData?.webDataBaseUrl || `html/articles/${article.articleData?.slug || 'article'}.php`,
            date: article.articleData?.publishDate || new Date().toISOString().split('T')[0],
            thumbnail: article.articleData?.thumbnail || "public/img/thumbnails/default.png"
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            articlesJsonContent: JSON.stringify(metadata, null, 2),
            articles: metadata
        };
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