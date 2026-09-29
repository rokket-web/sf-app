import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/signup", destination: "/sign-up", permanent: false },
      { source: "/signin", destination: "/sign-in", permanent: false },
      { source: "/login", destination: "/sign-in", permanent: false },
    ];
  },
};

export default nextConfig;
