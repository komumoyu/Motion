import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ユーザーのデータベース一覧を取得
export const getUserDatabases = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        const databases = await ctx.db
            .query("documents")
            .filter((q) => 
                q.and(
                    q.eq(q.field("userId"), userId),
                    q.eq(q.field("type"), "database"),
                    q.eq(q.field("isArchived"), false)
                )
            )
            .collect();

        return databases;
    },
});

// データベースの行（ページ）を取得
export const getDatabaseRows = query({
    args: { databaseId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database") {
            throw new Error("Database not found");
        }

        if (database.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // データベースの行を取得
        const rows = await ctx.db
            .query("documents")
            .withIndex("by_database", (q) => q.eq("databaseId", args.databaseId))
            .filter((q) => q.eq(q.field("isArchived"), false))
            .collect();

        return rows;
    },
});

// データベースのプロパティを取得
export const getDatabaseProperties = query({
    args: { databaseId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database" || database.userId !== userId) {
            throw new Error("Database not found or unauthorized");
        }

        const properties = await ctx.db
            .query("properties")
            .withIndex("by_database", (q) => q.eq("databaseId", args.databaseId))
            .collect();

        return properties.sort((a, b) => a.order - b.order);
    },
});

// データベースのビューを取得
export const getDatabaseViews = query({
    args: { databaseId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database" || database.userId !== userId) {
            throw new Error("Database not found or unauthorized");
        }

        const views = await ctx.db
            .query("views")
            .withIndex("by_database", (q) => q.eq("databaseId", args.databaseId))
            .collect();

        return views;
    },
});

// プロパティを作成
export const createProperty = mutation({
    args: {
        databaseId: v.id("documents"),
        name: v.string(),
        type: v.union(
            v.literal("text"),
            v.literal("number"),
            v.literal("select"),
            v.literal("multiSelect"),
            v.literal("date"),
            v.literal("checkbox"),
            v.literal("url"),
            v.literal("email"),
            v.literal("phone")
        ),
        options: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            color: v.string(),
        }))),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database" || database.userId !== userId) {
            throw new Error("Database not found or unauthorized");
        }

        // 現在のプロパティ数を取得して順序を決定
        const existingProperties = await ctx.db
            .query("properties")
            .withIndex("by_database", (q) => q.eq("databaseId", args.databaseId))
            .collect();

        const order = existingProperties.length;

        const property = await ctx.db.insert("properties", {
            databaseId: args.databaseId,
            name: args.name,
            type: args.type,
            options: args.options,
            order,
        });

        return property;
    },
});

// データベース行を作成
export const createDatabaseRow = mutation({
    args: {
        databaseId: v.id("documents"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // データベースの存在確認
        const database = await ctx.db.get(args.databaseId);
        if (!database || database.type !== "database" || database.userId !== userId) {
            throw new Error("Database not found or unauthorized");
        }

        const row = await ctx.db.insert("documents", {
            title: args.title,
            userId,
            isArchived: false,
            isPublished: false,
            type: "page",
            databaseId: args.databaseId,
            parentDocument: args.databaseId,
        });

        return row;
    },
});

// プロパティ値を設定
export const setPropertyValue = mutation({
    args: {
        documentId: v.id("documents"),
        propertyId: v.id("properties"),
        value: v.union(
            v.string(),
            v.number(),
            v.boolean(),
            v.array(v.string()),
            v.null()
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // ドキュメントの存在確認
        const document = await ctx.db.get(args.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        // 既存の値を検索
        const existingValue = await ctx.db
            .query("propertyValues")
            .withIndex("by_document_property", (q) => 
                q.eq("documentId", args.documentId).eq("propertyId", args.propertyId)
            )
            .first();

        if (existingValue) {
            // 既存の値を更新
            await ctx.db.patch(existingValue._id, {
                value: args.value,
            });
            return existingValue._id;
        } else {
            // 新しい値を作成
            const propertyValue = await ctx.db.insert("propertyValues", {
                documentId: args.documentId,
                propertyId: args.propertyId,
                value: args.value,
            });
            return propertyValue;
        }
    },
});

// ドキュメントのプロパティ値を取得
export const getDocumentProperties = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // ドキュメントの存在確認
        const document = await ctx.db.get(args.documentId);
        if (!document || document.userId !== userId) {
            throw new Error("Document not found or unauthorized");
        }

        const propertyValues = await ctx.db
            .query("propertyValues")
            .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
            .collect();

        return propertyValues;
    },
});

// プロパティを削除
export const deleteProperty = mutation({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // プロパティの存在確認
        const property = await ctx.db.get(args.propertyId);
        if (!property) {
            throw new Error("Property not found");
        }

        // データベースの所有者確認
        const database = await ctx.db.get(property.databaseId);
        if (!database || database.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // プロパティに関連するプロパティ値をすべて削除
        const propertyValues = await ctx.db
            .query("propertyValues")
            .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
            .collect();

        for (const value of propertyValues) {
            await ctx.db.delete(value._id);
        }

        // プロパティを削除
        await ctx.db.delete(args.propertyId);

        return args.propertyId;
    },
});

// プロパティの詳細情報を取得
export const getPropertyDetails = query({
    args: { propertyId: v.id("properties") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const property = await ctx.db.get(args.propertyId);
        if (!property) {
            throw new Error("Property not found");
        }

        return property;
    },
});

// プロパティのオプションを更新
export const updatePropertyOptions = mutation({
    args: {
        propertyId: v.id("properties"),
        options: v.array(v.object({
            id: v.string(),
            name: v.string(),
            color: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // プロパティの存在確認
        const property = await ctx.db.get(args.propertyId);
        if (!property) {
            throw new Error("Property not found");
        }

        // データベースの所有者確認
        const database = await ctx.db.get(property.databaseId);
        if (!database || database.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // プロパティのオプションを更新
        await ctx.db.patch(args.propertyId, {
            options: args.options,
        });

        return args.propertyId;
    },
});

// プロパティの幅を更新
export const updatePropertyWidth = mutation({
    args: {
        propertyId: v.id("properties"),
        width: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Not authenticated");
        }

        const userId = identity.subject;

        // プロパティの存在確認
        const property = await ctx.db.get(args.propertyId);
        if (!property) {
            throw new Error("Property not found");
        }

        // データベースの所有者確認
        const database = await ctx.db.get(property.databaseId);
        if (!database || database.userId !== userId) {
            throw new Error("Unauthorized");
        }

        // 幅の制限（最小80px、最大800px）
        const constrainedWidth = Math.max(80, Math.min(800, args.width));

        // プロパティの幅を更新
        await ctx.db.patch(args.propertyId, {
            width: constrainedWidth,
        });

        return args.propertyId;
    },
});