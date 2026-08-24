import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/": [
      "./node_modules/@libsql/**/*",
      "../../node_modules/@libsql/**/*",
    ],
  },
};

export default nextConfig;
