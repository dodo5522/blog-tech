# ARCHITECTURE.md

## 1. 採用アーキテクチャ

**Astro + Sanity + GitHub Actions + S3 + CloudFront**

### コンテンツの流れ

1. 編集者が Sanity Studio で記事を公開する
2. webhook またはコード変更を契機に CI が起動する
3. CI が Sanity の公開済みコンテンツを取得して Astro をビルドする
4. 生成された静的ファイルを S3 に配置する
5. CloudFront がサイトを配信する
6. 必要に応じて CloudFront キャッシュを無効化する

---

## 2. この構成を採用する理由

- 静的配信は安くて速い
- Sanity により独自バックエンド DB が不要
- Astro はコンテンツ中心サイトに向いている
- ビルド時取得により本番構成が単純になる
- S3 + CloudFront でアプリサーバ運用が不要になる

---

## 3. 実行境界

### Sanity
コンテンツ作成と保存の責務を持つ。

### Astro build
Sanity からコンテンツを取得し、静的ページを生成する。

### S3 / CloudFront
静的ファイルの配信のみを担当する。

MVP では公開サイト用の実行時アプリケーションサーバは存在しない。

---

## 4. 主要判断

- Sanity からの取得はビルド時に行う
- 本番では公開済みコンテンツのみ使う
- 公開ルートは静的生成する
- デプロイは CI/CD 経由で行い、AWS コンソール手作業に依存しない
- 管理画面は Sanity Studio を利用する

---

## 5. ルーティング案

- `/`
- `/blog/`
- `/blog/[slug]/`
- `/tags/[slug]/`
- `/about/`
- `/rss.xml`
- `/sitemap.xml`
- `/robots.txt`

---

## 6. SEO 設計

記事ごと:
- title
- meta description
- canonical
- OGP
- Twitter Card
- 適切な見出し構造
- 読みやすい slug URL

サイト全体:
- sitemap
- robots.txt
- RSS

---

## 7. デプロイ構成

```text
Sanity Studio
   ↓
Sanity Content Lake
   ↓ ビルド時取得
GitHub Actions
   ↓
Astro 静的出力
   ↓
S3 バケット
   ↓
CloudFront
   ↓
閲覧者
```

---

## 8. AWS 上の考慮点

- CloudFront を公開入口にし、S3 は原則直接公開しない
- 独自ドメインを使う場合は Route53 / ACM を使う
- キャッシュ無効化戦略を deploy workflow に含める
- 静的ルーティング時の 404 / エラーページ挙動を明示する

---

## 9. 保留中の設計メモ

- preview 機能は後回しでもよい
- 画像最適化は MVP では単純に保つ
- アクセス解析は後から軽量なものを追加すればよい
