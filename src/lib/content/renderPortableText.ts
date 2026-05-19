import { toHTML } from "@portabletext/to-html";
import { toPlainText } from "@portabletext/toolkit";
import type { PortableTextBlock } from "@/lib/content/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

  if (lines.length < 3 || !isMarkdownTableDivider(lines[1])) {
    return "";
  }

  const headers = splitMarkdownTableRow(lines[0]);
  const rows = lines.slice(2).map(splitMarkdownTableRow);
  if (!headers.length || rows.some((row) => row.length !== headers.length)) {
    return "";
  }

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

export function renderPortableText(blocks: PortableTextBlock[]): string {
  return toHTML(blocks, {
    components: {
      types: {
        codeBlock: ({ value }: { value: PortableTextBlock }) => {
          if (value.language === "markdown") {
            const table = renderMarkdownTable(value.code || "");
            if (table) {
              return table;
            }
          }

          const filename = value.filename
            ? `<div class="code-block__filename">${escapeHtml(value.filename)}</div>`
            : "";
          const language = value.language || "text";
          const languageLabel = !value.filename
            ? `<div class="code-block__filename">${escapeHtml(language)}</div>`
            : "";
          const languageClass = value.language
            ? `language-${escapeHtml(value.language)}`
            : "language-text";

          return `<div class="code-block">${filename || languageLabel}<pre><code class="${languageClass}">${escapeHtml(
            value.code || "",
          )}</code></pre></div>`;
        },
        image: ({ value }: { value: PortableTextBlock }) => {
          const src = value.asset?.url;
          if (!src) {
            return "";
          }

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
          const href = typeof value?.href === "string" ? value.href : "";
          if (!href) {
            return `${children}`;
          }

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
