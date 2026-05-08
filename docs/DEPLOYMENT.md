# DEPLOYMENT.md

## 1. デプロイ先

- 静的ホスティング: AWS S3
- CDN: AWS CloudFront

---

## 2. CI/CD フロー

推奨:

- GitHub Actions

### ビルド手順

1. リポジトリを checkout
2. Node とパッケージマネージャをセットアップ
3. 依存関係をインストール
4. lint / format check を実行
5. 環境変数を注入
6. Astro build を実行
7. 静的ファイルを S3 にアップロード
8. CloudFront キャッシュを invalidation

---

## 3. トリガー戦略

可能なら両方使う。

- `main` への push
- Sanity の publish / unpublish webhook

これで、コード変更でもコンテンツ変更でも自動リリースできる。

運用上の標準:

- 本番デプロイは `main` にマージされた変更を起点に実行する
- Pull Request 用ブランチでは本番デプロイしない
- Sanity webhook は公開コンテンツ更新のデプロイトリガーとして併用する
- staging 環境を将来追加する場合は、本番 workflow と分離して管理する

---

## 4. GitHub Actions の設定値

このリポジトリは `deploy.yml` 内で `vars.*` / `secrets.*` を参照する。  
`workflow_dispatch` と `repository_dispatch` のどちらでも同じ設定値を使う。

Repository Variables:

- `PUBLIC_SITE_URL`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`

Repository Secrets:

- `SANITY_PROJECT_ID`
- `SANITY_READ_TOKEN`（公開データのみなら不要な場合もあるが、運用上は設定推奨）
- `AWS_DEPLOY_ROLE_ARN`

備考:

- 将来 Environment secrets/variables に移行する場合でも、同じキー名を使えば workflow 側の参照コード変更は不要

---

## 5. AWS 認証（OIDC）

推奨は GitHub OIDC によるロール引受。

1. IAM Identity Provider に `https://token.actions.githubusercontent.com` を登録
2. IAM Role を作成し、`sts:AssumeRoleWithWebIdentity` を許可
3. trust policy の `sub` を `repo:<owner>/<repo>:ref:refs/heads/main` に限定
4. Role ARN を `AWS_DEPLOY_ROLE_ARN` として GitHub Secrets に登録

権限は最小化する。少なくとも以下を対象リソースに限定して付与する。

- `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject`
- `cloudfront:CreateInvalidation`

---

## 6. Sanity webhook 連携（repository_dispatch）

Sanity 側の publish / unpublish を契機に GitHub Deploy workflow を起動する場合、Sanity webhook の HTTP request を GitHub API に向ける。

- URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
- Method: `POST`
- Header:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <dispatch token>`
- Body:

```json
{
  "event_type": "sanity-content-changed"
}
```

dispatch token は `repo` 権限を持つトークンを使い、Sanity 側 Secret として保持する。

---

## 7. 必要なシークレット

例:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `SANITY_READ_TOKEN`（必要な場合）
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` または OIDC によるロール引受
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `AWS_DEPLOY_ROLE_ARN`

可能なら長期鍵ではなく GitHub OIDC を優先する。

Sanity webhook を GitHub `repository_dispatch` に接続する場合は、GitHub 側で dispatch 実行用トークンも別途必要になる。

---

## 8. S3 配置時の注意

- immutable にできるアセットは長めにキャッシュする
- HTML の Content-Type を正しく扱う
- 削除済みファイルを消すため、必要に応じて `--delete` を使う

例:

- `aws s3 sync dist/ s3://$S3_BUCKET_NAME --delete`

---

## 9. CloudFront の注意

- S3 を origin とする
- invalidation 対象の例:
  - `/index.html`
  - `/blog/*`
  - `/tags/*`
  - `/rss.xml`
  - `/sitemap*`

MVP では更新頻度が低い前提で、必要なら `/*` の全体 invalidation でもよい。

404 動作確認手順（本番）:

1. 存在しないパス（例: `/__not_found_check__`）へアクセスする
2. HTTP ステータスが `404` であることを確認する
3. 返却ページが `404.html` の内容であることを確認する
4. 主要導線（ホームへのリンク）が機能することを確認する

---

## 10. ドメインと TLS

独自ドメインを使う場合:

- Route53 または他の DNS を使う
- ACM 証明書は `us-east-1` で発行する
- CloudFront に証明書を関連付ける

---

## 11. ロールバック

ロールバック方針:

- 可能なら直前のビルド成果物を保持する
- 直近の正常版を再デプロイする
- コンテンツ起因なら Sanity 側で修正・復元する
- コード起因なら Git を戻して CI を再実行する

実運用手順:

1. 直近の正常コミットを特定する
2. `main` へ revert PR を作成しマージする
3. `Deploy` workflow を実行する
4. `s3 sync` と CloudFront invalidation の成功を確認する
5. 公開サイトで主要ページと問題ページを再確認する

---

## 12. リポジトリ実装との対応

- CI workflow: `.github/workflows/ci.yml`
- Deploy workflow: `.github/workflows/deploy.yml`
- Terraform: `infra/`（任意。既存 AWS リソース利用時は適用不要）
