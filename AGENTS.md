# AGENTS.md

## ミッション

以下の固定アーキテクチャで、**個人向け技術ブログ**を構築し、リリース可能な状態まで仕上げてください。

- フロントエンド: **Astro**
- CMS: **Sanity**
- 配信: **AWS S3 + CloudFront**
- サイト種別: **静的サイト**
- フロントエンドからのコンテンツ更新機能: **不要**
- 目的: **低コスト・低運用負荷・保守しやすいブログ**
- 管理者: 最低1名
- 投稿者/編集者: 将来的に Sanity の権限/プランで対応可能にする

このリポジトリは、自律的に作業するコーディングエージェントが扱う前提です。主体的に進めてください。ただし、明示的な指示がない限り、上記のコアアーキテクチャは変更しないでください。

作業を開始する前に、必ず `.steering/` 配下の最新の日付付きドキュメントを読み、完了済み項目と残件を確認してください。

---

## プロダクト概要

本システムは、個人運営の技術ブログです。

コンテンツ管理は Sanity Studio で行います。
公開サイトは Astro で静的生成し、S3 に配置、CloudFront 経由で配信します。
コンテンツ更新は、Sanity の publish を契機に CI/CD が動作し、自動的にビルド・デプロイされる構成を目指します。

最適化対象は以下です。

1. シンプルさ
2. 低いランニングコスト
3. SEO の基本を満たすこと
4. 静的配信による高速性
5. 記事公開のしやすさ
6. 独自バックエンドを持たないことによる運用負荷の低さ

---

## 絶対条件

1. 公開サイトのための**独自アプリケーションバックエンドを導入しないこと**。
2. 公開サイトのための**RDB を導入しないこと**。
3. **Astro を Next.js に置き換えないこと**。Vercel 依存前提の設計は禁止。
4. **フロントエンド側からコンテンツ更新機能を持たせないこと**。
5. 本番環境で **SSR 前提にしないこと**。本番ターゲットは S3 配信の静的ファイル。
6. 可能な限り、公開サイトのページ表示を **Sanity への実行時依存にしないこと**。ビルド時取得を優先する。
7. 管理機能を過剰に作り込まないこと。**Sanity Studio が管理UI**である。
8. 閲覧者向けのアカウント機能を作らないこと。
9. MVP では、コメント・いいね・検索バックエンドを追加しないこと。
10. 凝った実装より、**地味でも壊れにくい実装**を優先すること。

---

## 成功条件

以下をすべて満たしたとき成功とする。

- Astro サイトが CI 上で正常にビルドできる
- Sanity Studio でコンテンツを作成・公開できる
- 公開済み記事が、自動デプロイ後に公開サイトへ反映される
- 下書きは公開サイトに出ない
- S3 + CloudFront へデプロイできる
- ローカル開発、ステージング、本番のセットアップ手順が明確である
- AWS コンソール上で手作業アップロードしなくてもリリースできる
- SEO の基本要件を満たす
  - 記事ごとの固有URL
  - title / meta description
  - canonical URL
  - sitemap
  - robots.txt
  - OGP / Twitter Card の基本対応
- 静的ブログとして十分な表示速度がある
- 引き継ぎ後に人間が読んで保守できる実装になっている

---

## 必須成果物

少なくとも以下を作成・維持すること。

- `README.md`
- `AGENTS.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/OPERATIONS.md`
- `docs/DECISIONS.md`
- `env.example`
- インフラ設定ファイル
- CI ワークフローファイル

コードを生成した場合、文書との整合性も必ず保つこと。

---

## MVP の対象範囲

### 対象に含むもの

- ホームページ
- 記事一覧ページ
- 記事詳細ページ
- タグ一覧または簡易タグ絞り込み
- About ページ
- SEO メタデータ
- RSS フィード
- Sitemap
- robots.txt
- 技術記事向けのコードブロック表示
- Sanity の draft / published を考慮した公開制御
- Sanity Studio のコンテンツモデル
- S3 + CloudFront への自動デプロイ
- プレビュー機能は、安価かつ単純に実現できる場合のみ検討。複雑なら後回し。

### MVP では対象外

- 全文検索サービス
- コメント機能
- 認証付き閲覧者
- メールマガジン連携
- 多言語対応
- 複雑な分析ダッシュボード
- 独自の画像処理パイプライン
- 実行時パーソナライズ
- 高機能な WYSIWYG 編集体験

---

## エージェントの作業方針

### 1. 一気に全部作らず、薄く縦に切って進めること

以下の順で進めること。

1. プロジェクト骨組み
2. コンテンツモデル
3. Astro と Sanity の連携
4. 公開ページの実装
5. SEO / RSS / Sitemap
6. デプロイパイプライン
7. 運用ドキュメント
8. 必要最小限の polish

### 2. 明示的な設定を優先する

魔法のような設定は避ける。設定は監査しやすく保つこと。

### 3. 依存を増やしすぎない

依存追加は、理由が明確なものだけにする。

### 4. 引き継ぎしやすさを優先する

後から人間が読んで理解しやすい実装にする。

### 5. 仮定は可視化する

曖昧な点があれば、妥当なデフォルトを採用し、その理由を `docs/DECISIONS.md` に記録すること。

---

## すでに確定している設計判断

以下は固定。明示的な変更指示がない限り変更しないこと。

- フロントエンドは Astro
- CMS は Sanity
- 公開配信は S3 + CloudFront
- 公開ページは Sanity の内容をビルド時に取得して静的生成する
- コンテンツ publish を契機に CI/CD でデプロイする
- 記事執筆体験は Sanity Portable Text など、Markdown 互換に近い運用を許容する
- デプロイ先は AWS

---

## 想定ディレクトリ構成

強い理由がない限り、概ね以下に近い形を採用すること。

```text
/
├─ src/
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  ├─ styles/
│  ├─ lib/
│  └─ content/
├─ public/
├─ sanity/
│  ├─ schemaTypes/
│  ├─ lib/
│  └─ sanity.config.ts
├─ scripts/
├─ docs/
├─ .github/workflows/
├─ infra/
├─ README.md
├─ AGENTS.md
├─ astro.config.mjs
├─ package.json
└─ env.example
```

Sanity Studio の配置が異なる場合は、その理由を文書化すること。

---

## コンテンツモデル要件

最低限、以下を定義すること。

### Post

- title
- slug
- excerpt
- body
- publishedAt
- updatedAt
- coverImage
- tags
- seoTitle
- seoDescription
- ogImage
- Sanity の draft/published による公開制御
- readingTime は任意。実装するなら算出方式を明示すること

### Tag

- name
- slug
- description（任意）

### Author

- name
- slug（任意）
- bio（任意）
- avatar（任意）
- social links（任意）

### Site settings

- siteTitle
- siteUrl
- defaultSeoTitle
- defaultSeoDescription
- defaultOgImage
- social links
- 必要なら header/footer 設定

スキーマは増やしすぎないこと。最小構成を守ること。

---

## 表示要件

- 公開サイトは、公開済み記事をすべて静的 HTML として生成すること
- 下書きは本番ビルドに含めないこと
- 技術記事のコードブロックが読みやすく表示されること
- 画像は、Astro の静的配信前提で無理のない範囲で最適化すること
- URL は slug ベースで安定させること
- 404 ページを用意すること
- RSS と sitemap を提供すること

---

## デプロイ要件

### ホスティング

- S3 バケットへ静的アセットを配置
- CloudFront で CDN 配信
- 独自ドメインを使う場合は Route53 / ACM を検討
- デプロイ時に CloudFront invalidation を行うこと

### CI/CD

推奨:

- GitHub Actions

許容:

- AWS CodeBuild / CodePipeline

デプロイフロー:

1. 依存関係をインストール
2. 環境変数・シークレットを注入
3. ビルド時に Sanity から公開済みコンテンツを取得
4. Astro build を実行
5. 出力物を S3 に同期
6. CloudFront キャッシュを invalidation

### トリガー

以下のうち最低1つ、できれば両方。

- `main` への push
- Sanity の publish / unpublish webhook

---

## 想定環境変数

少なくとも次を使う前提で整理・文書化すること。

- `PUBLIC_SITE_URL`
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `SANITY_READ_TOKEN`（必要な場合）
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

公開変数と秘密情報は厳密に分けること。

---

## 品質基準

完了扱いにする前に、少なくとも以下を確認すること。

- ローカル開発が動く
- 本番ビルドが通る
- 内部リンク切れがない
- canonical URL が正しい
- draft フィルタが正しく動く
- デプロイ手順が文書化されている
- CloudFront/S3 静的配信で 404 挙動が破綻していない
- キャッシュ無効化戦略が説明されている
- 公開ページに秘密情報が含まれない
- アクセシビリティの基本が満たされている
- 生成 HTML が SEO に不利でない

---

## セキュリティ上の注意

- シークレットをコミットしないこと
- デプロイ用 IAM は最小権限にすること
- preview / draft トークンを公開クライアントに露出しないこと
- preview 機能を実装する場合は MVP から分離し、簡単な場合のみ採用すること
- Sanity の write 権限付き認証情報を公開サイトで使わないこと

---

## デフォルト方針

特に指定がない場合は、以下を採用すること。

- TypeScript: 使う
- パッケージマネージャ: pnpm
- スタイリング: シンプルな CSS または Astro に馴染む最小構成
- テスト: 最低限の build/smoke validation
- lint/format: ESLint + Prettier など最小構成
- CI 対象ブランチ: `main`

---

## やってはいけないこと

- モダンさのためだけに SSR アプリ化しないこと
- 不要な抽象化を入れないこと
- マイクロサービス化しないこと
- 独自の編集 UI を作らないこと
- 選定済み CMS 以外の SaaS に無駄に結合しないこと
- 明示的な意図なしに Sanity の高額プラン前提機能を使わないこと

---

## Definition of Done

タスク完了は、以下をすべて満たした場合のみとする。

1. コードがある
2. ビルドできる
3. 文書化されている
4. デプロイできる
5. 次の人間が推測なしで運用できる
