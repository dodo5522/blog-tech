export const SITE_SETTINGS_QUERY = `
*[_type == "siteSettings"][0]{
  siteTitle,
  siteUrl,
  defaultSeoTitle,
  defaultSeoDescription,
  defaultOgImage{
    alt,
    asset->{url}
  },
  socialLinks[]{
    label,
    url
  }
}
`;

const POST_PROJECTION = `
{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  coverImage{
    alt,
    asset->{url}
  },
  tags[]->{
    _id,
    name,
    "slug": slug.current,
    description
  },
  author->{
    _id,
    name,
    "slug": slug.current,
    bio,
    avatar{
      alt,
      asset->{url}
    },
    links[]{
      label,
      url
    }
  },
  seoTitle,
  seoDescription,
  ogImage{
    alt,
    asset->{url}
  }
}
`;

export const POSTS_QUERY = `
*[
  _type == "post" &&
  defined(slug.current) &&
  defined(publishedAt) &&
  !(_id in path("drafts.**"))
] | order(publishedAt desc) ${POST_PROJECTION}
`;

export const POST_BY_SLUG_QUERY = `
*[
  _type == "post" &&
  slug.current == $slug &&
  defined(publishedAt) &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  body[]{
    ...,
    asset->{url}
  },
  coverImage{
    alt,
    asset->{url}
  },
  tags[]->{
    _id,
    name,
    "slug": slug.current,
    description
  },
  author->{
    _id,
    name,
    "slug": slug.current,
    bio,
    avatar{
      alt,
      asset->{url}
    },
    links[]{
      label,
      url
    }
  },
  seoTitle,
  seoDescription,
  ogImage{
    alt,
    asset->{url}
  }
}
`;

export const TAGS_QUERY = `
*[_type == "tag" && defined(slug.current)] | order(name asc){
  _id,
  name,
  "slug": slug.current,
  description
}
`;
