"use client";

import { useState, useEffect, useRef } from "react";
import { BlockNoteEditor, PartialBlock, BlockIdentifier, BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { 
    useCreateBlockNote, 
    SideMenuController,
    SuggestionMenuController,
    getDefaultReactSlashMenuItems
} from "@blocknote/react";
import { DatabaseBlock } from "./editor/database-block";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { 
    Database, 
    Table, 
    Image, 
    Code,
    Quote,
    List,
    CheckSquare,
    Type,
    Hash
} from "lucide-react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEdgeStore } from "@/lib/edgestore";
import { Id } from "@/convex/_generated/dataModel";
import { DatabaseEmbedButton } from "./database/database-embed-button";

// カスタムブロック機能を有効化 - 最新BlockNote API対応
// データベースブロック機能を復活

interface EditorProps {
    onChange: (value: string) => void;
    initialContent?: string;
    editable?: boolean;
    onInsertDatabaseBlock?: (databaseId: Id<"documents">) => void;
    onInsertBlock?: (type: string) => void;
    documentId?: Id<"documents">;
}

const Editor = ({
    onChange,
    initialContent,
    editable,
    onInsertDatabaseBlock,
    onInsertBlock,
    documentId
}: EditorProps) => {
    const { resolvedTheme } = useTheme();
    const { edgestore } = useEdgeStore();
    const [showSideMenu, setShowSideMenu] = useState(false);
    const [showDatabaseEmbed, setShowDatabaseEmbed] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // データベースブロック挿入機能
    const handleDatabaseSelected = (databaseId: Id<"documents">) => {
        editor.insertBlocks([
            {
                type: "database",
                props: {
                    databaseId: databaseId,
                    maxRows: 5,
                    showFullView: true,
                },
            },
        ], editor.getTextCursorPosition().block, "after");
        
        setShowDatabaseEmbed(false);
    };

    // メニュー外側クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowSideMenu(false);
            }
        };

        if (showSideMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSideMenu]);

    const handleUpload = async (file: File) => {
        const response = await edgestore.publicFiles.upload({ 
            file,
        });

        return response.url;
    }

    // カスタムスキーマを使用（データベースブロック有効化）
    const schema = BlockNoteSchema.create({
        blockSpecs: {
            ...defaultBlockSpecs,
            database: DatabaseBlock, // データベースブロック復活！
        },
    });

    // カスタムスラッシュメニューアイテムを作成
    const getCustomSlashMenuItems = (editor: any) => {
        const defaultItems = getDefaultReactSlashMenuItems(editor);
        
        // デバッグ: 既存のグループとアイテムを確認
        console.log('Existing groups:', [...new Set(defaultItems.map(item => item.group))]);
        console.log('Default items:', defaultItems.map(item => ({ title: item.title, group: item.group })));
        
        // データベースブロック用のスラッシュメニューアイテム
        const databaseItem = {
            title: "Database",
            onItemClick: () => {
                setShowDatabaseEmbed(true);
            },
            aliases: ["database", "db", "table"],
            group: "CustomBlocks",
            icon: <Database size={18} />,
            subtext: "Insert a database for structured data",
            key: "notion-clone-custom-database-item"
        };

        // カスタムアイテムを含めて返す
        return [...defaultItems, databaseItem];
    };

    const editor = useCreateBlockNote({
        schema,
        initialContent: 
            initialContent 
            ? (() => {
                try {
                    return JSON.parse(initialContent) as PartialBlock[];
                } catch {
                    return undefined;
                }
            })()
            : undefined,
        uploadFile: handleUpload,
        // TODO: カスタムブロック機能を再実装する際にコメントアウト
        // blockSpecs: {
        //     table: TableBlockSchema,
        //     database: DatabaseBlockSchema,
        // },
    })

    // エディターの内容変更を監視
    editor.onChange(() => {
        onChange(JSON.stringify(editor.document, null, 2));
    });

    return (
        <div>
            <BlockNoteView
                editor={editor}
                editable={editable}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                sideMenu={true}
                slashMenu={false}
            >
                <SuggestionMenuController
                    triggerCharacter={"/"}
                    getItems={async (query) => {
                        const items = getCustomSlashMenuItems(editor);
                        if (!query) return items;
                        
                        const lowerQuery = query.toLowerCase();
                        return items.filter(item => 
                            item.title.toLowerCase().includes(lowerQuery) ||
                            (item.aliases && item.aliases.some(alias => 
                                alias.toLowerCase().includes(lowerQuery)
                            ))
                        );
                    }}
                />
            </BlockNoteView>
            
            {/* データベース埋め込みダイアログ - 一時的に無効化 */}
            {/* {showDatabaseEmbed && documentId && (
                <DatabaseEmbedButton
                    documentId={documentId}
                    onEmbed={handleDatabaseSelected}
                />
            )} */}
        </div>
    )
};

export default Editor;