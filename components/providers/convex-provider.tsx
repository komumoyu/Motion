"use client"

import { ReactNode } from "react";
// Convexに依存
import { ConvexReactClient, ConvexProvider } from "convex/react";
// Convexに依存 (コメントアウトされたコード)
// import { ConvexProviderWithClerk } from "convex/react-clerk";
// Clerkに依存 (コメントアウトされたコード)
// import { ClerkProvider, useAuth } from "@clerk/clerk-react";

// Convexに依存 - 環境変数: NEXT_PUBLIC_CONVEX_URL
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({
    children
}: {
    children: ReactNode;
}) => {
    // return (
    //     <ClerkProvider
    //         // Clerkに依存 - 環境変数: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    //         publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    //     >
    //         <ConvexProviderWithClerk
    //             useAuth={useAuth}
    //             client={convex}
    //         >
    //             {children}
    //         </ConvexProviderWithClerk>
    //     </ClerkProvider>
    // )

    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    )
}