import type { NextConfig } from "next";

/**
 * Фронтенд собирается в статику и живёт на GitHub Pages.
 * Вся логика и все обращения к БД — на сервере (Supabase Edge Functions),
 * поэтому клиенту не нужен ни рантайм Node, ни доступ к базе.
 */
const isPages = process.env.DEPLOY_TARGET === "gh-pages";
const repo = "bailanysta";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(isPages ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
