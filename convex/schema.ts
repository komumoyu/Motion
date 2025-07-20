import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ドキュメントテーブル（ページとデータベース両方）
  documents: defineTable({
    title: v.string(),
    userId: v.string(),
    isArchived: v.boolean(),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.boolean(),
    parentDocument: v.optional(v.id("documents")),
    // データベース関連フィールド
    type: v.optional(v.union(v.literal("page"), v.literal("database"), v.literal("article"))),
    databaseId: v.optional(v.id("documents")), // データベース行の場合、親データベースID
    // 記事関連フィールド
    articleData: v.optional(v.object({
      publishDate: v.string(), // 公開日 (YYYY-MM-DD)
      thumbnail: v.optional(v.string()), // サムネイル画像URL
      slug: v.optional(v.string()), // URL用スラッグ
      webDataBaseUrl: v.optional(v.string()), // WebData_Baseでの記事URL
      isPublishedToWebDB: v.optional(v.boolean()), // WebData_Baseに公開済みか
    })),
  })
  .index("by_user", ["userId"])
  .index("by_parent", ["userId", "parentDocument"])
  .index("by_database", ["databaseId"])
  .index("by_type", ["type"]),

  // データベースプロパティ（カラム定義）
  properties: defineTable({
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
    }))), // selectとmultiSelectの選択肢
    order: v.number(),
    width: v.optional(v.number()), // カラム幅（ピクセル）
  })
  .index("by_database", ["databaseId"])
  .index("by_order", ["databaseId", "order"]),

  // データベース行のプロパティ値
  propertyValues: defineTable({
    documentId: v.id("documents"), // データベース行のドキュメントID
    propertyId: v.id("properties"),
    value: v.union(
      v.string(),
      v.number(),
      v.boolean(),
      v.array(v.string()), // multiSelectの値
      v.null()
    ),
  })
  .index("by_document", ["documentId"])
  .index("by_property", ["propertyId"])
  .index("by_document_property", ["documentId", "propertyId"]),

  // データベースビュー（テーブル、カンバンなど）
  views: defineTable({
    databaseId: v.id("documents"),
    name: v.string(),
    type: v.union(v.literal("table"), v.literal("kanban"), v.literal("list")),
    isDefault: v.boolean(),
    sortBy: v.optional(v.array(v.object({
      propertyId: v.id("properties"),
      direction: v.union(v.literal("asc"), v.literal("desc")),
    }))),
    filterBy: v.optional(v.array(v.object({
      propertyId: v.id("properties"),
      condition: v.string(),
      value: v.union(v.string(), v.number(), v.boolean()),
    }))),
    groupBy: v.optional(v.id("properties")), // カンバンビュー用
  })
  .index("by_database", ["databaseId"]),

  // ドキュメントに埋め込まれたデータベース
  embeddedDatabases: defineTable({
    documentId: v.id("documents"), // 埋め込み先のドキュメント
    databaseId: v.id("documents"), // 埋め込まれるデータベース
    position: v.number(), // ドキュメント内での位置
    createdAt: v.number(),
  })
  .index("by_document", ["documentId"])
  .index("by_database", ["databaseId"])
  .index("by_document_database", ["documentId", "databaseId"]),
});