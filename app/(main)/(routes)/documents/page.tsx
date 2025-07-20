"use client";

import Image from "next/image";
// Clerkに依存
import { useUser } from "@clerk/nextjs"; // 変更: @clerk/clerk-react → @clerk/nextjs
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api"; // 変更: apiのインポートパスを修正
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const DocumentsPage = () => {
    const { user } = useUser();
    const router = useRouter();
    const create = useMutation(api.documents.create); // 変更: useMutationの引数を修正

    const onCreate = () => {
        const promise = create({ title: "Untitled" })
            .then((documentId) => {
                router.push(`/documents/${documentId}`);
            });

        toast.promise(promise, {
            loading: "Creating...",
            success: "Created successfully!",
            error: "Failed to create document."
        });
    };

    return (
        /* 変更: flex-colを追加して縦方向の中央揃えに修正 */
        <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Image
                src="/EmptyBox.png"
                alt="Empty Box"
                width={300}
                height={300}
                className="dark:hidden"
            />
            <Image
                src="/EmptyBox_dark.png"
                alt="Empty Box"
                width={300}
                height={300}
                className="hidden dark:block"
            />
            <h2 className="text-lg font-medium">
                welcome to { user?. firstName }&apos;s Motion
            </h2>
            <Button onClick={onCreate} >
                <PlusCircle className="h-4 w-4 mr-2"/>
                create a note
            </Button>

        </div>
    );
}

export default DocumentsPage;