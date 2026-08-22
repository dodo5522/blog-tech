import type { SiteSettings } from "@/lib/content/types";

export const DEFAULT_SITE_TAGLINE = "作って、確かめて、次に使える形で残す。";

export type SanitySiteSettings = Omit<SiteSettings, "siteTagline"> & {
  siteTagline?: string;
};

export function normalizeSiteSettings(
  settings: SanitySiteSettings,
): SiteSettings {
  return {
    ...settings,
    siteTagline: settings.siteTagline?.trim() || DEFAULT_SITE_TAGLINE,
  };
}
