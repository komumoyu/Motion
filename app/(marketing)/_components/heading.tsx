"use client";

// Convexに依存
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import Link from "next/link";

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return (
    <div className="max-w3xl space-y-4">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Your Ideas, Documents, & Plans. Unified. welcom to
        <span className="underline"> Motion</span>
      </h1>
      <h3 className="text-base s,:text-xl md:text-2xl font-medium">
        Motion is the connected workspace where <br />
        better, faster work happenes.
      </h3>
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      )}
      {!isAuthenticated && !isLoading && (
        <Button asChild>
          <Link href="/documents">
            Enter Motion
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      )}
    </div>
  );
};
