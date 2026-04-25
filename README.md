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

Astro サイト、Sanity Studio スキーマ、CI/CD、Terraform の最小骨組みまで実装済みです。

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

開発を進める際は、まず `AGENTS.md`、関連する `docs/*`、`CONTRIBUTING.md` を確認してください。
実装は短命ブランチで行い、Pull Request 経由で `main` に統合します。
