"use client";

import { ArticleList } from "@/components/article/article-list";

const ArticlesPage = () => {
    return (
        <div className="h-full flex-1 overflow-hidden">
            <div className="h-full px-4 py-6 max-w-6xl mx-auto">
                <ArticleList />
            </div>
        </div>
    );
};

export default ArticlesPage;