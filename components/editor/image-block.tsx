"use client";

import { createReactBlockSpec } from "@blocknote/react";
import { useState } from "react";
import { Upload, X, ExternalLink } from "lucide-react";
import { SingleImageDropzone } from "@/components/single-image-dropzone";
import { useEdgeStore } from "@/lib/edgestore";

// カスタムイメージブロックの定義
export const ImageBlock = createReactBlockSpec(
  {
    type: "image",
    propSchema: {
      url: {
        default: "",
      },
      caption: {
        default: "",
      },
      width: {
        default: "100%",
      },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const { url, caption, width } = block.props;
      const [isUploading, setIsUploading] = useState(false);
      const [showUploader, setShowUploader] = useState(!url);
      const { edgestore } = useEdgeStore();

      const handleImageUpload = async (file: File) => {
        setIsUploading(true);
        try {
          const response = await edgestore.publicFiles.upload({ file });
          
          // ブロックのプロパティを更新
          editor.updateBlock(block, {
            props: {
              ...block.props,
              url: response.url,
            },
          });
          
          setShowUploader(false);
        } catch (error) {
          console.error("Image upload failed:", error);
        } finally {
          setIsUploading(false);
        }
      };

      const handleRemoveImage = () => {
        editor.updateBlock(block, {
          props: {
            ...block.props,
            url: "",
          },
        });
        setShowUploader(true);
      };

      const handleCaptionChange = (newCaption: string) => {
        editor.updateBlock(block, {
          props: {
            ...block.props,
            caption: newCaption,
          },
        });
      };

      if (showUploader || !url) {
        return (
          <div className="w-full my-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                </div>
              ) : (
                <SingleImageDropzone
                  value={undefined}
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full my-4 group relative">
          {/* イメージプレビュー */}
          <div className="relative">
            <img
              src={url}
              alt={caption || "Uploaded image"}
              style={{ width }}
              className="rounded-lg shadow-sm max-w-full h-auto"
              loading="lazy"
            />
            
            {/* ホバー時のコントロール */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <button
                  onClick={() => window.open(url, '_blank')}
                  className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
                  title="Replace image"
                >
                  <Upload size={14} />
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded transition-colors"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* キャプション */}
          <div className="mt-2">
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              className="w-full text-sm text-gray-600 placeholder-gray-400 border-none outline-none bg-transparent text-center"
            />
          </div>
        </div>
      );
    },
  }
);