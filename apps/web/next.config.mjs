import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // ---- Cloudflare/OpenNext monorepo fixes ----
  // This app lives in a monorepo; trace dependencies from the workspace root.
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  // Next's file tracer runs in Node, so it copies the *node* variants of
  // packages into .next/standalone. OpenNext then bundles with the *workerd*
  // condition, which selects different files (web.js / web.mjs) that the tracer
  // never copied -> "Could not resolve". Force all @libsql/* files into the
  // trace so the workerd variants are present. (Turso = libsql.)
  outputFileTracingIncludes: {
    "/": [
      "./node_modules/@libsql/**/*",
      "../../node_modules/@libsql/**/*",
    ],
  },
};

export default nextConfig;
