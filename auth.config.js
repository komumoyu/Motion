// Clerkに依存 - 認証設定
export default {
    providers: [
        {
            // Clerkに依存 - Clerkドメイン
            domain: "https://classic-perch-9.clerk.accounts.dev",
            // Convexに依存 - アプリケーションID
            applicationID: "convex",
        }
    ],
}