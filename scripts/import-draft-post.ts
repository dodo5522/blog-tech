#!/usr/bin/env node

import { createReadStream, existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";

type CliArgs = {
  source: string;
  article: string;
  slug: string;
  env: string;
  dryRun: boolean;
  useCover: boolean;
};

type FrontmatterScalar = boolean | string | string[];

type ParsedMarkdown = {
  frontmatter: Record<string, FrontmatterScalar>;
  body: string;
};

type SpanMark = string;

type PortableTextSpan = {
  _key: string;
  _type: "span";
  text: string;
  marks: SpanMark[];
};

type PortableTextLinkMarkDef = {
  _key: string;
  _type: "link";
  href: string;
};

type PortableTextBlockExtra = {
  listItem?: "bullet" | "number";
  level?: number;
};

type PortableTextBlock = PortableTextBlockExtra & {
  _key: string;
  _type: "block";
  style: string;
  markDefs: PortableTextLinkMarkDef[];
  children: PortableTextSpan[];
};

type PortableTextCodeBlock = {
  _key: string;
  _type: "codeBlock";
  language: string;
  code: string;
};

type SanityReference = {
  _type: "reference";
  _ref: string;
};

type PortableTextImageBlock = {
  _key: string;
  _type: "image";
  alt: string;
  asset: SanityReference;
};

type PortableTextNode =
  | PortableTextBlock
  | PortableTextCodeBlock
  | PortableTextImageBlock;

type TagReference = SanityReference & {
  _key: string;
};

type ImageAsset = {
  alt: string;
  absolutePath: string;
  filename: string;
  assetId: string;
};

type ImageAssetMap = Map<string, ImageAsset>;

type CollectedTable = {
  table: string;
  nextIndex: number;
};

type DraftImageRef = {
  alt: string;
  asset: SanityReference;
};

type DraftPostDocument = {
  _id: string;
  _type: "post";
  title: string;
  slug: {
    _type: "slug";
    current: string;
  };
  excerpt: string;
  body: PortableTextNode[];
  publishedAt: string;
  tags: TagReference[];
  seoTitle: string;
  seoDescription: string;
  coverImage?: DraftImageRef;
  ogImage?: DraftImageRef;
};

const KNOWN_TAG_SLUGS = new Map<string, string>([
  ["Proxmox VE", "proxmox-ve"],
  ["GPU Passthrough", "gpu-passthrough"],
  ["VFIO", "vfio"],
  ["KVM", "kvm"],
  ["Ubuntu", "ubuntu"],
  ["自宅ラボ", "home-lab"],
  ["自宅サーバ", "home-server"],
]);

/**
 * Print command usage and supported options.
 */
function printUsage(): void {
  console.log(`Usage:
  pnpm sanity:import-draft -- --source tmp/pve-environment-blog-package

Options:
  --source <dir>       Directory that contains article.md and images/
  --article <file>     Markdown file path. Defaults to <source>/article.md
  --slug <slug>        Post slug. Defaults to frontmatter slug or source directory name
  --env <file>         Env file to load before process env. Defaults to .env when present
  --dry-run            Parse and summarize without uploading assets or writing Sanity documents
  --no-cover           Do not use the first article image as coverImage / ogImage
`);
}

/**
 * Parse CLI arguments into normalized import options.
 */
function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    source: "",
    article: "",
    slug: "",
    env: ".env",
    dryRun: false,
    useCover: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--source") {
      args.source = argv[++index] || "";
    } else if (arg === "--article") {
      args.article = argv[++index] || "";
    } else if (arg === "--slug") {
      args.slug = argv[++index] || "";
    } else if (arg === "--env") {
      args.env = argv[++index] || "";
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--no-cover") {
      args.useCover = false;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

/**
 * Load KEY=value pairs from an env file without overriding existing process env.
 */
function loadEnvFile(filePath: string): void {
  if (!filePath || !existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

/**
 * Return a required environment variable or fail with a clear message.
 */
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

/**
 * Parse a simple frontmatter scalar value.
 */
function parseScalar(value: string): FrontmatterScalar {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }
    throw new Error(`Unsupported frontmatter array value: ${value}`);
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Split Markdown into frontmatter metadata and body content.
 */
function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown {
  if (!markdown.startsWith("---\n")) {
    return { frontmatter: {}, body: markdown };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: markdown };
  }

  const frontmatterText = markdown.slice(4, end).trim();
  const body = markdown.slice(end + 4).replace(/^\r?\n/, "");
  const frontmatter: Record<string, FrontmatterScalar> = {};
  const frontmatterLines = frontmatterText.split(/\r?\n/);

  for (let index = 0; index < frontmatterLines.length; index += 1) {
    const line = frontmatterLines[index];
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);

    if (!value.trim()) {
      const values: string[] = [];
      let nextIndex = index + 1;
      while (nextIndex < frontmatterLines.length) {
        const item = frontmatterLines[nextIndex].match(/^\s*-\s+(.+)$/);
        if (!item) {
          break;
        }
        const parsedItem = parseScalar(item[1]);
        if (typeof parsedItem !== "string") {
          throw new Error(`Unsupported frontmatter list item: ${item[1]}`);
        }
        values.push(parsedItem);
        nextIndex += 1;
      }

      if (values.length) {
        frontmatter[key] = values;
        index = nextIndex - 1;
      } else {
        frontmatter[key] = "";
      }
      continue;
    }

    frontmatter[key] = parseScalar(value);
  }

  return { frontmatter, body };
}

/**
 * Convert a label into a stable URL-friendly slug.
 */
function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) {
    return normalized;
  }

  return `item-${hash(value).slice(0, 8)}`;
}

/**
 * Create a short deterministic hash source for Sanity keys and fallback slugs.
 */
function hash(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

/**
 * Build a deterministic Sanity _key from local block context.
 */
function makeKey(prefix: string, index: number, value = ""): string {
  return `${prefix}${index.toString(36)}${hash(value).slice(0, 8)}`;
}

/**
 * Convert minimal inline Markdown marks into Portable Text span children.
 */
function inlineContent(text: string): {
  children: PortableTextSpan[];
  markDefs: PortableTextLinkMarkDef[];
} {
  const children: PortableTextSpan[] = [];
  const markDefs: PortableTextLinkMarkDef[] = [];
  let cursor = 0;
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      children.push(span(text.slice(cursor, match.index), []));
    }

    const token = match[0];
    if (token.startsWith("`")) {
      children.push(span(token.slice(1, -1), ["code"]));
    } else if (token.startsWith("[")) {
      const link = parseInlineMarkdownLink(token);
      if (link) {
        const markKey = makeKey("l", markDefs.length, link.href);
        markDefs.push({
          _key: markKey,
          _type: "link",
          href: link.href,
        });
        children.push(span(link.label, [markKey]));
      } else {
        children.push(span(token, []));
      }
    } else {
      children.push(span(token.slice(2, -2), ["strong"]));
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    children.push(span(text.slice(cursor), []));
  }

  return {
    children: children.length ? children : [span("", [])],
    markDefs,
  };
}

/**
 * Parse a single Markdown inline link token: [label](href)
 */
function parseInlineMarkdownLink(
  token: string,
): { label: string; href: string } | null {
  const match = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (!match) {
    return null;
  }

  const label = match[1].trim();
  const href = match[2].trim();
  if (!label || !href) {
    return null;
  }

  return { label, href };
}

/**
 * Create a Portable Text span node.
 */
function span(text: string, marks: SpanMark[]): PortableTextSpan {
  return {
    _key: makeKey("s", text.length, text),
    _type: "span",
    text,
    marks,
  };
}

/**
 * Create a Portable Text block node with optional list metadata.
 */
function textBlock(
  style: string,
  text: string,
  index: number,
  extra: PortableTextBlockExtra = {},
): PortableTextBlock {
  const inline = inlineContent(text);
  return {
    _key: makeKey("b", index, text),
    _type: "block",
    style,
    markDefs: inline.markDefs,
    children: inline.children,
    ...extra,
  };
}

/**
 * Create a Portable Text codeBlock object.
 */
function codeBlock(
  language: string | undefined,
  code: string,
  index: number,
): PortableTextCodeBlock {
  return {
    _key: makeKey("c", index, code),
    _type: "codeBlock",
    language: language || "text",
    code,
  };
}

/**
 * Create a Portable Text image object referencing an uploaded Sanity asset.
 */
function imageBlock(
  assetRef: string,
  alt: string,
  index: number,
): PortableTextImageBlock {
  return {
    _key: makeKey("i", index, `${assetRef}:${alt}`),
    _type: "image",
    alt,
    asset: {
      _type: "reference",
      _ref: assetRef,
    },
  };
}

/**
 * Detect whether a Markdown line looks like a table row.
 */
function isTableLine(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

/**
 * Detect a Markdown table divider row.
 */
function isTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

/**
 * Collect a contiguous Markdown table and return its end position.
 */
function collectTable(lines: string[], start: number): CollectedTable {
  const tableLines: string[] = [];
  let index = start;
  while (index < lines.length && isTableLine(lines[index])) {
    tableLines.push(lines[index]);
    index += 1;
  }

  const hasDivider = tableLines.length > 1 && isTableDivider(tableLines[1]);
  return hasDivider
    ? { table: tableLines.join("\n"), nextIndex: index }
    : { table: "", nextIndex: start };
}

/**
 * Find local Markdown image references and upload them to Sanity when needed.
 */
async function collectImageAssets(
  articleDir: string,
  body: string,
  client: SanityClient | null,
  dryRun: boolean,
): Promise<ImageAssetMap> {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: ImageAssetMap = new Map();
  let match;

  while ((match = imagePattern.exec(body)) !== null) {
    const alt = match[1];
    const relativePath = match[2];
    if (/^https?:\/\//.test(relativePath)) {
      continue;
    }

    const absolutePath = path.resolve(articleDir, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Image file not found: ${relativePath}`);
    }

    images.set(relativePath, {
      alt,
      absolutePath,
      filename: path.basename(relativePath),
      assetId: dryRun ? `dry-run-${slugify(relativePath)}` : "",
    });
  }

  if (dryRun) {
    return images;
  }

  for (const image of images.values()) {
    if (!client) {
      throw new Error("Sanity client is required when dry-run is disabled");
    }
    const asset = await client.assets.upload(
      "image",
      createReadStream(image.absolutePath),
      {
        filename: image.filename,
        title: image.alt || image.filename,
      },
    );
    image.assetId = asset._id;
  }

  return images;
}

/**
 * Convert supported Markdown blocks into the site's Portable Text schema.
 */
function markdownToPortableText(
  body: string,
  imageAssets: ImageAssetMap,
  title: string,
): PortableTextNode[] {
  const lines = body.split(/\r?\n/);
  const blocks: PortableTextNode[] = [];
  let index = 0;
  let blockIndex = 0;
  let skippedTitle = false;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```([A-Za-z0-9_-]+)?\s*$/);
    if (fence) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        codeBlock(fence[1] || "text", codeLines.join("\n"), blockIndex++),
      );
      continue;
    }

    const table = collectTable(lines, index);
    if (table.table) {
      blocks.push(codeBlock("markdown", table.table, blockIndex++));
      index = table.nextIndex;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      const asset = imageAssets.get(image[2]);
      if (!asset) {
        throw new Error(`Uploaded image asset not found for ${image[2]}`);
      }
      blocks.push(imageBlock(asset.assetId, image[1], blockIndex++));
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level === 1 && text === title && !skippedTitle) {
        skippedTitle = true;
      } else {
        blocks.push(textBlock(`h${Math.min(level, 4)}`, text, blockIndex++));
      }
      index += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      blocks.push(
        textBlock("normal", bullet[1], blockIndex++, {
          listItem: "bullet",
          level: 1,
        }),
      );
      index += 1;
      continue;
    }

    const number = trimmed.match(/^\d+\.\s+(.+)$/);
    if (number) {
      blocks.push(
        textBlock("normal", number[1], blockIndex++, {
          listItem: "number",
          level: 1,
        }),
      );
      index += 1;
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith("#") ||
        next.startsWith("```") ||
        next.startsWith("![") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        isTableLine(next)
      ) {
        break;
      }
      paragraph.push(next);
      index += 1;
    }
    blocks.push(textBlock("normal", paragraph.join(" "), blockIndex++));
  }

  return blocks;
}

/**
 * Create or reuse tag documents and return references for the post document.
 */
async function createTagRefs(
  client: SanityClient | null,
  tagNames: string[],
  dryRun: boolean,
): Promise<TagReference[]> {
  const refs: TagReference[] = [];

  for (const name of tagNames) {
    const slug = KNOWN_TAG_SLUGS.get(name) || slugify(name);
    const id = `tag.${slug}`;
    refs.push({
      _key: makeKey("t", refs.length, id),
      _type: "reference",
      _ref: id,
    });

    if (!dryRun) {
      if (!client) {
        throw new Error("Sanity client is required when dry-run is disabled");
      }
      await client.createIfNotExists({
        _id: id,
        _type: "tag",
        name,
        slug: { _type: "slug", current: slug },
      });
    }
  }

  return refs;
}

/**
 * Run the import flow from CLI args through draft document creation.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source && !args.article) {
    printUsage();
    throw new Error("--source or --article is required");
  }

  loadEnvFile(args.env);

  const articlePath = path.resolve(
    args.article || path.join(args.source, "article.md"),
  );
  const articleDir = path.dirname(articlePath);
  const sourceDir = path.resolve(args.source || articleDir);
  const markdown = readFileSync(articlePath, "utf8");
  const { frontmatter, body } = parseMarkdownWithFrontmatter(markdown);

  const title = String(frontmatter.title || "").trim();
  const description = String(frontmatter.description || "").trim();
  if (!title || !description) {
    throw new Error("frontmatter title and description are required");
  }

  const slug =
    args.slug ||
    String(frontmatter.slug || "").trim() ||
    slugify(path.basename(sourceDir).replace(/-?package$/, ""));

  const client = args.dryRun
    ? null
    : createClient({
        projectId:
          process.env.SANITY_STUDIO_PROJECT_ID ||
          requiredEnv("SANITY_PROJECT_ID"),
        dataset:
          process.env.SANITY_STUDIO_DATASET || requiredEnv("SANITY_DATASET"),
        apiVersion: process.env.SANITY_API_VERSION || "2025-01-01",
        token: requiredEnv("SANITY_WRITE_TOKEN"),
        useCdn: false,
      });

  const imageAssets = await collectImageAssets(
    articleDir,
    body,
    client,
    args.dryRun,
  );
  const bodyBlocks = markdownToPortableText(body, imageAssets, title);
  const tagNames = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const tagRefs = await createTagRefs(client, tagNames, args.dryRun);
  const firstImage = [...imageAssets.values()][0];

  const imageRef: DraftImageRef | undefined =
    args.useCover && firstImage
      ? {
          alt: firstImage.alt,
          asset: {
            _type: "reference",
            _ref: firstImage.assetId,
          },
        }
      : undefined;

  const document: DraftPostDocument = {
    _id: `drafts.post.${slug}`,
    _type: "post",
    title,
    slug: { _type: "slug", current: slug },
    excerpt: description.slice(0, 240),
    body: bodyBlocks,
    publishedAt: new Date().toISOString(),
    tags: tagRefs,
    seoTitle: title.slice(0, 70),
    seoDescription: description.slice(0, 180),
    ...(imageRef ? { coverImage: imageRef, ogImage: imageRef } : {}),
  };

  if (args.dryRun) {
    const imageFiles = await readdir(path.join(articleDir, "images")).catch(
      () => [],
    );
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          articlePath,
          slug,
          title,
          tags: tagNames,
          imageReferences: imageAssets.size,
          imageFiles: imageFiles.length,
          bodyBlocks: bodyBlocks.length,
          documentId: document._id,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!client) {
    throw new Error("Sanity client is required when dry-run is disabled");
  }
  await client.createOrReplace(document);
  console.log(`Created or replaced Sanity draft: ${document._id}`);
  console.log(`Slug: ${slug}`);
  console.log(`Body blocks: ${bodyBlocks.length}`);
  console.log(`Images uploaded: ${imageAssets.size}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
