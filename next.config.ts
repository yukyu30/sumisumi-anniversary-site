import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ロリポップ「デプロイナウ」は standalone 出力が必須
  output: "standalone",
  // セルフホストで next/image の最適化を使うと sharp（ネイティブ依存）が必要になるため無効化
  images: { unoptimized: true },
};

export default nextConfig;
