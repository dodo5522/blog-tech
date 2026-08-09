#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const MAX_HTML_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

function usage() {
  console.log(`Usage:
  node scripts/extract-chatgpt-share.mjs <share-url> [options]

Options:
  --format <json|markdown>  Output format. Defaults to json.
  --output <path>           Write under the repository tmp/ or OS temp directory.
  --help                    Show this help.
`);
}

function parseArgs(argv) {
  const args = { format: "json", output: "", url: "" };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      args.format = argv[++index] || "";
    } else if (arg === "--output") {
      args.output = argv[++index] || "";
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else if (!args.url) {
      args.url = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.url) {
    usage();
    throw new Error("A ChatGPT share URL is required");
  }
  if (!["json", "markdown"].includes(args.format)) {
    throw new Error("--format must be json or markdown");
  }

  return args;
}

function validateShareUrl(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "chatgpt.com" ||
    !/^\/share\/[A-Za-z0-9-]+\/?$/.test(url.pathname)
  ) {
    throw new Error(
      "URL must use the form https://chatgpt.com/share/<conversation-id>",
    );
  }
  url.search = "";
  url.hash = "";
  return url;
}

async function fetchShareHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; blog-draft-extractor/1.0)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`ChatGPT share fetch failed with HTTP ${response.status}`);
  }

  const finalUrl = validateShareUrl(response.url);
  if (finalUrl.pathname !== url.pathname) {
    throw new Error("ChatGPT share redirected to a different conversation");
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error("ChatGPT share response is larger than 10 MiB");
  }

  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error("ChatGPT share response is larger than 10 MiB");
  }
  return html;
}

function findFlattenedPayload(html) {
  const pattern = /streamController\.enqueue\(("(?:[^"\\]|\\.)*")\)/g;

  for (const match of html.matchAll(pattern)) {
    const chunk = JSON.parse(match[1]);
    if (!chunk.startsWith("[") || !chunk.includes("loaderData")) {
      continue;
    }

    try {
      const payload = JSON.parse(chunk);
      if (Array.isArray(payload)) {
        return payload;
      }
    } catch {
      // A later stream chunk may contain the route payload.
    }
  }

  throw new Error(
    "Conversation payload was not found; ChatGPT may have changed its share-page format",
  );
}

function decodeFlattened(values) {
  const cache = new Map();

  function decode(reference) {
    if (typeof reference !== "number") {
      return reference;
    }
    if (reference < 0) {
      return undefined;
    }
    if (cache.has(reference)) {
      return cache.get(reference);
    }

    const raw = values[reference];
    if (raw === null || typeof raw !== "object") {
      cache.set(reference, raw);
      return raw;
    }

    const decoded = Array.isArray(raw) ? [] : {};
    cache.set(reference, decoded);

    if (Array.isArray(raw)) {
      for (const value of raw) {
        decoded.push(decode(value));
      }
    } else {
      for (const [encodedKey, value] of Object.entries(raw)) {
        if (!/^_\d+$/.test(encodedKey)) {
          continue;
        }
        const key = decode(Number(encodedKey.slice(1)));
        if (typeof key === "string") {
          decoded[key] = decode(value);
        }
      }
    }

    return decoded;
  }

  return decode(0);
}

function toIsoDate(value) {
  return typeof value === "number"
    ? new Date(value * 1000).toISOString()
    : undefined;
}

function partToText(part) {
  if (typeof part === "string") {
    return { text: part, attachment: null };
  }
  if (!part || typeof part !== "object") {
    return { text: "", attachment: null };
  }

  if (part.content_type === "image_asset_pointer") {
    const width = Number(part.width) || undefined;
    const height = Number(part.height) || undefined;
    const dimensions = width && height ? ` ${width}x${height}` : "";
    return {
      text: `[添付画像${dimensions}]`,
      attachment: { type: "image", width, height },
    };
  }

  return {
    text: `[添付コンテンツ: ${part.content_type || "unknown"}]`,
    attachment: { type: part.content_type || "unknown" },
  };
}

function extractConversation(root, sourceUrl) {
  const route =
    root?.loaderData?.["routes/share.$shareId.($action)"]?.serverResponse;
  const data = route?.data;
  if (!data || !Array.isArray(data.linear_conversation)) {
    throw new Error("Decoded payload does not contain a linear conversation");
  }

  const messages = [];
  for (let index = 0; index < data.linear_conversation.length; index += 1) {
    const node = data.linear_conversation[index];
    const message = node?.message || node;
    const role = message?.author?.role;
    if (!["user", "assistant"].includes(role)) {
      continue;
    }
    if (message?.metadata?.is_visually_hidden_from_conversation) {
      continue;
    }

    const attachments = [];
    const text = (message?.content?.parts || [])
      .map((part) => {
        const converted = partToText(part);
        if (converted.attachment) {
          attachments.push(converted.attachment);
        }
        return converted.text;
      })
      .join("\n")
      .trim();

    if (!text) {
      continue;
    }

    messages.push({
      index,
      role,
      text,
      ...(attachments.length ? { attachments } : {}),
    });
  }

  return {
    sourceUrl,
    title: data.title || data.og_title || "Untitled ChatGPT conversation",
    createdAt: toIsoDate(data.create_time),
    updatedAt: toIsoDate(data.update_time),
    messages,
  };
}

function renderMarkdown(conversation) {
  const lines = [
    `# ${conversation.title}`,
    "",
    `Source: ${conversation.sourceUrl}`,
    "",
  ];

  for (const message of conversation.messages) {
    lines.push(
      `## ${message.role === "user" ? "User" : "Assistant"} ${message.index}`,
      "",
      message.text,
      "",
    );
  }

  return `${lines.join("\n").trim()}\n`;
}

function allowedOutputPath(output) {
  const resolved = path.resolve(output);
  const roots = [path.resolve(process.cwd(), "tmp"), path.resolve(os.tmpdir())];
  const allowed = roots.some(
    (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`),
  );
  if (!allowed) {
    throw new Error(
      "--output must be under the repository tmp/ or OS temp directory",
    );
  }
  return resolved;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = validateShareUrl(args.url);
  const html = await fetchShareHtml(url);
  const payload = findFlattenedPayload(html);
  const root = decodeFlattened(payload);
  const conversation = extractConversation(root, url.toString());
  const output =
    args.format === "markdown"
      ? renderMarkdown(conversation)
      : `${JSON.stringify(conversation, null, 2)}\n`;

  if (args.output) {
    const outputPath = allowedOutputPath(args.output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, output, { encoding: "utf8", mode: 0o600 });
    console.log(
      JSON.stringify({
        outputPath,
        title: conversation.title,
        messages: conversation.messages.length,
      }),
    );
    return;
  }

  process.stdout.write(output);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
