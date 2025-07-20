import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const archive = mutation({
    args: { id: v.id("documents")},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not Found");
        }
        if (existingDocument.userId !== userId){
            throw new Error("Unauthorized");
        }

        const recursiveArchive = async (documentId: Id<"documents">) => {
            const children = await ctx.db
            .query("documents")
            .withIndex("by_parent", (q) => (
                q
                    .eq("userId", userId)
                    .eq("parentDocument", documentId)
            ))
            .collect();
            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isArchived: true,
                });
                await recursiveArchive(child._id);
            }
        }

        const document = await ctx.db.patch(args.id, {
            isArchived: true,
        });

        await recursiveArchive(args.id);
        
        return document;

    }
})

export const getSidebar = query({
    args: {
        parentDocument: v.optional(v.id("documents"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }
        const userId = identity.subject;

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isArchived"), false))
            .filter((q) => q.eq(q.field("parentDocument"), args.parentDocument))
            .filter((q) =>
                q.eq(q.field("isArchived"),false)
            )
            .order("desc")
            .collect();

        return documents;
    }
})

export const create = mutation({
    args: {
        title: v.string(),
        parentDocument: v.optional(v.id("documents")),
        type: v.optional(v.union(v.literal("page"), v.literal("database"), v.literal("article"))),
        databaseId: v.optional(v.id("documents")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        const userId = identity.subject;

        const documents = await ctx.db.insert("documents", {
            title: args.title,
            userId,
            isArchived: false,
            isPublished: false,
            parentDocument: args.parentDocument,
            type: args.type || "page",
            databaseId: args.databaseId,
        });

        // データベースの場合、デフォルトのプロパティとビューを作成
        if (args.type === "database") {
            // タイトルプロパティを作成
            const titleProperty = await ctx.db.insert("properties", {
                databaseId: documents,
                name: "Title",
                type: "text",
                order: 0,
            });

            // デフォルトのテーブルビューを作成
            await ctx.db.insert("views", {
                databaseId: documents,
                name: "All",
                type: "table",
                isDefault: true,
            });
        }

        return documents;
    },
})

export const getTrash = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isArchived"), true))
            .order("desc")
            .collect();

        return documents;
    },
})

export const restore = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const recursiveRestore = async (documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_parent", (q) => (
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                ))
                .collect();

            for (const child of children) {
                await ctx.db.patch(child._id, {
                    isArchived: false,
                });
                await recursiveRestore(child._id);
            }
        };

        const options: Partial<Doc<"documents">> = {
            isArchived: false,
        };

        if (existingDocument.parentDocument) {
            const parent = await ctx.db.get(existingDocument.parentDocument);
            if (parent?.isArchived) {
                options.parentDocument = undefined;
            }
        }

        const document = await ctx.db.patch(args.id, options);

        await recursiveRestore(args.id);

        return document;
    },
})

export const remove = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.delete(args.id);

        return document;
    },
})

export const getSearch = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("isArchived"), false))
            .order("desc")
            .collect();

        return documents;
    },
})

export const getById = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        const document = await ctx.db.get(args.documentId);

        if (!document) {
            throw new Error("Not found");
        }

        if (document.isPublished && !document.isArchived) {
            return document;
        }

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        if (document.userId !== userId) {
            throw new Error("Unauthorized");
        }

        return document;
    },
})

export const update = mutation({
    args: {
        id: v.id("documents"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        icon: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const { id, ...rest } = args;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.patch(args.id, {
            ...rest,
        });

        return document;
    },
})

export const removeIcon = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.patch(args.id, {
            icon: undefined,
        });

        return document;
    },
})

export const removeCoverImage = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const userId = identity.subject;

        const existingDocument = await ctx.db.get(args.id);

        if (!existingDocument) {
            throw new Error("Not found");
        }

        if (existingDocument.userId !== userId) {
            throw new Error("Unauthorized");
        }

        const document = await ctx.db.patch(args.id, {
            coverImage: undefined,
        });

        return document;
    },
})

// ドキュメントに埋め込まれたデータベースを追加
export const addEmbeddedDatabase = mutation({
    args: { 
        documentId: v.id("documents"),
        databaseId: v.id("documents"),
        position: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // ドキュメントの所有者確認
        const document = await ctx.db.get(args.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database" || database.userId !== userId) {
            throw new Error("Database not found or unauthorized");
        }

        // 既存の埋め込みをチェック
        const existingEmbed = await ctx.db
            .query("embeddedDatabases")
            .withIndex("by_document_database", (q) => 
                q.eq("documentId", args.documentId).eq("databaseId", args.databaseId)
            )
            .first();

        if (existingEmbed) {
            return existingEmbed._id;
        }

        // 新しい埋め込みを作成
        const embed = await ctx.db.insert("embeddedDatabases", {
            documentId: args.documentId,
            databaseId: args.databaseId,
            position: args.position || 0,
            createdAt: Date.now(),
        });

        return embed;
    },
});

// ドキュメントの埋め込みデータベース一覧を取得
export const getEmbeddedDatabases = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // ドキュメントの所有者確認
        const document = await ctx.db.get(args.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        const embeds = await ctx.db
            .query("embeddedDatabases")
            .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
            .collect();

        // データベース情報も含めて返す
        const embedsWithDatabases = await Promise.all(
            embeds.map(async (embed) => {
                const database = await ctx.db.get(embed.databaseId);
                return {
                    ...embed,
                    database: database,
                };
            })
        );

        return embedsWithDatabases.sort((a, b) => a.position - b.position);
    },
});

// 埋め込みデータベースを削除
export const removeEmbeddedDatabase = mutation({
    args: { 
        documentId: v.id("documents"),
        databaseId: v.id("documents"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // ドキュメントの所有者確認
        const document = await ctx.db.get(args.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        const embed = await ctx.db
            .query("embeddedDatabases")
            .withIndex("by_document_database", (q) => 
                q.eq("documentId", args.documentId).eq("databaseId", args.databaseId)
            )
            .first();

        if (embed) {
            await ctx.db.delete(embed._id);
        }

        return embed?._id;
    },
});

// 埋め込みデータベースの位置を更新
export const updateEmbeddedDatabasePosition = mutation({
    args: { 
        embeddedDatabaseId: v.id("embeddedDatabases"),
        newPosition: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // 埋め込みデータベースの存在確認
        const embed = await ctx.db.get(args.embeddedDatabaseId);
        if (!embed) {
            throw new Error("Embedded database not found");
        }

        // ドキュメントの所有者確認
        const document = await ctx.db.get(embed.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        // 位置を更新
        await ctx.db.patch(args.embeddedDatabaseId, {
            position: args.newPosition,
        });

        return args.embeddedDatabaseId;
    },
});
