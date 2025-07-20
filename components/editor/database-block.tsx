"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { EmbeddedDatabase } from "@/components/database/embedded-database";
import { Id } from "@/convex/_generated/dataModel";

// データベースブロックの定義
export const DatabaseBlock = createReactBlockSpec(
  {
    type: "database",
    propSchema: {
      databaseId: {
        default: "",
      },
      maxRows: {
        default: 5,
      },
      showFullView: {
        default: true,
      },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const { databaseId, maxRows, showFullView } = block.props;
      
      if (!databaseId) {
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            Database not configured
          </div>
        );
      }

      return (
        <div className="my-4">
          <EmbeddedDatabase
            databaseId={databaseId as Id<"documents">}
            maxRows={maxRows}
            showFullView={showFullView}
          />
        </div>
      );
    },
  }
);