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

export function renderPortableText(blocks: PortableTextBlock[]): string {
  return toHTML(blocks, {
    components: {
      types: {
        codeBlock: ({ value }: { value: PortableTextBlock }) => {
          const filename = value.filename
            ? `<div class="code-block__filename">${escapeHtml(value.filename)}</div>`
            : "";
          const languageClass = value.language
            ? `language-${escapeHtml(value.language)}`
            : "language-text";

          return `<div class="code-block">${filename}<pre><code class="${languageClass}">${escapeHtml(
            value.code || "",
          )}</code></pre></div>`;
        },
        image: ({ value }: { value: PortableTextBlock }) => {
          const src = value.asset?.url;
          if (!src) {
            return "";
          }

          const alt = escapeHtml(value.alt || "");
          return `<figure><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" /></figure>`;
        },
      },
    },
  });
}

export function getReadingTimeMinutes(blocks: PortableTextBlock[]): number {
  const words = toPlainText(blocks).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
