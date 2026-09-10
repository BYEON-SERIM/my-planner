import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // IP 통신 및 모바일/태블릿 HMR WebSocket 접속 허용
  allowedDevOrigins: [
    "localhost:3000",
    "172.17.22.80:3000",
    "172.17.22.80",
  ],
};

export default nextConfig;