import {
  fallbackPosts,
  fallbackSiteSettings,
  fallbackTags,
} from "@/lib/content/fallback";
import {
  POST_BY_SLUG_QUERY,
  POSTS_QUERY,
  SITE_SETTINGS_QUERY,
  TAGS_QUERY,
} from "@/lib/content/queries";
import type { Post, PostSummary, SiteSettings, Tag } from "@/lib/content/types";
import { sanityClient } from "@/lib/sanity/client";

async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!sanityClient) {
    return null;
  }

  return sanityClient.fetch<T>(query, params);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await fetchSanity<SiteSettings>(SITE_SETTINGS_QUERY);
  return settings || fallbackSiteSettings;
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const posts = await fetchSanity<PostSummary[]>(POSTS_QUERY);
  return posts?.length ? posts : fallbackPosts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = await fetchSanity<Post>(POST_BY_SLUG_QUERY, { slug });
  if (post) {
    return post;
  }

  return fallbackPosts.find((entry) => entry.slug === slug) || null;
}

export async function getTags(): Promise<Tag[]> {
  const tags = await fetchSanity<Tag[]>(TAGS_QUERY);
  return tags?.length ? tags : fallbackTags;
}

export async function getPostsByTagSlug(slug: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.tags.some((tag) => tag.slug === slug));
}
