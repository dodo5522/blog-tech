export interface SanityImageAsset {
  url: string;
}

export interface SanityImage {
  alt?: string;
  asset?: SanityImageAsset;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug?: string;
  bio?: string;
  avatar?: SanityImage;
  links?: SocialLink[];
}

export interface PortableTextSpan {
  _key?: string;
  _type: "span";
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _key?: string;
  _type: string;
  style?: string;
  children?: PortableTextSpan[];
  markDefs?: Array<Record<string, unknown>>;
  code?: string;
  language?: string;
  filename?: string;
  alt?: string;
  asset?: SanityImageAsset;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: SanityImage;
  tags: Tag[];
  author?: Author;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: SanityImage;
  body?: PortableTextBlock[];
}

export interface Post extends PostSummary {
  body: PortableTextBlock[];
}

export interface SiteSettings {
  siteTitle: string;
  siteUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImage?: SanityImage;
  socialLinks: SocialLink[];
}
