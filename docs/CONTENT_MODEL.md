# CONTENT_MODEL.md

## 概要

Sanity のスキーマは、ブログ運営に必要な最小構成に絞る。

---

## 1. Post

必須フィールド:

- `title`: string
- `slug`: slug
- `excerpt`: text
- `body`: portable text
- `publishedAt`: datetime
- `updatedAt`: datetime
- `coverImage`: image
- `tags`: tag 参照の配列
- `author`: author 参照
- `seoTitle`: string
- `seoDescription`: text
- `ogImage`: image（任意）

ルール:

- slug は一意
- title 必須
- body 必須
- 公開記事には publishedAt 必須
- excerpt の長さには適切な上限を設ける

---

## 2. Tag

フィールド:

- `name`: string
- `slug`: slug
- `description`: text（任意）

ルール:

- slug は一意
- name 必須

---

## 3. Author

フィールド:

- `name`: string
- `slug`: slug（任意）
- `bio`: text（任意）
- `avatar`: image（任意）
- `links`: 配列（任意）

MVP では著者モデルを過剰に複雑化しない。

---

## 4. Site settings

単一ドキュメントで管理する。

- `siteTitle`
- `siteUrl`
- `defaultSeoTitle`
- `defaultSeoDescription`
- `defaultOgImage`
- `socialLinks`
- `navigation`（必要なら）

---

## 5. Draft の扱い

- 本番ビルドでは公開済みコンテンツのみ取得する
- preview は任意。MVP では必須ではない

---

## 6. 編集上の注意

- 本文は Portable Text を基本とする
- コードブロックを扱えるようにする
- cover / OGP / 本文中の画像には可能な限り alt を持たせる
- MVP ではカスタムブロックを増やしすぎない

## 7. 実装済みの補助オブジェクト

- `codeBlock`
  - `filename`
  - `language`
  - `code`
- `imageWithAlt`
  - 画像本体
  - `alt`
- `socialLink`
  - `label`
  - `url`
