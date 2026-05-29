import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Désactivé en dev pour ne pas polluer le cache
  register: true,
});

const nextConfig: NextConfig = {
  /* Vos options Next.js classiques ici */
  turbopack: {},
};

export default withPWA(nextConfig);
