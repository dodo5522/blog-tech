# Personal Tech Blog / 個人技術ブログ

Astro ベースの個人技術ブログです。コンテンツ管理に Sanity、配信に AWS S3 + CloudFront を使用します。

詳細は以下を参照してください。

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/PRODUCT_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/DEPLOYMENT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/OPERATIONS.md`
- `docs/DECISIONS.md`

## 採用スタック

- Astro
- Sanity
- AWS S3
- AWS CloudFront
- GitHub Actions

## 現在の状態

Astro サイト、Sanity Studio スキーマ、CI/CD の最小構成まで実装済みです。  
既存の AWS リソース（S3 / CloudFront / ドメイン / 証明書）を使った本番デプロイ接続確認済みです。

## セットアップ

```bash
pnpm install
pnpm dev
```

Sanity Studio のローカル起動:

```bash
pnpm sanity:dev
```

環境変数は `env.example` を参照してください。Sanity の接続情報が未設定でも、フォールバックコンテンツで Astro 側の画面確認はできます。

## 本番デプロイ最短手順（既存AWSリソース利用）

1. GitHub Repository Variables を設定
   - `PUBLIC_SITE_URL`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`
   - `CLOUDFRONT_DISTRIBUTION_ID`
   - `SANITY_DATASET`
   - `SANITY_API_VERSION`
2. GitHub Repository Secrets を設定
   - `SANITY_PROJECT_ID`
   - `SANITY_READ_TOKEN`
   - `AWS_DEPLOY_ROLE_ARN`
3. `AWS_DEPLOY_ROLE_ARN` の IAM Role は GitHub OIDC を trust し、`main` ブランチの `repo` クレームだけを許可する
4. GitHub Actions の `Deploy` workflow を `workflow_dispatch` で手動実行し、`Configure AWS credentials` / `s3 sync` / `create-invalidation` の成功を確認する
5. CloudFront 経由で公開サイト表示を確認する

開発を進める際は、まず `AGENTS.md`、関連する `docs/*`、`CONTRIBUTING.md` を確認してください。
実装は短命ブランチで行い、Pull Request 経由で `main` に統合します。
