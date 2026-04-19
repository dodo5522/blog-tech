import type { APIRoute } from "astro";
import { publicSiteUrl } from "@/lib/env";

export const GET: APIRoute = async () => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap-index.xml", publicSiteUrl).toString()}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
