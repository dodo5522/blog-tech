export const publicSiteUrl =
  import.meta.env.PUBLIC_SITE_URL || "https://example.com";
export const sanityProjectId =
  import.meta.env.SANITY_PROJECT_ID ||
  import.meta.env.SANITY_STUDIO_PROJECT_ID ||
  "";
export const sanityDataset =
  import.meta.env.SANITY_DATASET ||
  import.meta.env.SANITY_STUDIO_DATASET ||
  "production";
export const sanityApiVersion =
  import.meta.env.SANITY_API_VERSION || "2025-01-01";
export const sanityReadToken = import.meta.env.SANITY_READ_TOKEN || "";

export const isSanityConfigured = Boolean(
  sanityProjectId && sanityDataset && sanityApiVersion,
);
