import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts, getSiteSettings } from "@/lib/content/api";

export async function GET(context: APIContext) {
  const [siteSettings, posts] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
  ]);

  return rss({
    title: siteSettings.siteTitle,
    description: siteSettings.defaultSeoDescription,
    site: context.site || siteSettings.siteUrl,
    items: posts.map((post) => ({
      title: post.title,
      description: post.seoDescription || post.excerpt,
      pubDate: new Date(post.publishedAt),
      link: `/blog/${post.slug}/`,
    })),
  });
}
