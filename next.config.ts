import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://gw-test-463011.firebaseapp.com/__/auth/:path*',
      },
    ]
  },
};

export default withPWA(nextConfig);
