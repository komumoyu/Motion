"use client";

import { Spinner } from "@/components/spinner";
// Convexに依存
import { useConvexAuth } from "convex/react";
import { Navigation } from "./_components/navigation";
import { redirect } from "next/navigation";

const MainLayout = ({ 
    children
}: {
    children: React.ReactNode;
}) => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    console.log("Auth state:", { isAuthenticated, isLoading });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="lg"></Spinner>
            </div>
        )
    }

    if (!isAuthenticated) {
        return redirect("/");
            
    }

    return (
        <div className="h-full flex dark:bg-[#1f1f1f] ">
            <Navigation />
            <main className="flex-1 h-full overflow-y-auto">
                {children}
            </main>
        </div>
        );
}

export default MainLayout;
