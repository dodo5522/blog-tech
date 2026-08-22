import { DEFAULT_SITE_TAGLINE } from "@/lib/content/siteSettings";
import type { Post, SiteSettings, Tag } from "@/lib/content/types";
import { publicSiteUrl } from "@/lib/env";

export const fallbackSiteSettings: SiteSettings = {
  siteTitle: "Tech Notes",
  siteTagline: DEFAULT_SITE_TAGLINE,
  siteUrl: publicSiteUrl,
  defaultSeoTitle: "Tech Notes",
  defaultSeoDescription: "Astro と Sanity で構築する個人技術ブログ。",
  socialLinks: [],
};

export const fallbackTags: Tag[] = [
  {
    _id: "fallback-tag-astro",
    name: "Astro",
    slug: "astro",
    description: "Astro 関連の実装メモ",
  },
];

export const fallbackPosts: Post[] = [
  {
    _id: "fallback-post-getting-started",
    title: "Getting Started",
    slug: "getting-started",
    excerpt: "Sanity 未接続でも Astro 側の骨組みを確認できるサンプル記事です。",
    publishedAt: "2026-04-19T00:00:00.000Z",
    updatedAt: "2026-04-19T00:00:00.000Z",
    tags: fallbackTags,
    seoTitle: "Getting Started",
    seoDescription: "Astro と Sanity の初期セットアップ用サンプル記事。",
    body: [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "この投稿は Sanity の環境変数が未設定でも画面構成を確認できるように用意したフォールバックコンテンツです。",
          },
        ],
      },
      {
        _type: "codeBlock",
        language: "bash",
        filename: "bootstrap.sh",
        code: "pnpm install\npnpm dev",
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Markdown の表は、専用スキーマを増やさず codeBlock として表示します。",
          },
        ],
      },
      {
        _type: "codeBlock",
        language: "markdown",
        filename: "sample-table.md",
        code: "| 項目 | 内容 |\n|---|---|\n| フロントエンド | Astro |\n| CMS | Sanity |\n| 配信 | S3 + CloudFront |",
      },
    ],
  },
];
