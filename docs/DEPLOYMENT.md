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

## 4. 必要なシークレット

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

## 5. S3 配置時の注意

- immutable にできるアセットは長めにキャッシュする
- HTML の Content-Type を正しく扱う
- 削除済みファイルを消すため、必要に応じて `--delete` を使う

例:

- `aws s3 sync dist/ s3://$S3_BUCKET_NAME --delete`

---

## 6. CloudFront の注意

- S3 を origin とする
- invalidation 対象の例:
  - `/index.html`
  - `/blog/*`
  - `/tags/*`
  - `/rss.xml`
  - `/sitemap*`

MVP では更新頻度が低い前提で、必要なら `/*` の全体 invalidation でもよい。

---

## 7. ドメインと TLS

独自ドメインを使う場合:

- Route53 または他の DNS を使う
- ACM 証明書は `us-east-1` で発行する
- CloudFront に証明書を関連付ける

---

## 8. ロールバック

ロールバック方針:

- 可能なら直前のビルド成果物を保持する
- 直近の正常版を再デプロイする
- コンテンツ起因なら Sanity 側で修正・復元する
- コード起因なら Git を戻して CI を再実行する

実装後は、実際のロールバック手順をこの文書に追記すること。

## 9. リポジトリ実装との対応

- CI workflow: `.github/workflows/ci.yml`
- Deploy workflow: `.github/workflows/deploy.yml`
- Terraform: `infra/`
