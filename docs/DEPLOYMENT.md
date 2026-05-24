# DEPLOYMENT.md

## 1. デプロイ先

- 静的ホスティング: AWS S3
- CDN: AWS CloudFront

---

## 2. CI/CD フロー

推奨:

- GitHub Actions

このリポジトリは deploy を 2 本に分離する。

- `deploy-site.yml`: 公開サイト（Astro）デプロイ
- `deploy-studio.yml`: Sanity Studio（静的ビルド）デプロイ

---

## 3. トリガー戦略

`deploy-site.yml`:

- `main` への push（site 関連ファイル変更時）
- Sanity の publish / unpublish webhook（`repository_dispatch`）
- `workflow_dispatch`

`deploy-studio.yml`:

- `main` への push（studio 関連ファイル変更時）
- `workflow_dispatch`

これで、コンテンツ更新時は site のみ自動再デプロイし、Studio はコード変更時だけデプロイする。

運用上の標準:

- 本番デプロイは `main` にマージされた変更を起点に実行する
- Pull Request 用ブランチでは本番デプロイしない
- Sanity webhook は公開コンテンツ更新のデプロイトリガーとして併用する
- staging 環境を将来追加する場合は、本番 workflow と分離して管理する

---

## 4. GitHub Actions の設定値

このリポジトリは `deploy-site.yml` / `deploy-studio.yml` で `vars.*` / `secrets.*` を参照する。

Repository Variables:

- `PUBLIC_SITE_URL`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `TF_STATE_BUCKET_NAME`
- `TF_STATE_KEY`
- `TF_STATE_REGION`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `SANITY_FALLBACK_MODE`（本番 deploy は `never`）

Repository Secrets:

- `SANITY_PROJECT_ID`
- `SANITY_READ_TOKEN`（公開データのみなら不要な場合もあるが、運用上は設定推奨）
- `AWS_DEPLOY_ROLE_ARN`

備考:

- 将来 Environment secrets/variables に移行する場合でも、同じキー名を使えば workflow 側の参照コード変更は不要
- `deploy-studio.yml` は `terraform -chdir=infra output -raw` で `studio_bucket_name` / `studio_cloudfront_distribution_id` を取得する

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

## 5.1 Infra（Terraform）適用の責務

`deploy-studio.yml` は Terraform state から `studio_bucket_name` / `studio_cloudfront_distribution_id` を読むだけで、`terraform apply` は実行しない。

そのため、Studio 配信基盤の作成・変更は別途 `terraform apply` で確定させる必要がある。

実行主体（どちらかを採用）:

- 手動運用: インフラ管理者がローカル環境で実行
- 自動運用: 専用の infra workflow（例: `infra-apply.yml`）で実行

最低限の運用ルール:

1. 初回セットアップ時に `terraform -chdir=infra apply` を実行して state を作成する
2. `infra/` 変更時は、先に `terraform apply` を実行して state を更新する
3. その後に `Deploy Studio` を実行する（または `main` push で自動起動を待つ）

`infra` で IAM deploy ロールを管理する場合、以下を `tfvars` に設定しておく。

- `site_bucket_name`
- `site_cloudfront_distribution_arn`
- `tf_state_bucket_name`
- `tf_state_key`

---

## 6. Sanity webhook 連携（repository_dispatch）

Sanity 側の publish / unpublish を契機に GitHub `Deploy Site` workflow を起動する場合、Sanity webhook の HTTP request を GitHub API に向ける。

この連携は以下の対応関係で動く。

1. Sanity webhook が GitHub REST API の `POST /repos/<owner>/<repo>/dispatches` を呼び出す
2. GitHub API が `repository_dispatch` イベントを対象 repository に作成する
3. `.github/workflows/deploy-site.yml` の `on.repository_dispatch.types` が `event_type` と一致すると site deploy workflow が起動する

このため、Sanity webhook の `Projection` で送信 body に設定する `event_type` は、`deploy-site.yml` の `repository_dispatch.types` と一致させる必要がある。

```yaml
on:
  repository_dispatch:
    types:
      - sanity-content-changed
```

```json
{
  "event_type": "sanity-content-changed"
}
```

GitHub PAT の権限は `Deploy Site` workflow を直接操作する権限ではなく、`repository_dispatch` イベントを repository に作成するための権限として判定される。  
そのため Fine-grained PAT では `Actions: Read and write` ではなく、GitHub API の `Create a repository dispatch event` 要件に従って `Contents: Read and write` を付与する。

Sanity 管理画面（Project > API > Webhooks）で以下を設定する。

- Name: `github-deploy-on-publish`
- URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
- Dataset: `production`（運用 dataset に合わせる）
- Trigger: publish / unpublish
- HTTP Method: `POST`
- API version: 最新安定版（UI 既定値で可）

- URL: `https://api.github.com/repos/<owner>/<repo>/dispatches`
- Method: `POST`
- Header:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <dispatch token>`
- Projection:

```groq
{
  "event_type": "sanity-content-changed"
}
```

Sanity webhook では送信 body を `Payload` や `Body` ではなく `Projection` で定義する。  
`Projection` を空にすると、変更された Sanity document 全体が body として送信され、GitHub API 側で `event_type` 不足の 422 になる。

dispatch token は次のいずれかを使い、Sanity webhook の HTTP Header に設定する。

重要:

- GitHub PAT は Sanity webhook の `Secret` 欄ではなく、HTTP Header の `Authorization` に設定する
- Sanity webhook の `Secret` 欄は、受信側が `X-Sanity-Signature` を検証するための署名用 secret であり、GitHub API 認証には使わない
- この構成では GitHub API が `Authorization: Bearer <dispatch token>` を検証するため、`Secret` 欄は未設定でよい

- Fine-grained PAT: 対象 repo に対して `Contents: Read and write`（最低限）
- Classic PAT: `repo`（必要最小限で運用）

確認方法（GitHub 側受け口テスト）:

```bash
gh api repos/<owner>/<repo>/dispatches -X POST -f event_type='sanity-content-changed'
```

期待結果:

- 成功時は HTTP 204（出力なし）
- 403 の場合は dispatch token 権限不足。Fine-grained PAT では `Contents: Read and write` と対象 repository へのアクセスを確認する
- 422 の場合は body 不正。Sanity webhook の `Projection` が `{ "event_type": "sanity-content-changed" }` になっていることを確認する
- 404 の場合は owner/repo の指定ミスまたはトークン対象外

---

## 7. 必要なシークレット

例:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `SANITY_READ_TOKEN`（必要な場合）
- `SANITY_FALLBACK_MODE`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` または OIDC によるロール引受
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `AWS_DEPLOY_ROLE_ARN`

可能なら長期鍵ではなく GitHub OIDC を優先する。

Sanity webhook を GitHub `repository_dispatch` に接続する場合は、GitHub 側で dispatch 実行用トークンも別途必要になる。

---

## 8. Sanity fallback の扱い

`SANITY_FALLBACK_MODE` は、Sanity から取得できない場合にローカルの fallback content を使うかを制御する。

- `auto`: Sanity 未設定時のみ fallback を使う。Sanity 接続済みで fetch に失敗した場合は build を失敗させる
- `always`: Sanity には接続せず、常に fallback を使う。オフラインの UI 確認用
- `never`: fallback を使わない。本番 deploy ではこの値を使う

本番 deploy で fallback を許可すると、Sanity 障害や設定ミスのままサンプル記事を公開する可能性があるため、`deploy-site.yml` では `SANITY_FALLBACK_MODE=never` を固定する。

fallback content は `src/lib/content/fallback.ts` にある固定データであり、`tmp/` 配下の記事パッケージを自動的に読むものではない。`tmp/<package-dir>` の記事をフロントエンドで確認するには、import スクリプトで Sanity Draft を作成し、Sanity Studio で内容確認後に publish する。

---

## 9. S3 配置時の注意

- immutable にできるアセットは長めにキャッシュする
- HTML の Content-Type を正しく扱う
- 削除済みファイルを消すため、必要に応じて `--delete` を使う

例:

- `aws s3 sync dist/ s3://$S3_BUCKET_NAME --delete`

---

## 10. CloudFront の注意

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
3. `Deploy Site` workflow を実行する
4. `s3 sync` と CloudFront invalidation の成功を確認する
5. 公開サイトで主要ページと問題ページを再確認する

---

## 12. リポジトリ実装との対応

- CI workflow: `.github/workflows/ci.yml`
- Site deploy workflow: `.github/workflows/deploy-site.yml`
- Studio deploy workflow: `.github/workflows/deploy-studio.yml`
- Terraform: `infra/`（任意。既存 AWS リソース利用時は適用不要）

---

## 13. Terraform 運用手順（Studio）

前提:

- `infra/` の backend は S3 を使用する
- `deploy-studio.yml` の `TF_STATE_BUCKET_NAME` / `TF_STATE_KEY` / `TF_STATE_REGION` が、`terraform apply` 時と同一である

初回または `infra/` 変更時:

```bash
terraform -chdir=infra init \
  -backend-config="bucket=<tf-state-bucket>" \
  -backend-config="key=<tf-state-key>" \
  -backend-config="region=<tf-state-region>"
terraform -chdir=infra plan
terraform -chdir=infra apply
```

確認:

```bash
terraform -chdir=infra output -raw studio_bucket_name
terraform -chdir=infra output -raw studio_cloudfront_distribution_id
```

この output が取得できる状態になってから `Deploy Studio` を実行する。
