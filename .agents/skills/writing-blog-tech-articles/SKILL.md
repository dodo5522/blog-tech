---
name: writing-blog-tech-articles
description: Use when drafting, revising, or reviewing Japanese technical articles intended for the blog-tech Sanity publication workflow. Do not use for product code or general repository documentation.
---

# Writing blog-tech articles

Produce an article that a reader can reproduce and that an editor can safely import into Sanity.

## Editorial decisions

- Identify the target reader, the problem they need to solve, and the article's main conclusion before drafting.
- Prefer a structure that follows the work: context, relevant setup, attempts, observed results, failures or limitations, and the resulting decision. Omit sections that add no information.
- Separate observed facts, claims from primary sources, and the author's interpretation. Never turn an AI suggestion or an unexecuted command into a verified result.
- Verify version-sensitive commands and product behavior with current primary documentation. Record the tested versions and material environmental assumptions.
- Preserve exact commands, output, identifiers, and causal relationships during revision. Redact secrets, private hosts, personal data, and irrelevant internal identifiers.

## Japanese revision

Use `natural-japanese` with the `tech` genre. Quick mode is sufficient for ordinary drafts; use full mode for long or publication-critical articles. Treat findings as review prompts, not automatic replacements.

Run the repository checks against the article package before import:

```bash
pnpm lint:content -- tmp/<slug>/article.md
pnpm lint:markdown -- tmp/<slug>/article.md
uv run .agents/skills/natural-japanese/scripts/lint.py --genre tech --reading-load tmp/<slug>/article.md
uv run .agents/skills/natural-japanese/scripts/terms.py tmp/<slug>/article.md
```

Fix findings that improve correctness or readability. Document why a contextually correct exception remains instead of distorting technical meaning to satisfy a rule.

## Sanity handoff

Follow the article package contract used by `chatgpt-share-to-sanity-draft`. Before any write, run `pnpm sanity:import-draft -- --source tmp/<slug> --dry-run`, check for an existing slug, and obtain authorization for creating or replacing a Draft. Never publish on the user's behalf unless separately requested.
