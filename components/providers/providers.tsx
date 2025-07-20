"use client";

import { ThemeProvider } from "./theme-provider";
import { ModalProvider } from "./modal-provider";
// Clerkに依存
import { ClerkProvider } from "@clerk/nextjs";
// Convexに依存
import { ConvexProviderWithClerk } from "convex/react-clerk";
// Convexに依存
import { ConvexReactClient } from "convex/react";
// Clerkに依存
import { useAuth } from "@clerk/nextjs";

// Convexに依存 - 環境変数: NEXT_PUBLIC_CONVEX_URL
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="Motion-theme-2"
        >
          <ModalProvider />
          {children}
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}