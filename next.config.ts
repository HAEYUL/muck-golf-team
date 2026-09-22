import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 추억사진은 휴대폰 원본 사진이라 기본 1MB로는 대부분 실패한다
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
