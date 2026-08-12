import { toHTML } from "@portabletext/to-html";
import { toPlainText } from "@portabletext/toolkit";
import type { PortableTextBlock } from "@/lib/content/types";

export interface TableOfContentsItem {
  id: string;
  level: 2 | 3;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeLinkHref(value: string): string {
  const href = value.trim();
  const hasUnsafeCharacter = [...href].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x20 || code === 0x7f;
  });

  if (!href || hasUnsafeCharacter) return "";
  if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("/") ||
    href.startsWith("./") ||
    href.startsWith("../")
  ) {
    return href.startsWith("//") || href.includes("\\") ? "" : href;
  }

  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.includes("\\") ? "" : href;
}

function isMarkdownTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderMarkdownTable(value: string): string {
  const lines = value
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 3 || !isMarkdownTableDivider(lines[1])) return "";

  const headers = splitMarkdownTableRow(lines[0]);
  const rows = lines.slice(2).map(splitMarkdownTableRow);
  if (!headers.length || rows.some((row) => row.length !== headers.length))
    return "";

  const head = headers
    .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function headingText(block: PortableTextBlock): string {
  return (block.children || [])
    .map((child) => child.text)
    .join("")
    .trim();
}

function headingBaseId(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "section";
}

function collectHeadings(blocks: PortableTextBlock[]) {
  const counts = new Map<string, number>();
  const ids = new Map<PortableTextBlock, string>();
  const items: TableOfContentsItem[] = [];

  for (const block of blocks) {
    if (block.style !== "h2" && block.style !== "h3") continue;
    const text = headingText(block);
    if (!text) continue;

    const baseId = headingBaseId(text);
    const count = (counts.get(baseId) || 0) + 1;
    counts.set(baseId, count);
    const id = count === 1 ? baseId : `${baseId}-${count}`;
    ids.set(block, id);
    items.push({ id, level: block.style === "h2" ? 2 : 3, text });
  }

  return { items, ids };
}

export function getTableOfContents(
  blocks: PortableTextBlock[],
): TableOfContentsItem[] {
  return collectHeadings(blocks).items;
}

function renderedHeadingId(
  value: unknown,
  ids: Map<PortableTextBlock, string>,
): string {
  const block = value as PortableTextBlock;
  return ids.get(block) || headingBaseId(headingText(block));
}

export function renderPortableText(blocks: PortableTextBlock[]): string {
  const { ids } = collectHeadings(blocks);

  return toHTML(blocks, {
    components: {
      block: {
        h2: ({ children, value }) =>
          `<h2 id="${escapeHtml(renderedHeadingId(value, ids))}">${children}</h2>`,
        h3: ({ children, value }) =>
          `<h3 id="${escapeHtml(renderedHeadingId(value, ids))}">${children}</h3>`,
      },
      types: {
        codeBlock: ({ value }: { value: PortableTextBlock }) => {
          if (value.language === "markdown") {
            const table = renderMarkdownTable(value.code || "");
            if (table) return table;
          }

          const filename = value.filename
            ? `<span class="code-block__filename">${escapeHtml(value.filename)}</span>`
            : "";
          const language = value.language || "text";
          const languageClass = value.language
            ? `language-${escapeHtml(value.language)}`
            : "language-text";

          return `<div class="code-block"><div class="code-block__header">${filename}<span class="code-block__language">${escapeHtml(language)}</span></div><pre><code class="${languageClass}">${escapeHtml(value.code || "")}</code></pre></div>`;
        },
        image: ({ value }: { value: PortableTextBlock }) => {
          const src = value.asset?.url;
          if (!src) return "";
          const alt = escapeHtml(value.alt || "");
          const caption = value.alt
            ? `<figcaption>${escapeHtml(value.alt)}</figcaption>`
            : "";
          return `<figure><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" decoding="async" />${caption}</figure>`;
        },
      },
      marks: {
        code: ({ children }) => `<code>${children}</code>`,
        link: ({ children, value }) => {
          const href =
            typeof value?.href === "string" ? safeLinkHref(value.href) : "";
          if (!href) return `${children}`;
          const isExternal = /^https?:\/\//.test(href);
          const rel = isExternal ? ' rel="noreferrer"' : "";
          const target = isExternal ? ' target="_blank"' : "";
          return `<a href="${escapeHtml(href)}"${target}${rel}>${children}</a>`;
        },
      },
    },
  });
}

export function getReadingTimeMinutes(blocks: PortableTextBlock[]): number {
  const words = toPlainText(blocks).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
