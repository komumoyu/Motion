import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "files.edgestore.dev"
    ]
  },
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '#minpath': false,
    };
    
    // Emoji picker関連のモジュール読み込み問題を修正
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  
  // Turbopackでのモジュール読み込み問題を修正
  turbopack: {
    resolveAlias: {
      '@emoji-mart/data': '@emoji-mart/data/dist/index.js',
    },
  }
};

export default nextConfig;
