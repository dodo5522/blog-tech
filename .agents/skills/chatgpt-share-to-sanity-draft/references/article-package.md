# 記事パッケージ仕様

## 配置

```text
tmp/<slug>/
├── article.md
└── images/        # 本文で参照するローカル画像がある場合だけ
```

`tmp/` はGit管理外。共有会話の本文や生成途中の記事を、追跡対象のディレクトリへ保存しない。

## frontmatter

`article.md` は次の形式にする。

```markdown
---
title: "記事タイトル"
description: "240文字以内の記事概要"
slug: "lowercase-kebab-case"
tags: ["Astro", "Sanity"]
---

# 記事タイトル

本文
```

- `title` と `description` は必須。
- `slug` は英小文字、数字、ハイフンで安定した値にする。
- `tags` は文字列の配列。会話に根拠のある主要技術だけを選ぶ。
- import時に `description` はexcerptとSEO descriptionへ、`title` はSEO titleへ長さを制限して使われる。
- `publishedAt` はimport時刻で仮設定される。Draft公開前にStudioで確認する。

## 対応Markdown

- 見出し: `#` から `####`
- 箇条書き、番号付きリスト
- fenced code block
- 独立したローカル画像: `![alt](images/file.png)`
- inline code、太字、`[label](https://example.com)` 形式のリンク
- Markdown table（Portable Textの `codeBlock` として保持）

入れ子リスト、blockquote、HTML、複雑なinline Markdownは正確に変換されない可能性があるため避ける。外部画像URLはassetとして取り込まれない。必要な画像は利用権を確認してローカルへ置く。

## 内容チェック

- コードと手順が会話または一次資料に裏付けられている。
- 未検証の操作は未検証と明記している。
- トークン、Cookie、メールアドレス、非公開ホスト名を含まない。
- 共有リンクを出典として公開する場合は、会話所有者の意図と機密性を確認する。既定では記事本文へ載せない。
- humanizer-ja適用後も、技術的な意味と数値が変わっていない。
