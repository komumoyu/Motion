# 外部サービス依存関係

このプロジェクトは以下の外部サービスに依存しています：

## Convex（バックエンド・データベース）
- **パッケージ**: `convex`, `convex/react`, `convex/react-clerk`
- **環境変数**:
  - `NEXT_PUBLIC_CONVEX_URL`: Convexデプロイメントへの接続URL
  - `CONVEX_DEPLOYMENT`: Convexプロジェクトのデプロイメント識別子

### Convexを使用しているファイル:
- `/app/(main)/layout.tsx` - `useConvexAuth`フックを使用
- `/app/(marketing)/_components/navbar.tsx` - `useConvexAuth`フックを使用
- `/app/(marketing)/_components/heading.tsx` - `useConvexAuth`フックを使用
- `/components/providers/providers.tsx` - `ConvexProviderWithClerk`, `ConvexReactClient`を使用
- `/components/providers/convex-provider.tsx` - `ConvexProvider`, `ConvexReactClient`を使用
- `/hooks/use-auth.tsx` - `useConvexAuth`互換性レイヤーを提供
- `/auth.config.js` - ConvexアプリケーションIDの設定

## Clerk（認証サービス）
- **パッケージ**: `@clerk/nextjs`, `@clerk/clerk-react`
- **環境変数**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerkの公開鍵
  - `CLERK_SECRET_KEY`: Clerkの秘密鍵

### Clerkを使用しているファイル:
- `/app/(marketing)/_components/navbar.tsx` - `SignInButton`, `UserButton`コンポーネントを使用
- `/components/providers/providers.tsx` - `ClerkProvider`, `useAuth`フックを使用
- `/components/providers/convex-provider.tsx` - コメントアウトされたClerkProvider実装
- `/auth.config.js` - Clerkドメインの設定

## その他の外部サービス
- **カスタムAPIサーバー**:
  - `/lib/api-client.ts` - `NEXT_PUBLIC_API_URL`環境変数を使用してカスタムAPIサーバーに接続

## 注意事項
- Convex生成ファイル（`/convex/_generated/`内のファイル）は自動生成されるため、直接編集しないでください
- 環境変数は`.env.local`ファイルに保存されています（Gitにはコミットされません）