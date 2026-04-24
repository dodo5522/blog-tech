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

type SanityFetchResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
    };

async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<SanityFetchResult<T>> {
  if (!sanityClient) {
    return { ok: false };
  }

  try {
    return {
      ok: true,
      data: await sanityClient.fetch<T>(query, params),
    };
  } catch (error) {
    console.warn(
      "Failed to fetch content from Sanity. Using fallback content.",
      error,
    );
    return { ok: false };
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const result = await fetchSanity<SiteSettings | null>(SITE_SETTINGS_QUERY);
  return result.ok ? result.data || fallbackSiteSettings : fallbackSiteSettings;
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const result = await fetchSanity<PostSummary[]>(POSTS_QUERY);
  return result.ok ? result.data : fallbackPosts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await fetchSanity<Post | null>(POST_BY_SLUG_QUERY, { slug });
  if (result.ok) {
    return result.data;
  }

  return fallbackPosts.find((entry) => entry.slug === slug) || null;
}

export async function getTags(): Promise<Tag[]> {
  const result = await fetchSanity<Tag[]>(TAGS_QUERY);
  return result.ok ? result.data : fallbackTags;
}

export async function getPostsByTagSlug(slug: string): Promise<PostSummary[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.tags.some((tag) => tag.slug === slug));
}
