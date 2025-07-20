# 既知の問題 (Known Issues)

## Block Note カスタムブロック機能のエラー

### 問題の概要
Block Noteエディターでカスタムブロック（テーブル・データベース）を実装する際に発生するランタイムエラー。

### エラー内容
```
Error: undefined is not an object (evaluating 'n.nodes[e.type].isInGroup')
```

### 発生箇所
- `components/editor.tsx` - カスタムブロック挿入時
- `components/editor/table-block-schema.tsx` - テーブルブロック定義
- `components/editor/database-block-schema.tsx` - データベースブロック定義

### 試行した解決策
1. **propSchemaの修正**: `defaultProps`をスプレッド演算子で追加
2. **TypeScriptエラー抑制**: `@ts-expect-error`の使用
3. **エラーハンドリング**: try-catchブロックでの包囲
4. **グループ名の変更**: 重複回避のため"Custom"グループに統一

### 根本原因の推測
- Block Noteのカスタムブロックスキーマ定義方法の理解不足
- `propSchema`に必要な標準プロパティの不備
- Block Noteライブラリのバージョン互換性問題
- カスタムブロックの初期化タイミングの問題

### 現在の対応
**一時的無効化**: カスタムブロック機能を完全にコメントアウトし、基本的なBlock Noteエディターのみを使用

### 無効化された機能
1. **カスタムテーブルブロック**: インライン編集可能なテーブル
2. **データベース埋め込みブロック**: 既存データベースの埋め込み表示
3. **カスタムサイドメニューボタン**: "+"ボタンでの直接挿入
4. **カスタムスラッシュメニューアイテム**: "/table", "/database"コマンド

### 将来の実装方針
1. **Block Note公式ドキュメント再確認**: 最新のカスタムブロック実装方法
2. **段階的実装**: 単純なカスタムブロックから開始
3. **代替手段検討**: 外部ライブラリまたは独自実装
4. **コミュニティ参照**: Block Noteの実装例やIssue確認

### 関連ファイル
- `components/editor.tsx` - メインエディターコンポーネント
- `components/editor/table-block-schema.tsx` - テーブルブロック定義
- `components/editor/database-block-schema.tsx` - データベースブロック定義
- `components/editor/table-block.tsx` - テーブルUI実装
- `components/editor/embedded-database-view.tsx` - データベース埋め込みUI
- `components/database/database-view.tsx` - 既存データベースビュー

### 参考リンク
- [Block Note 公式ドキュメント](https://www.blocknotejs.org/)
- [Custom Blocks Documentation](https://www.blocknotejs.org/docs/custom-schemas/custom-blocks)
- [GitHub Issues](https://github.com/TypeCellOS/BlockNote/issues)