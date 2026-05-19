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
import { sanityFallbackMode } from "@/lib/env";
import { sanityClient } from "@/lib/sanity/client";

type SanityFetchResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
    };

const fetchCache = new Map<string, Promise<SanityFetchResult<unknown>>>();
const fallbackModes = new Set(["auto", "always", "never"]);

function normalizedFallbackMode(): "auto" | "always" | "never" {
  return fallbackModes.has(sanityFallbackMode)
    ? (sanityFallbackMode as "auto" | "always" | "never")
    : "auto";
}

function canUseFallback(reason: "not-configured" | "fetch-error"): boolean {
  const mode = normalizedFallbackMode();
  if (mode === "always") {
    return true;
  }
  if (mode === "never") {
    return false;
  }

  return reason === "not-configured";
}

async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<SanityFetchResult<T>> {
  if (!sanityClient) {
    if (canUseFallback("not-configured")) {
      return { ok: false };
    }

    throw new Error(
      "Sanity is not configured and fallback content is disabled.",
    );
  }

  const cacheKey = JSON.stringify([query, params]);
  const cached = fetchCache.get(cacheKey);
  if (cached) {
    return cached as Promise<SanityFetchResult<T>>;
  }

  const request = sanityClient
    .fetch<T>(query, params)
    .then(
      (data): SanityFetchResult<T> => ({
        ok: true,
        data,
      }),
    )
    .catch((error): SanityFetchResult<T> => {
      if (!canUseFallback("fetch-error")) {
        throw new Error(
          "Failed to fetch content from Sanity and fallback content is disabled.",
          { cause: error },
        );
      }

      console.warn(
        "Failed to fetch content from Sanity. Using fallback content because SANITY_FALLBACK_MODE allows it.",
        error,
      );
      return { ok: false };
    });

  fetchCache.set(cacheKey, request as Promise<SanityFetchResult<unknown>>);
  return request;
}

function normalizePostSummary<T extends PostSummary>(post: T): T {
  return {
    ...post,
    tags: post.tags ?? [],
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const result = await fetchSanity<SiteSettings | null>(SITE_SETTINGS_QUERY);
  return result.ok ? result.data || fallbackSiteSettings : fallbackSiteSettings;
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const result = await fetchSanity<PostSummary[]>(POSTS_QUERY);
  return result.ok ? result.data.map(normalizePostSummary) : fallbackPosts;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await fetchSanity<Post | null>(POST_BY_SLUG_QUERY, { slug });
  if (result.ok) {
    return result.data ? normalizePostSummary(result.data) : null;
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
