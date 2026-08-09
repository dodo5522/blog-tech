#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

function usage() {
  console.log(`Usage:
  node scripts/check-sanity-draft.mjs --slug <slug> [--env <file>]

Exit codes:
  0  Neither a Draft nor a published document exists
  3  A Draft or published document already exists
`);
}

function parseArgs(argv) {
  const args = { env: ".env", slug: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--slug") {
      args.slug = argv[++index] || "";
    } else if (arg === "--env") {
      args.env = argv[++index] || "";
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) {
    throw new Error("--slug must be lowercase kebab-case");
  }
  return args;
}

function loadEnvFile(file) {
  const absolutePath = path.resolve(file);
  if (!existsSync(absolutePath)) {
    return;
  }

  for (const line of readFileSync(absolutePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator < 1) {
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

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnvFile(args.env);

  const client = createClient({
    projectId:
      process.env.SANITY_STUDIO_PROJECT_ID || requiredEnv("SANITY_PROJECT_ID"),
    dataset: process.env.SANITY_STUDIO_DATASET || requiredEnv("SANITY_DATASET"),
    apiVersion: process.env.SANITY_API_VERSION || "2025-01-01",
    token: requiredEnv("SANITY_WRITE_TOKEN"),
    useCdn: false,
  });

  const draftId = `drafts.post.${args.slug}`;
  const publishedId = `post.${args.slug}`;
  const documents = await client.fetch(
    "*[_id in [$draftId, $publishedId]]|order(_id asc){_id, title, _updatedAt}",
    { draftId, publishedId },
    { perspective: "raw" },
  );

  if (documents.length) {
    console.log(
      JSON.stringify({
        exists: true,
        slug: args.slug,
        documents: documents.map((document) => ({
          id: document._id,
          state: document._id.startsWith("drafts.") ? "draft" : "published",
          title: document.title,
          updatedAt: document._updatedAt,
        })),
      }),
    );
    process.exitCode = 3;
    return;
  }

  console.log(
    JSON.stringify({
      exists: false,
      slug: args.slug,
      draftId,
      publishedId,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
