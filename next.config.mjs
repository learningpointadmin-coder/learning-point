/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the live-preview host (Arena/e2b sandbox) to load dev assets
  // (HMR + /_next/* resources) without the "Cross origin request" block.
  allowedDevOrigins: ["*.e2b.app"],
  // Cloudflare Pages/Workers does not run the Next.js image optimization server,
  // so we serve images unoptimized (acceptable for this project's asset set).
  images: {
    unoptimized: true,
  },
  eslint: {
    // Don't block production builds on lint warnings during early scaffolding.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
